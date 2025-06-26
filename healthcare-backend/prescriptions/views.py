from rest_framework import viewsets, permissions, serializers
from rest_framework.exceptions import PermissionDenied
from .models import Prescription
from .serializers import PrescriptionSerializer
from appointments.models import Appointment

# 1. DELETE this entire class. We no longer need it.
# class IsOwnerOrReadOnly(permissions.BasePermission):
#     """
#     ...
#     """
#     def has_object_permission(self, request, view, obj):
#         ...

class PrescriptionViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows prescriptions to be viewed or created.
    """
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    
    # 2. CHANGE this line to only require that the user is logged in.
    # Our custom method below will handle the detailed permissions.
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # ... this method is correct, no changes needed ...
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
        # ... this method is correct, no changes needed ...
        appointment = serializer.validated_data['appointment']
        if appointment.doctor != self.request.user:
            raise PermissionDenied("You are not the doctor for this appointment.")
        if appointment.status != 'accepted':
            raise serializers.ValidationError("Prescriptions can only be added to 'accepted' appointments.")
        if Prescription.objects.filter(appointment=appointment).exists():
             raise serializers.ValidationError("A prescription already exists for this appointment.")
        serializer.save()

    def partial_update(self, request, *args, **kwargs):
        # ... this method is correct and will now work as intended ...
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








# from rest_framework import viewsets, permissions, serializers  # <-- I ADDED 'serializers' HERE
# from rest_framework.exceptions import PermissionDenied
# from .models import Prescription
# from .serializers import PrescriptionSerializer
# from appointments.models import Appointment


# # # TODO: Create a custom permission to ensure only the doctor
# # # associated with the appointment can create a prescription.
# class IsOwnerOrReadOnly(permissions.BasePermission):
#     """
#     Custom permission to only allow owners of an object to edit it.
#     Custom permission to only allow owners of an object to edit it.
#     """
#     def has_object_permission(self, request, view, obj):
#          # Read permissions are allowed to any request,
# #         # so we'll always allow GET, HEAD or OPTIONS requests.
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
#         This view returns a list of prescriptions based on the user's role.
#         """
#         user = self.request.user
#         if user.is_staff or getattr(user, 'role', None) == 'admin':
#             return Prescription.objects.all()
        
#         role = getattr(user, 'role', None)
#         if role == 'doctor':
#             return Prescription.objects.filter(appointment__doctor=user)
#         if role == 'patient':
#             return Prescription.objects.filter(appointment__patient=user)
        
#         return Prescription.objects.none()

#     def perform_create(self, serializer):
#         """
#         Custom logic to run when a new prescription is created.
#         """
#         appointment = serializer.validated_data['appointment']

#         # Check if the user making the request is the doctor assigned to the appointment
#         if appointment.doctor != self.request.user:
#             raise permissions.PermissionDenied("You are not the doctor for this appointment.")

#         # Check if the appointment status is 'accepted'
#         if appointment.status != 'accepted':
#             # This is the line that caused the error before
#             raise serializers.ValidationError("Prescriptions can only be added to 'accepted' appointments.")

#         # Check if a prescription already exists for this appointment
#         if Prescription.objects.filter(appointment=appointment).exists():
#              raise serializers.ValidationError("A prescription already exists for this appointment.")

#         serializer.save()


#     def partial_update(self, request, *args, **kwargs):
#         """
#         Custom PATCH logic to enforce admin/doctor permissions.
#         """
#         instance = self.get_object()
#         user = self.request.user

#         # Scenario 1: User is an Admin
#         if getattr(user, 'role', None) == 'admin' or user.is_staff:
#             # Admins are NOT allowed to change the original prescription details.
#             if 'details' in request.data:
#                 raise PermissionDenied("Admins cannot change the original prescription details.")
#             # Admins can proceed to update other fields (like admin_notes).
#             return super().partial_update(request, *args, **kwargs)

#         # Scenario 2: User is the Doctor who created the prescription
#         elif instance.appointment.doctor == user:
#             # Doctors are NOT allowed to change admin notes.
#             if 'admin_notes' in request.data:
#                 raise PermissionDenied("Only an admin can add or edit administrative notes.")
#             # Doctors can proceed to update their own prescription details.
#             return super().partial_update(request, *args, **kwargs)
            
#         # Scenario 3: Any other user
#         else:
#             raise PermissionDenied("You do not have permission to edit this prescription.")
