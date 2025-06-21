from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Appointment
from .serializers import AppointmentSerializer

class IsDoctorOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow only admins or the assigned doctor to update status.
    """
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
        # Allow admins and assigned doctor to update the status
        if self.action in ['update', 'partial_update', 'destroy', 'update_status']:
            return [IsDoctorOrAdmin()]
        # Allow any authenticated user to list or view appointments (queryset will filter them)
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        # Allow any user to create (perform_create will handle patient assignment)
        return [permissions.AllowAny()]

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
            serializer.save(patient=user)
        else:
            # This allows an admin to create an appointment for anyone
            serializer.save()

    @action(detail=True, methods=['patch'], url_path='status', url_name='update_status', permission_classes=[IsDoctorOrAdmin])
    def update_status(self, request, pk=None):
        """
        Custom action to update the status of a single appointment.
        Called via PATCH /api/appointments/{id}/status/
        """
        appointment = self.get_object()
        new_status = request.data.get('status')

        if not new_status:
            return Response(
                {'error': 'The "status" field is required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        appointment.status = new_status
        appointment.save(update_fields=['status']) # More efficient save

        serializer = self.get_serializer(appointment)
        return Response(serializer.data)