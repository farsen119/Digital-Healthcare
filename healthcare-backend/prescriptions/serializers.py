from rest_framework import serializers
from .models import Prescription

class PrescriptionSerializer(serializers.ModelSerializer):
    # To show the patient's name in the API response for convenience
    patient_name = serializers.CharField(source='appointment.patient_name_display', read_only=True)

    class Meta:
        model = Prescription
        fields = [
            'id',
            'appointment', # This will be the ID of the related appointment
            'patient_name',
            'details',
            'created_at',
        ]
        # Make the appointment field write-only on creation
        # You can't change the appointment for an existing prescription
        extra_kwargs = {
            'appointment': {'write_only': True}
        }
