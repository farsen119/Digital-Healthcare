from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, date
import pytz
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
        try:
            # Get the data before saving
            data = serializer.validated_data
            doctor = data.get('doctor')
            appointment_date = data.get('date')
            appointment_time = data.get('time')
            
            # Check slot availability BEFORE creating the appointment
            if doctor and doctor.doctor_type == 'visiting':
                # Check if the selected date and time slot is available
                is_available = VisitingDoctorService.is_slot_available(doctor, appointment_date, appointment_time)
                
                if not is_available:
                    raise serializers.ValidationError("Selected date and time slot is not available")
            
            # Now create the appointment
            user = self.request.user
            if user.is_authenticated and hasattr(user, 'role') and user.role == 'patient':
                appointment = serializer.save(patient=user)
            else:
                appointment = serializer.save()
            
            # Handle different booking types based on doctor type
            if doctor.doctor_type == 'permanent':
                # For permanent doctors, add to queue
                try:
                    queue_entry, _ = QueueService.add_patient_to_queue(
                        doctor, 
                        appointment.patient, 
                        appointment.reason
                    )
                    # Update appointment with queue info
                    appointment.queue_position = queue_entry.position
                    appointment.estimated_wait_time = queue_entry.estimated_wait_time
                    appointment.save()
                except ValueError as e:
                    # Queue is full
                    appointment.status = 'rejected'
                    appointment.save()
                    raise serializers.ValidationError(str(e))
            
            # --- Notification for Doctor ---
            Notification.objects.create(
                user=appointment.doctor,
                message=f"New appointment booked by {appointment.patient.get_full_name()} for {appointment.date} at {appointment.time}.",
                appointment=appointment
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in perform_create: {str(e)}")
            raise

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
        reason = request.data.get('reason', '')
        
        if not doctor_id:
            return Response({'error': 'doctor_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            doctor = CustomUser.objects.get(id=doctor_id, role='doctor', doctor_type='permanent')
        except CustomUser.DoesNotExist:
            return Response({'error': 'Doctor not found or not a permanent doctor'}, status=status.HTTP_404_NOT_FOUND)
        
        if not doctor.is_live or not doctor.is_available_for_consultation:
            return Response({'error': 'Doctor is not available for consultation'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            queue_entry, appointment = QueueService.add_patient_to_queue(doctor, request.user, reason)
            
            # Convert to IST for response
            ist_timezone = pytz.timezone('Asia/Kolkata')
            joined_at_ist = appointment.queue_joined_at.astimezone(ist_timezone) if appointment.queue_joined_at else None
            
            return Response({
                'message': f'Added to queue. Position: {queue_entry.position}, Estimated wait: {queue_entry.estimated_wait_time} minutes',
                'queue_position': queue_entry.position,
                'estimated_wait_time': queue_entry.estimated_wait_time,
                'appointment_id': appointment.id,
                'joined_at': joined_at_ist.strftime('%H:%M') if joined_at_ist else None,
                'joined_at_full': joined_at_ist.strftime('%Y-%m-%d %H:%M:%S IST') if joined_at_ist else None
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Log the error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error joining queue: {str(e)}")
            return Response({'error': 'An unexpected error occurred. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        
        try:
            queue_status = QueueService.get_queue_status(doctor)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting queue status: {str(e)}")
            return Response({'error': 'Failed to get queue status'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Serialize the data for frontend consumption
        from .serializers import DoctorQueueSerializer
        
        try:
            waiting_patients_data = []
            if queue_status.get('waiting_patients'):
                for patient in queue_status['waiting_patients']:
                    patient_data = DoctorQueueSerializer(patient).data
                    patient_data['patient_name'] = patient.patient.get_full_name() if patient.patient else 'Unknown'
                    patient_data['reason'] = patient.reason if hasattr(patient, 'reason') else 'No reason provided'
                    
                    # Get the appointment ID for this patient
                    appointment = Appointment.objects.filter(
                        doctor=doctor,
                        patient=patient.patient,
                        appointment_type='queue',
                        status='pending'
                    ).first()
                    patient_data['appointment_id'] = appointment.id if appointment else None
                    
                    waiting_patients_data.append(patient_data)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error serializing waiting patients: {str(e)}")
            waiting_patients_data = []
        
        try:
            consulting_patient_data = None
            if queue_status.get('consulting_patient'):
                patient = queue_status['consulting_patient']
                consulting_patient_data = DoctorQueueSerializer(patient).data
                consulting_patient_data['patient_name'] = patient.patient.get_full_name() if patient.patient else 'Unknown'
                consulting_patient_data['reason'] = patient.reason if hasattr(patient, 'reason') else 'No reason provided'
                consulting_patient_data['accepted_at'] = patient.joined_at
                
                # Get the appointment ID for this patient
                appointment = Appointment.objects.filter(
                    doctor=doctor,
                    patient=patient.patient,
                    appointment_type='queue',
                    status='accepted'
                ).first()
                consulting_patient_data['appointment_id'] = appointment.id if appointment else None
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error serializing consulting patient: {str(e)}")
            consulting_patient_data = None
        
        # Serialize accepted patients
        try:
            accepted_patients_data = []
            if queue_status.get('accepted_patients'):
                for patient in queue_status['accepted_patients']:
                    patient_data = DoctorQueueSerializer(patient).data
                    patient_data['patient_name'] = patient.patient.get_full_name() if patient.patient else 'Unknown'
                    patient_data['reason'] = patient.reason if hasattr(patient, 'reason') else 'No reason provided'
                    patient_data['accepted_at'] = patient.joined_at
                    
                    # Get the appointment ID for this patient
                    appointment = Appointment.objects.filter(
                        doctor=doctor,
                        patient=patient.patient,
                        appointment_type='queue',
                        status='accepted'
                    ).first()
                    patient_data['appointment_id'] = appointment.id if appointment else None
                    
                    accepted_patients_data.append(patient_data)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error serializing accepted patients: {str(e)}")
            accepted_patients_data = []
        
        # Serialize current_patient if it exists
        try:
            current_patient_data = None
            if queue_status.get('current_patient'):
                current_patient = queue_status['current_patient']
                current_patient_data = {
                    'id': current_patient.id,
                    'name': current_patient.get_full_name(),
                    'email': current_patient.email
                }
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error serializing current patient: {str(e)}")
            current_patient_data = None
        
        response_data = {
            'waiting_count': queue_status.get('waiting_count', 0),
            'waiting_patients': waiting_patients_data,
            'consulting_patient': consulting_patient_data,
            'accepted_patients': accepted_patients_data,
            'max_queue_size': queue_status.get('max_queue_size', 10),
            'is_consulting': queue_status.get('is_consulting', False),
            'current_patient': current_patient_data
        }
        
        return Response(response_data)

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

    @action(detail=False, methods=['post'], url_path='reject-patient')
    def reject_patient(self, request):
        """Reject a patient from queue (for doctors)"""
        patient_id = request.data.get('patient_id')
        if not patient_id:
            return Response({'error': 'patient_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            patient = CustomUser.objects.get(id=patient_id, role='patient')
        except CustomUser.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            success = QueueService.remove_patient_from_queue(request.user, patient)
            if success:
                return Response({
                    'message': f'Patient {patient.get_full_name()} rejected from queue',
                    'patient_name': patient.get_full_name()
                })
            else:
                return Response({'error': 'Patient not found in queue'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='accept-patient')
    def accept_patient(self, request):
        """Accept a specific patient from queue (for doctors)"""
        patient_id = request.data.get('patient_id')
        if not patient_id:
            return Response({'error': 'patient_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            patient = CustomUser.objects.get(id=patient_id, role='patient')
        except CustomUser.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            # Find the queue entry for this patient
            queue_entry = DoctorQueue.objects.filter(
                doctor=request.user,
                patient=patient,
                status='waiting'
            ).first()
            
            if not queue_entry:
                return Response({'error': 'Patient not found in queue'}, status=status.HTTP_404_NOT_FOUND)
            
            # Update queue status to accepted
            queue_entry.status = 'accepted'
            queue_entry.save()
            
            # Update doctor status
            request.user.is_consulting = True
            request.user.current_patient = patient
            request.user.save()
            
            # Update appointment status with IST time
            ist_timezone = pytz.timezone('Asia/Kolkata')
            current_time_ist = timezone.now().astimezone(ist_timezone)
            
            appointment = Appointment.objects.filter(
                doctor=request.user,
                patient=patient,
                appointment_type='queue',
                status='pending'
            ).first()
            
            if appointment:
                appointment.status = 'accepted'
                appointment.consultation_started_at = current_time_ist
                appointment.save()
            
            return Response({
                'message': f'Patient {patient.get_full_name()} accepted successfully',
                'patient_name': patient.get_full_name(),
                'appointment_id': appointment.id if appointment else None
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # Visiting Doctor Schedule Endpoints
    @action(detail=False, methods=['get'], url_path='available-slots/(?P<doctor_id>[^/.]+)')
    def available_slots(self, request, doctor_id):
        """Get available time slots for a doctor on a specific date"""
        try:
            doctor = CustomUser.objects.get(id=doctor_id, role='doctor')
            date_str = request.query_params.get('date')
            
            if not date_str:
                return Response({'error': 'Date parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                appointment_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
            
            if doctor.doctor_type == 'permanent':
                # For permanent doctors, return current time slots
                from .services import QueueService
                queue_status = QueueService.get_queue_status(doctor)
                return Response({
                    'doctor_type': 'permanent',
                    'queue_status': queue_status,
                    'message': 'Permanent doctors use queue system. No specific time slots needed.'
                })
            else:
                # For visiting doctors, return available slots
                from .services import VisitingDoctorService
                available_slots = VisitingDoctorService.get_available_slots(doctor, appointment_date)
                
                # Format slots for frontend
                formatted_slots = []
                for slot in available_slots:
                    formatted_slots.append({
                        'time': slot.strftime('%H:%M'),
                        'display': slot.strftime('%I:%M %p')
                    })
                
                return Response({
                    'doctor_type': 'visiting',
                    'available_slots': formatted_slots,
                    'date': date_str
                })
                
        except CustomUser.DoesNotExist:
            return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='available-dates/(?P<doctor_id>[^/.]+)')
    def available_dates(self, request, doctor_id):
        """Get available dates for a visiting doctor"""
        try:
            doctor = CustomUser.objects.get(id=doctor_id, role='doctor')
            
            if doctor.doctor_type == 'permanent':
                return Response({
                    'doctor_type': 'permanent',
                    'message': 'Permanent doctors are available daily. No specific dates needed.'
                })
            else:
                # For visiting doctors, return available dates
                from .services import VisitingDoctorService
                available_dates = VisitingDoctorService.get_available_dates(doctor)
                
                # Format dates for frontend
                formatted_dates = []
                for date_obj in available_dates:
                    formatted_dates.append({
                        'date': date_obj.strftime('%Y-%m-%d'),
                        'display': date_obj.strftime('%A, %B %d, %Y'),
                        'day_name': date_obj.strftime('%A')
                    })
                
                return Response({
                    'doctor_type': 'visiting',
                    'available_dates': formatted_dates
                })
                
        except CustomUser.DoesNotExist:
            return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='cleanup-queue')
    def cleanup_queue(self, request):
        """Clean up old queue entries (admin only)"""
        if not request.user.is_staff:
            return Response({'error': 'Only administrators can perform this action'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            cleaned_count = QueueService.cleanup_old_queue_entries()
            return Response({
                'message': f'Successfully cleaned up {cleaned_count} old queue entries',
                'cleaned_count': cleaned_count
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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