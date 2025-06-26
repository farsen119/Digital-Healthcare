from rest_framework import serializers
from .models import Prescription

class PrescriptionSerializer(serializers.ModelSerializer):
    # --- THIS IS THE FIX ---
    # We are adding a special computed field to THIS serializer.
    patient_name = serializers.SerializerMethodField()
    
    # We will also add the doctor's name for consistency.
    doctor_name = serializers.CharField(source='appointment.doctor.get_full_name', read_only=True)
    appointment_date = serializers.CharField(source='appointment.date', read_only=True)

    class Meta:
        model = Prescription
        # The 'fields' list must include the new 'patient_name' field.
        fields = [
            'id',
            'appointment',
            'patient_name',      # This will be populated by the method below
            'doctor_name',
            'appointment_date',
            'details',
            'created_at',
            'admin_notes',
        ]

    # --- THIS IS THE METHOD THAT PERFORMS THE FIX ---
    # This method is called automatically for the 'patient_name' field.
    # It looks at the prescription's related appointment and gets the correct name.
    def get_patient_name(self, obj):
        # 'obj' is the prescription instance.
        appointment = obj.appointment
        if appointment.patient:
            # If it's a registered user, get their full name.
            return appointment.patient.get_full_name()
        # If it's a guest, return the name they typed in.
        return appointment.patient_name
    





    
        # By removing 'extra_kwargs', 'appointment' is now readable and writeable.

#  # To show the patient's name in the API response for convenience
#     patient_name = serializers.CharField(source='appointment.patient_name_display', read_only=True)


#  # Make the appointment field write-only on creation
#         # You can't change the appointment for an existing prescription
#         extra_kwargs = {
#             'appointment': {'write_only': True}
#         }
