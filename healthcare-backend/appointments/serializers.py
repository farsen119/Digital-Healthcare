from rest_framework import serializers
from .models import Appointment

# This import is necessary to include the prescription details
from prescriptions.serializers import PrescriptionSerializer

class AppointmentSerializer(serializers.ModelSerializer):
    # These fields get data from the related 'doctor' user object
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    doctor_specialization = serializers.CharField(source='doctor.specialization', read_only=True)
    
    # This field gets the patient's name
    patient_name_display = serializers.SerializerMethodField()
    
    # This field includes the full prescription object
    prescription = PrescriptionSerializer(read_only=True)
    
    class Meta:
        model = Appointment
        # This list defines all the fields that will be sent by the API.
        # We must include 'prescription' and 'doctor_specialization' here.
        fields = [
            'id', 'patient', 'doctor', 'doctor_name',
            'date', 'time', 'reason', 'status', 'created_at', 'patient_name_display',
            'prescription',
            'doctor_specialization'
        ]
        read_only_fields = ['status', 'created_at', 'doctor_name', 'patient_name_display']

    def get_patient_name_display(self, obj):
        if obj.patient:
            return obj.patient.get_full_name()
        return obj.patient_name

# 2. ADD THIS LINE. This creates the nested relationship.
    #    The 'prescription' field will now be populated by the PrescriptionSerializer.

      # You can leave your read_only_fields as they are. 'prescription' is already
        # read-only from how we defined it above, so you don't need to add it here.