from rest_framework import viewsets, permissions, serializers
from rest_framework.exceptions import PermissionDenied
from .models import Prescription
from .serializers import PrescriptionSerializer
from appointments.models import Appointment

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', None) == 'admin':
            return Prescription.objects.all()
        role = getattr(user, 'role', None)
        if role == 'doctor':
            return Prescription.objects.filter(appointment__doctor=user)
        if role == 'patient':
            return Prescription.objects.filter(appointment__patient=user)
        return Prescription.objects.none()

    def perform_create(self, serializer):
        appointment = serializer.validated_data['appointment']
        if appointment.doctor != self.request.user:
            raise PermissionDenied("You are not the doctor for this appointment.")
        if appointment.status != 'accepted':
            raise serializers.ValidationError("Prescriptions can only be added to 'accepted' appointments.")
        if Prescription.objects.filter(appointment=appointment).exists():
            raise serializers.ValidationError("A prescription already exists for this appointment.")
        serializer.save()

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        user = self.request.user
        if getattr(user, 'role', None) == 'admin' or user.is_staff:
            if 'details' in request.data:
                raise PermissionDenied("Admins cannot change the original prescription details.")
            return super().partial_update(request, *args, **kwargs)
        elif instance.appointment.doctor == user:
            if 'admin_notes' in request.data:
                raise PermissionDenied("Only an admin can add or edit administrative notes.")
            return super().partial_update(request, *args, **kwargs)
        else:
            raise PermissionDenied("You do not have permission to edit this prescription.")