from django.db import models
from appointments.models import Appointment

class Prescription(models.Model):
    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE,
        related_name='prescription'
    )
    details = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    # --- ADD THIS NEW FIELD ---
    # This will store notes added by an admin. It is optional.
    admin_notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Prescription for Appointment ID: {self.appointment.id}"










# from django.db import models
# from appointments.models import Appointment  # Import the Appointment model

# class Prescription(models.Model):
#     # This creates a one-to-one link.
#     # An appointment can have only one prescription.
#     # If the appointment is deleted, the prescription is also deleted (CASCADE).
#     appointment = models.OneToOneField(
#         Appointment,
#         on_delete=models.CASCADE,
#         related_name='prescription' # This lets us access the prescription from an appointment object
#     )
    
#     # The actual text of the prescription
#     details = models.TextField()

#     # Automatically records when the prescription was created
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         # This will show up in the Django admin area
#         return f"Prescription for Appointment ID: {self.appointment.id}"
