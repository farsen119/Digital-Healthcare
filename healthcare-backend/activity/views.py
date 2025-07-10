from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.models import CustomUser
from appointments.models import Appointment
from prescriptions.models import Prescription

class RecentActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        activities = []
        for user in CustomUser.objects.order_by('-date_joined')[:6]:
            activities.append({
                'type': 'user',
                'message': f"User registered: {user.username} ({user.get_role_display()})",
                'date': user.date_joined,
            })
        for appt in Appointment.objects.order_by('-created_at')[:6]:
            patient_name = appt.patient.username if appt.patient else appt.patient_name
            activities.append({
                'type': 'appointment',
                'message': f"Appointment booked for {patient_name} with Dr. {appt.doctor.username}",
                'date': appt.created_at,
            })
        for pres in Prescription.objects.order_by('-created_at')[:6]:
            patient_name = pres.appointment.patient.username if pres.appointment.patient else pres.appointment.patient_name
            activities.append({
                'type': 'prescription',
                'message': f"Prescription added for {patient_name} by Dr. {pres.appointment.doctor.username}",
                'date': pres.created_at,
            })
        activities.sort(key=lambda x: x['date'], reverse=True)
        activities = activities[:6]
        return Response(activities)