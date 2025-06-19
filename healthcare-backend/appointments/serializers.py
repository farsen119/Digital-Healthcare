from rest_framework import serializers
from .models import Appointment

class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    patient_name_display = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'doctor', 'patient_name', 'patient_email', 'doctor_name',
            'date', 'time', 'reason', 'status', 'created_at', 'patient_name_display'
        ]
        read_only_fields = ['status', 'created_at', 'doctor_name', 'patient_name_display']

    def get_patient_name_display(self, obj):
        if obj.patient:
            return obj.patient.get_full_name()
        return obj.patient_name