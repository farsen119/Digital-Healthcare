from rest_framework import viewsets, permissions
from .models import Appointment
from .serializers import AppointmentSerializer

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().order_by('-created_at')
    serializer_class = AppointmentSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.role == 'admin':
                return Appointment.objects.all().order_by('-created_at')
            elif user.role == 'doctor':
                return Appointment.objects.filter(doctor=user).order_by('-created_at')
            elif user.role == 'patient':
                return Appointment.objects.filter(patient=user).order_by('-created_at')
        return Appointment.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated and hasattr(user, 'role') and user.role == 'patient':
            serializer.save(patient=user)
        else:
            serializer.save()