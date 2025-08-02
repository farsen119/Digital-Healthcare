from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Appointment
from .serializers import AppointmentSerializer
from notifications.models import Notification  # Make sure this import is correct

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