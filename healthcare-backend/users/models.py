from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('doctor', 'Doctor'),
        ('patient', 'Patient'),
        ('pharmacist', 'Pharmacist'),
    ]
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]
    
    BLOOD_GROUP_CHOICES = [
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
    ]
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='patient')
    email = models.EmailField(unique=True)
    
    # Doctor-specific fields
    specialization = models.CharField(max_length=100, blank=True, null=True)
    license_number = models.CharField(max_length=50, blank=True, null=True)
    experience_years = models.IntegerField(blank=True, null=True)
    qualification = models.CharField(max_length=100, blank=True, null=True)
    hospital = models.CharField(max_length=100, blank=True, null=True)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    available_days = models.CharField(max_length=100, blank=True, null=True)
    consultation_hours = models.CharField(max_length=100, blank=True, null=True)
    is_live = models.BooleanField(default=False, help_text="Doctor's online/offline status")
    is_available_for_consultation = models.BooleanField(default=False, help_text="Doctor's availability for consultations")
    
    # Pharmacist-specific fields
    pharmacy_name = models.CharField(max_length=100, blank=True, null=True, help_text="Name of the pharmacy")
    pharmacy_license = models.CharField(max_length=50, blank=True, null=True, help_text="Pharmacy license number")
    pharmacy_address = models.TextField(blank=True, null=True, help_text="Pharmacy address")
    working_hours = models.CharField(max_length=100, blank=True, null=True, help_text="Working hours (e.g., 9:00 AM - 6:00 PM)")
    is_available = models.BooleanField(default=True, help_text="Pharmacist's availability status")
    
    # Doctor Type System
    DOCTOR_TYPE_CHOICES = [
        ('permanent', 'Permanent Doctor (Always Available)'),
        ('visiting', 'Visiting Doctor (Special Days Only)'),
    ]
    doctor_type = models.CharField(max_length=20, choices=DOCTOR_TYPE_CHOICES, default='permanent', help_text="Type of doctor")
    
    # Queue System for Permanent Doctors
    current_queue_position = models.IntegerField(default=0, help_text="Current position in consultation queue")
    max_queue_size = models.IntegerField(default=10, help_text="Maximum number of patients in queue")
    consultation_duration = models.IntegerField(default=15, help_text="Duration of each consultation in minutes")
    is_consulting = models.BooleanField(default=False, help_text="Currently consulting a patient")
    current_patient = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='being_consulted_by', help_text="Patient currently being consulted")
    
    # Visiting Doctor Schedule
    visiting_days = models.JSONField(default=list, blank=True, help_text="Days of week when visiting doctor is available (0=Monday, 6=Sunday)")
    visiting_day_times = models.JSONField(default=dict, blank=True, help_text="Time slots for each visiting day {day_number: {'start_time': 'HH:MM', 'end_time': 'HH:MM'}}")
    
    # Personal Information (Common for all users)
    age = models.IntegerField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    
    # Patient-specific fields
    date_of_birth = models.DateField(blank=True, null=True, help_text="Patient's date of birth")
    address = models.TextField(blank=True, null=True, help_text="Complete address of the patient")
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES, blank=True, null=True, help_text="Patient's blood group")
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True, help_text="Name of emergency contact person")
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True, help_text="Phone number of emergency contact")
    emergency_contact_relationship = models.CharField(max_length=50, blank=True, null=True, help_text="Relationship with emergency contact")
    medical_history = models.TextField(blank=True, null=True, help_text="Previous medical conditions, surgeries, allergies")
    current_medications = models.TextField(blank=True, null=True, help_text="Current medications being taken")
    allergies = models.TextField(blank=True, null=True, help_text="Known allergies (drugs, food, environmental)")
    height = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text="Height in cm")
    weight = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text="Weight in kg")
    occupation = models.CharField(max_length=100, blank=True, null=True, help_text="Patient's occupation")
    marital_status = models.CharField(max_length=20, choices=[
        ('single', 'Single'),
        ('married', 'Married'),
        ('divorced', 'Divorced'),
        ('widowed', 'Widowed'),
    ], blank=True, null=True)
    
    # Profile photo
    photo = models.ImageField(upload_to='profile/', blank=True, null=True)
    
    def __str__(self):
        return f"{self.username} ({self.role})"
    
    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = 'admin'
        super().save(*args, **kwargs)
    
    @property
    def bmi(self):
        """Calculate BMI if height and weight are available"""
        if self.height and self.weight:
            height_m = self.height / 100  # Convert cm to meters
            return round(self.weight / (height_m * height_m), 2)
        return None

class DoctorStatus(models.Model):
    """Model to track doctor online/offline status with timestamps"""
    doctor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='status_history')
    is_online = models.BooleanField(default=False)
    is_available_for_consultation = models.BooleanField(default=False)
    last_activity = models.DateTimeField(auto_now=True)
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(blank=True, null=True)
    status_changed_by = models.CharField(max_length=20, default='system', help_text="Who changed the status: system, doctor, admin")
    
    class Meta:
        ordering = ['-last_activity']
        verbose_name_plural = "Doctor Statuses"
    
    def __str__(self):
        return f"Dr. {self.doctor.first_name} - {'Online' if self.is_online else 'Offline'}"
    
    @classmethod
    def get_current_status(cls, doctor):
        """Get the current status for a doctor"""
        return cls.objects.filter(doctor=doctor).first()
    
    @classmethod
    def set_online(cls, doctor, available_for_consultation=True, changed_by='system'):
        """Set doctor as online"""
        status, created = cls.objects.get_or_create(
            doctor=doctor,
            defaults={
                'is_online': True,
                'is_available_for_consultation': available_for_consultation,
                'status_changed_by': changed_by
            }
        )
        if not created:
            status.is_online = True
            status.is_available_for_consultation = available_for_consultation
            status.status_changed_by = changed_by
            status.save()
        return status
    
    @classmethod
    def set_offline(cls, doctor, changed_by='system'):
        """Set doctor as offline"""
        status, created = cls.objects.get_or_create(
            doctor=doctor,
            defaults={
                'is_online': False,
                'is_available_for_consultation': False,
                'status_changed_by': changed_by
            }
        )
        if not created:
            status.is_online = False
            status.is_available_for_consultation = False
            status.status_changed_by = changed_by
            status.logout_time = timezone.now()
            status.save()
        return status