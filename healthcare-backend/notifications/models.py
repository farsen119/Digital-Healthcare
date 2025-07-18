from django.db import models
from users.models import CustomUser

class Notification(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    # Optionally, link to appointment or other objects
    appointment = models.ForeignKey('appointments.Appointment', null=True, blank=True, on_delete=models.CASCADE)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message[:20]}"