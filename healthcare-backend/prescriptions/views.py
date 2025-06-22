# from rest_framework import viewsets, permissions
# from .models import Prescription
# from .serializers import PrescriptionSerializer

# # TODO: Create a custom permission to ensure only the doctor
# # associated with the appointment can create a prescription.
# class IsOwnerOrReadOnly(permissions.BasePermission):
#     """
#     Custom permission to only allow owners of an object to edit it.
#     """
#     def has_object_permission(self, request, view, obj):
#         # Read permissions are allowed to any request,
#         # so we'll always allow GET, HEAD or OPTIONS requests.
#         if request.method in permissions.SAFE_METHODS:
#             return True

#         # Write permissions are only allowed to the doctor of the appointment.
#         return obj.appointment.doctor == request.user


# class PrescriptionViewSet(viewsets.ModelViewSet):
#     """
#     API endpoint that allows prescriptions to be viewed or created.
#     """
#     queryset = Prescription.objects.all()
#     serializer_class = PrescriptionSerializer
#     # You should add permissions to ensure this is secure!
#     permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

#     def get_queryset(self):
#         """
#         This view should return a list of all the prescriptions
#         for the currently authenticated user.
#         """
#         user = self.request.user
#         if user.is_staff or user.role == 'admin':
#             return Prescription.objects.all()
#         if user.role == 'doctor':
#             return Prescription.objects.filter(appointment__doctor=user)
#         if user.role == 'patient':
#             return Prescription.objects.filter(appointment__patient=user)
#         return Prescription.objects.none()

#     def perform_create(self, serializer):
#         # You can add validation logic here before saving
#         # For example, check if the appointment status is 'accepted'
#         appointment = serializer.validated_data['appointment']
#         if appointment.doctor != self.request.user:
#             raise permissions.PermissionDenied("You are not the doctor for this appointment.")
#         if appointment.status != 'accepted':
#             raise serializers.ValidationError("Prescriptions can only be added to 'accepted' appointments.")

#         serializer.save()


from rest_framework import viewsets, permissions, serializers  # <-- I ADDED 'serializers' HERE
from .models import Prescription
from .serializers import PrescriptionSerializer
from appointments.models import Appointment


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write permissions are only allowed to the doctor of the appointment.
        return obj.appointment.doctor == request.user


class PrescriptionViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows prescriptions to be viewed or created.
    """
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        """
        This view returns a list of prescriptions based on the user's role.
        """
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
        """
        Custom logic to run when a new prescription is created.
        """
        appointment = serializer.validated_data['appointment']

        # Check if the user making the request is the doctor assigned to the appointment
        if appointment.doctor != self.request.user:
            raise permissions.PermissionDenied("You are not the doctor for this appointment.")

        # Check if the appointment status is 'accepted'
        if appointment.status != 'accepted':
            # This is the line that caused the error before
            raise serializers.ValidationError("Prescriptions can only be added to 'accepted' appointments.")

        # Check if a prescription already exists for this appointment
        if Prescription.objects.filter(appointment=appointment).exists():
             raise serializers.ValidationError("A prescription already exists for this appointment.")

        serializer.save()
