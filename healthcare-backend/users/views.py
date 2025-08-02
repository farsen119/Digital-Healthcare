from rest_framework import generics, permissions, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
from .models import CustomUser, DoctorStatus
from .serializers import UserSerializer, RegisterSerializer

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.AllowAny]

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = CustomUser.objects.all().order_by('-date_joined')

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role')
        if role:
            return queryset.filter(role=role)
        return queryset

    def get_permissions(self):
        if self.action in ['profile', 'login_status', 'logout_status']:
            return [permissions.IsAuthenticated()]
        if self.action == 'list':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
        
    @action(detail=False, methods=['get', 'put'], url_path='profile')
    def profile(self, request):
        user = request.user
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        elif request.method == 'PUT':
            serializer = self.get_serializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            # Check if we're updating is_available_for_consultation status
            if 'is_available_for_consultation' in request.data:
                is_available_for_consultation = request.data['is_available_for_consultation']
                user.is_available_for_consultation = is_available_for_consultation
                
                # Update DoctorStatus model
                if is_available_for_consultation:
                    self.handle_doctor_online(user, changed_by='doctor')
                else:
                    self.handle_doctor_offline(user, changed_by='doctor')
                
                # Send WebSocket notification
                self.notify_status_change(user, is_available_for_consultation)
            
            serializer.save()
            return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='login-status')
    def login_status(self, request):
        """Handle doctor login - automatically set online"""
        user = request.user
        if user.role == 'doctor':
            self.handle_doctor_online(user, changed_by='system')
            self.notify_status_change(user, True)
            return Response({'message': 'Doctor logged in and set online'})
        return Response({'message': 'User is not a doctor'})

    @action(detail=False, methods=['post'], url_path='logout-status')
    def logout_status(self, request):
        """Handle doctor logout - automatically set offline"""
        user = request.user
        if user.role == 'doctor':
            self.handle_doctor_offline(user, changed_by='system')
            self.notify_status_change(user, False)
            return Response({'message': 'Doctor logged out and set offline'})
        return Response({'message': 'User is not a doctor'})

    def handle_doctor_online(self, doctor, changed_by='system'):
        """Handle actions when doctor goes online"""
        from django.utils import timezone
        from datetime import datetime
        
        # Update CustomUser model
        doctor.is_live = True
        
        # Check consultation hours for availability
        current_time = timezone.now().time()
        available_for_consultation = True
        
        if doctor.consultation_hours and doctor.consultation_hours.strip():
            try:
                hours_parts = doctor.consultation_hours.split(' - ')
                if len(hours_parts) == 2:
                    start_time = datetime.strptime(hours_parts[0].strip(), "%I:%M %p").time()
                    end_time = datetime.strptime(hours_parts[1].strip(), "%I:%M %p").time()
                    available_for_consultation = start_time <= current_time <= end_time
            except (ValueError, AttributeError) as e:
                available_for_consultation = True  # Assume available if parsing fails
        
        doctor.is_available_for_consultation = available_for_consultation
        doctor.save()
        
        # Update DoctorStatus model
        DoctorStatus.set_online(doctor, available_for_consultation, changed_by)

    def handle_doctor_offline(self, doctor, changed_by='system'):
        """Handle actions when doctor goes offline"""
        # Update CustomUser model
        doctor.is_live = False
        doctor.is_available_for_consultation = False
        doctor.save()
        
        # Update DoctorStatus model
        DoctorStatus.set_offline(doctor, changed_by)

    def notify_status_change(self, doctor, is_available_for_consultation):
        """Send WebSocket notification for status change"""
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "doctor_status",
                {
                    'type': 'doctor_status_change',
                    'doctor_id': doctor.id,
                    'is_available_for_consultation': is_available_for_consultation,
                    'doctor_info': {
                        'id': doctor.id,
                        'username': doctor.username,
                        'first_name': doctor.first_name,
                        'last_name': doctor.last_name,
                        'is_available_for_consultation': doctor.is_available_for_consultation,
                        'consultation_hours': doctor.consultation_hours,
                        'specialization': doctor.specialization,
                        'hospital': doctor.hospital
                    }
                }
            )
        except Exception as e:
            pass