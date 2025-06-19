from django.db import models
from users.models import CustomUser

class Appointment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    )
    patient = models.ForeignKey(CustomUser, related_name='appointments', on_delete=models.SET_NULL, null=True, blank=True)
    doctor = models.ForeignKey(CustomUser, related_name='doctor_appointments', on_delete=models.CASCADE)
    patient_name = models.CharField(max_length=255, blank=True)  # For guest patients
    patient_email = models.EmailField(blank=True)
    date = models.DateField()
    time = models.TimeField()
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.doctor} - {self.date} {self.time} ({self.status})"