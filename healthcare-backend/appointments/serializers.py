from rest_framework import serializers
from .models import Appointment, DoctorQueue, VisitingDoctorSchedule
from users.models import CustomUser

# This import is necessary to include the prescription details
from prescriptions.serializers import PrescriptionSerializer

class DoctorQueueSerializer(serializers.ModelSerializer):
    """Serializer for doctor queue entries"""
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    
    class Meta:
        model = DoctorQueue
        fields = [
            'id', 'doctor', 'doctor_name', 'patient', 'patient_name',
            'position', 'joined_at', 'estimated_wait_time', 'status'
        ]
        read_only_fields = ['joined_at', 'estimated_wait_time']

class VisitingDoctorScheduleSerializer(serializers.ModelSerializer):
    """Serializer for visiting doctor schedules"""
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = VisitingDoctorSchedule
        fields = [
            'id', 'doctor', 'doctor_name', 'day_of_week', 'day_name',
            'start_time', 'end_time', 'is_active'
        ]

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
            'prescription', 'doctor_specialization',
            'appointment_type', 'queue_position', 'estimated_wait_time', 'is_queue_appointment',
            'queue_joined_at', 'consultation_started_at', 'consultation_ended_at'
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