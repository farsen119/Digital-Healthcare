from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, date
from .models import Appointment, DoctorQueue, VisitingDoctorSchedule
from .serializers import AppointmentSerializer, DoctorQueueSerializer, VisitingDoctorScheduleSerializer
from .services import QueueService, VisitingDoctorService
from notifications.models import Notification  # Make sure this import is correct
from users.models import CustomUser # Added for new endpoints

class IsDoctorOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user.is_authenticated:
            return False
        if hasattr(user, 'role') and user.role == 'admin':
            return True
        if hasattr(user, 'role') and user.role == 'doctor' and obj.doctor == user:
            return True
        return False

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().order_by('-created_at')
    serializer_class = AppointmentSerializer

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy', 'update_status']:
            return [IsDoctorOrAdmin()]
        if self.action == 'create':
            return [permissions.AllowAny()]  
        if self.action in ['list', 'retrieve', 'create']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if hasattr(user, 'role') and user.role == 'admin':
                return Appointment.objects.all().order_by('-created_at')
            elif hasattr(user, 'role') and user.role == 'doctor':
                return Appointment.objects.filter(doctor=user).order_by('-created_at')
            elif hasattr(user, 'role') and user.role == 'patient':
                return Appointment.objects.filter(patient=user).order_by('-created_at')
        return Appointment.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated and hasattr(user, 'role') and user.role == 'patient':
            appointment = serializer.save(patient=user)
        else:
            appointment = serializer.save()
        
        # Handle different booking types based on doctor type
        doctor = appointment.doctor
        if doctor.doctor_type == 'permanent':
            # For permanent doctors, add to queue
            try:
                queue_entry, _ = QueueService.add_patient_to_queue(doctor, appointment.patient)
                # Update appointment with queue info
                appointment.queue_position = queue_entry.position
                appointment.estimated_wait_time = queue_entry.estimated_wait_time
                appointment.save()
            except ValueError as e:
                # Queue is full
                appointment.status = 'rejected'
                appointment.save()
                raise serializers.ValidationError(str(e))
        else:
            # For visiting doctors, check if slot is available
            available_slots = VisitingDoctorService.get_available_slots(doctor, appointment.date)
            if appointment.time not in available_slots:
                appointment.status = 'rejected'
                appointment.save()
                raise serializers.ValidationError("Selected time slot is not available")
        
        # --- Notification for Doctor ---
        Notification.objects.create(
            user=appointment.doctor,
            message=f"New appointment booked by {appointment.patient.get_full_name()} for {appointment.date} at {appointment.time}.",
            appointment=appointment
        )

    @action(detail=True, methods=['patch'], url_path='status', url_name='update_status', permission_classes=[IsDoctorOrAdmin])
    def update_status(self, request, pk=None):
        appointment = self.get_object()
        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'The "status" field is required.'}, status=status.HTTP_400_BAD_REQUEST)
        appointment.status = new_status
        appointment.save(update_fields=['status'])
        # --- Notification for Patient ---
        if appointment.patient:
            Notification.objects.create(
                user=appointment.patient,
                message=f"Your appointment on {appointment.date} at {appointment.time} with Dr. {appointment.doctor.get_full_name()} was {new_status}.",
                appointment=appointment
            )
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)

    # Queue Management Endpoints
    @action(detail=False, methods=['post'], url_path='join-queue')
    def join_queue(self, request):
        """Join a permanent doctor's queue"""
        doctor_id = request.data.get('doctor_id')
        if not doctor_id:
            return Response({'error': 'doctor_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            doctor = CustomUser.objects.get(id=doctor_id, role='doctor', doctor_type='permanent')
        except CustomUser.DoesNotExist:
            return Response({'error': 'Doctor not found or not a permanent doctor'}, status=status.HTTP_404_NOT_FOUND)
        
        if not doctor.is_live or not doctor.is_available_for_consultation:
            return Response({'error': 'Doctor is not available for consultation'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            queue_entry, appointment = QueueService.add_patient_to_queue(doctor, request.user)
            return Response({
                'message': f'Added to queue. Position: {queue_entry.position}, Estimated wait: {queue_entry.estimated_wait_time} minutes',
                'queue_position': queue_entry.position,
                'estimated_wait_time': queue_entry.estimated_wait_time,
                'appointment_id': appointment.id
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='leave-queue')
    def leave_queue(self, request):
        """Leave a permanent doctor's queue"""
        doctor_id = request.data.get('doctor_id')
        if not doctor_id:
            return Response({'error': 'doctor_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            doctor = CustomUser.objects.get(id=doctor_id, role='doctor')
        except CustomUser.DoesNotExist:
            return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if QueueService.remove_patient_from_queue(doctor, request.user):
            return Response({'message': 'Successfully left the queue'})
        else:
            return Response({'error': 'Not found in queue'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='queue-status/(?P<doctor_id>[^/.]+)')
    def queue_status(self, request, doctor_id):
        """Get current queue status for a doctor"""
        try:
            doctor = CustomUser.objects.get(id=doctor_id, role='doctor')
        except CustomUser.DoesNotExist:
            return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)
        
        queue_status = QueueService.get_queue_status(doctor)
        return Response(queue_status)

    @action(detail=False, methods=['post'], url_path='start-consultation')
    def start_consultation(self, request):
        """Start consultation with next patient (for doctors)"""
        patient_id = request.data.get('patient_id')
        if not patient_id:
            return Response({'error': 'patient_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            patient = CustomUser.objects.get(id=patient_id, role='patient')
        except CustomUser.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            queue_entry = QueueService.start_consultation(request.user, patient)
            return Response({
                'message': f'Started consultation with {patient.get_full_name()}',
                'patient_name': patient.get_full_name()
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='complete-consultation')
    def complete_consultation(self, request):
        """Complete current consultation and move to next patient (for doctors)"""
        try:
            QueueService.complete_consultation(request.user)
            return Response({'message': 'Consultation completed. Next patient in queue.'})
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # Visiting Doctor Schedule Endpoints
    @action(detail=False, methods=['get'], url_path='available-slots/(?P<doctor_id>[^/.]+)')
    def available_slots(self, request, doctor_id):
        """Get available time slots for a visiting doctor on a specific date"""
        target_date = request.query_params.get('date')
        if not target_date:
            return Response({'error': 'date parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            target_date = datetime.strptime(target_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            doctor = CustomUser.objects.get(id=doctor_id, role='doctor', doctor_type='visiting')
        except CustomUser.DoesNotExist:
            return Response({'error': 'Doctor not found or not a visiting doctor'}, status=status.HTTP_404_NOT_FOUND)
        
        available_slots = VisitingDoctorService.get_available_slots(doctor, target_date)
        slots_formatted = [slot.strftime('%H:%M') for slot in available_slots]
        
        return Response({
            'doctor_id': doctor_id,
            'date': target_date.strftime('%Y-%m-%d'),
            'available_slots': slots_formatted
        })

class DoctorQueueViewSet(viewsets.ModelViewSet):
    """ViewSet for managing doctor queues"""
    queryset = DoctorQueue.objects.all()
    serializer_class = DoctorQueueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return DoctorQueue.objects.all()
        elif user.role == 'doctor':
            return DoctorQueue.objects.filter(doctor=user)
        elif user.role == 'patient':
            return DoctorQueue.objects.filter(patient=user)
        return DoctorQueue.objects.none()

class VisitingDoctorScheduleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing visiting doctor schedules"""
    queryset = VisitingDoctorSchedule.objects.all()
    serializer_class = VisitingDoctorScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return VisitingDoctorSchedule.objects.all()
        elif user.role == 'doctor':
            return VisitingDoctorSchedule.objects.filter(doctor=user)
        return VisitingDoctorSchedule.objects.none()