from django.db import models
from users.models import CustomUser
from django.utils import timezone

class Appointment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    )
    
    APPOINTMENT_TYPE_CHOICES = [
        ('queue', 'Queue Appointment (Permanent Doctor)'),
        ('scheduled', 'Scheduled Appointment (Visiting Doctor)'),
    ]
    
    patient = models.ForeignKey(CustomUser, related_name='appointments', on_delete=models.CASCADE, null=True, blank=True)
    doctor = models.ForeignKey(CustomUser, related_name='doctor_appointments', on_delete=models.CASCADE)
    date = models.DateField()
    time = models.TimeField()
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Appointment Type System
    appointment_type = models.CharField(max_length=20, choices=APPOINTMENT_TYPE_CHOICES, default='scheduled', help_text="Type of appointment")
    
    # Queue System Fields (for Permanent Doctors)
    queue_position = models.IntegerField(null=True, blank=True, help_text="Position in doctor's queue")
    estimated_wait_time = models.IntegerField(null=True, blank=True, help_text="Estimated wait time in minutes")
    is_queue_appointment = models.BooleanField(default=False, help_text="True if this is a queue-based appointment")
    queue_joined_at = models.DateTimeField(null=True, blank=True, help_text="When patient joined the queue")
    consultation_started_at = models.DateTimeField(null=True, blank=True, help_text="When consultation actually started")
    consultation_ended_at = models.DateTimeField(null=True, blank=True, help_text="When consultation ended")

    def __str__(self):
        return f"{self.doctor} - {self.date} {self.time} ({self.status})"
    
    def save(self, *args, **kwargs):
        # Set appointment type based on doctor type
        if not self.appointment_type:
            if self.doctor.doctor_type == 'permanent':
                self.appointment_type = 'queue'
                self.is_queue_appointment = True
            else:
                self.appointment_type = 'scheduled'
                self.is_queue_appointment = False
        super().save(*args, **kwargs)

class DoctorQueue(models.Model):
    """Queue system for permanent doctors"""
    doctor = models.ForeignKey(CustomUser, related_name='queue', on_delete=models.CASCADE)
    patient = models.ForeignKey(CustomUser, related_name='queue_appointments', on_delete=models.CASCADE)
    position = models.IntegerField()
    joined_at = models.DateTimeField(auto_now_add=True)
    estimated_wait_time = models.IntegerField(help_text="Estimated wait time in minutes")
    status = models.CharField(max_length=20, choices=[
        ('waiting', 'Waiting'),
        ('consulting', 'Consulting'),
        ('accepted', 'Accepted'),
        ('completed', 'Completed'),
        ('left', 'Left Queue')
    ], default='waiting')
    
    class Meta:
        ordering = ['position']
        unique_together = ['doctor', 'patient', 'status']
    
    def __str__(self):
        return f"{self.doctor} - Queue Position {self.position} - {self.patient}"

class VisitingDoctorSchedule(models.Model):
    """Schedule for visiting doctors"""
    doctor = models.ForeignKey(CustomUser, related_name='visiting_schedules', on_delete=models.CASCADE)
    day_of_week = models.IntegerField(choices=[
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ])
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['doctor', 'day_of_week']
    
    def __str__(self):
        return f"{self.doctor} - {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"