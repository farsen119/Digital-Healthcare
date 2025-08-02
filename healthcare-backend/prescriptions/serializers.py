from rest_framework import serializers
from .models import Prescription

class PrescriptionSerializer(serializers.ModelSerializer):
    # We will also add the doctor's name for consistency.
    doctor_name = serializers.CharField(source='appointment.doctor.get_full_name', read_only=True)
    appointment_date = serializers.CharField(source='appointment.date', read_only=True)
    patient_name = serializers.CharField(source='appointment.patient.get_full_name', read_only=True)

    class Meta:
        model = Prescription
        fields = [
            'id',
            'appointment',
            'doctor_name',
            'appointment_date',
            'patient_name',
            'details',
            'created_at',
            'admin_notes',
        ]
    





    
        # By removing 'extra_kwargs', 'appointment' is now readable and writeable.

#  # To show the patient's name in the API response for convenience
#     patient_name = serializers.CharField(source='appointment.patient_name_display', read_only=True)


#  # Make the appointment field write-only on creation
#         # You can't change the appointment for an existing prescription
#         extra_kwargs = {
#             'appointment': {'write_only': True}
#         }
