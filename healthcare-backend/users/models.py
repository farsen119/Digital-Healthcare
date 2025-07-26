from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('doctor', 'Doctor'),
        ('patient', 'Patient'),
    )
    
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    )
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    specialization = models.CharField(max_length=255, blank=True, null=True)
    photo = models.ImageField(upload_to='profile/', blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(unique=True)
    
    # Doctor-specific fields
    license_number = models.CharField(max_length=100, blank=True, null=True)
    experience_years = models.IntegerField(blank=True, null=True)
    qualification = models.CharField(max_length=255, blank=True, null=True)
    hospital = models.CharField(max_length=255, blank=True, null=True)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    available_days = models.CharField(max_length=100, blank=True, null=True)
    consultation_hours = models.CharField(max_length=100, blank=True, null=True)
    is_live = models.BooleanField(default=False, help_text="Doctor's online/offline status")
    
    # Age and Gender fields
    age = models.IntegerField(blank=True, null=True, help_text="Age in years")
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)

    def __str__(self):
        return f"{self.username} - {self.role}"

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = 'admin'
        super().save(*args, **kwargs)