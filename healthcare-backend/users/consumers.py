import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from datetime import datetime
from .models import CustomUser, DoctorStatus


class DoctorStatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Join the doctor status group
        await self.channel_layer.group_add(
            "doctor_status",
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the doctor status group
        await self.channel_layer.group_discard(
            "doctor_status",
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'doctor_status_update':
                doctor_id = data.get('doctor_id')
                is_available_for_consultation = data.get('is_available_for_consultation')
                
                # Update doctor status in database
                await self.update_doctor_status(doctor_id, is_available_for_consultation)
                
                # Get updated doctor info
                doctor_info = await self.get_doctor_info(doctor_id)
                
                # Broadcast to all connected clients
                await self.channel_layer.group_send(
                    "doctor_status",
                    {
                        'type': 'doctor_status_change',
                        'doctor_id': doctor_id,
                        'is_available_for_consultation': is_available_for_consultation,
                        'doctor_info': doctor_info
                    }
                )
                
        except json.JSONDecodeError:
            pass
        except Exception as e:
            pass

    async def doctor_status_change(self, event):
        # Send status change to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'doctor_status_change',
            'doctor_id': event['doctor_id'],
            'is_available_for_consultation': event['is_available_for_consultation'],
            'doctor_info': event['doctor_info']
        }))

    @database_sync_to_async
    def update_doctor_status(self, doctor_id, is_available_for_consultation):
        try:
            doctor = CustomUser.objects.get(id=doctor_id, role='doctor')
            doctor.is_available_for_consultation = is_available_for_consultation
            
            # Update DoctorStatus model
            if is_available_for_consultation:
                DoctorStatus.set_online(doctor, is_available_for_consultation, 'doctor')
            else:
                DoctorStatus.set_offline(doctor, 'doctor')
                
            doctor.save()
            
        except CustomUser.DoesNotExist:
            pass
        except Exception as e:
            pass

    @database_sync_to_async
    def get_doctor_info(self, doctor_id):
        try:
            doctor = CustomUser.objects.get(id=doctor_id, role='doctor')
            return {
                'id': doctor.id,
                'username': doctor.username,
                'first_name': doctor.first_name,
                'last_name': doctor.last_name,
                'is_live': doctor.is_live,
                'is_available_for_consultation': doctor.is_available_for_consultation,
                'consultation_hours': doctor.consultation_hours,
                'specialization': doctor.specialization,
                'hospital': doctor.hospital
            }
        except CustomUser.DoesNotExist:
            return None

    def handle_doctor_online_sync(self, doctor):
        """Handle actions when doctor goes online"""
        current_time = timezone.now().time()
        if doctor.consultation_hours and doctor.consultation_hours.strip():
            try:
                hours_parts = doctor.consultation_hours.split(' - ')
                if len(hours_parts) == 2:
                    start_time = datetime.strptime(hours_parts[0].strip(), "%I:%M %p").time()
                    end_time = datetime.strptime(hours_parts[1].strip(), "%I:%M %p").time()
                    if start_time <= current_time <= end_time:
                        doctor.is_available_for_consultation = True
                    else:
                        doctor.is_available_for_consultation = False
            except (ValueError, AttributeError) as e:
                doctor.is_available_for_consultation = True  # Assume available if parsing fails
        else:
            doctor.is_available_for_consultation = True  # Assume available if no hours set

    def handle_doctor_offline_sync(self, doctor):
        """Handle actions when doctor goes offline"""
        doctor.is_available_for_consultation = False 