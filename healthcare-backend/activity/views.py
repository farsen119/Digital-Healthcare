from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated  # or IsAdminUser if you want only admins
from users.models import CustomUser
from appointments.models import Appointment
from prescriptions.models import Prescription  # adjust if your app name is different

class RecentActivityView(APIView):
    permission_classes = [IsAuthenticated]  # or IsAdminUser

    def get(self, request):
        activities = []

        # Latest user registrations
        for user in CustomUser.objects.order_by('-date_joined')[:6]:
            activities.append({
                'type': 'user',
                'message': f"User registered: {user.username} ({user.get_role_display()})",
                'date': user.date_joined,
            })

        # Latest appointments
        for appt in Appointment.objects.order_by('-created_at')[:6]:
            patient_name = appt.patient.username if appt.patient else appt.patient_name
            activities.append({
                'type': 'appointment',
                'message': f"Appointment booked for {patient_name} with Dr. {appt.doctor.username}",
                'date': appt.created_at,
            })

        # Latest prescriptions
        for pres in Prescription.objects.order_by('-created_at')[:6]:
            patient_name = pres.appointment.patient.username if pres.appointment.patient else pres.appointment.patient_name
            activities.append({
                'type': 'prescription',
                'message': f"Prescription added for {patient_name} by Dr. {pres.appointment.doctor.username}",
                'date': pres.created_at,
            })

        # Sort all activities by date descending and take the top 6
        activities.sort(key=lambda x: x['date'], reverse=True)
        activities = activities[:6]

        return Response(activities)