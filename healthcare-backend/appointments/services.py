from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from .models import DoctorQueue, Appointment
from users.models import CustomUser

class QueueService:
    """Service for managing doctor queues"""
    
    @staticmethod
    def add_patient_to_queue(doctor, patient):
        """Add a patient to doctor's queue"""
        with transaction.atomic():
            # Get current queue size
            current_queue = DoctorQueue.objects.filter(
                doctor=doctor, 
                status='waiting'
            ).count()
            
            # Check if queue is full
            if current_queue >= doctor.max_queue_size:
                raise ValueError(f"Queue is full. Maximum {doctor.max_queue_size} patients allowed.")
            
            # Calculate position and wait time
            position = current_queue + 1
            estimated_wait_time = position * doctor.consultation_duration
            
            # Create queue entry
            queue_entry = DoctorQueue.objects.create(
                doctor=doctor,
                patient=patient,
                position=position,
                estimated_wait_time=estimated_wait_time,
                status='waiting'
            )
            
            # Create appointment record
            appointment = Appointment.objects.create(
                patient=patient,
                doctor=doctor,
                date=timezone.now().date(),
                time=timezone.now().time(),
                reason="Queue consultation",
                appointment_type='queue',
                is_queue_appointment=True,
                queue_position=position,
                estimated_wait_time=estimated_wait_time,
                queue_joined_at=timezone.now()
            )
            
            return queue_entry, appointment
    
    @staticmethod
    def get_queue_status(doctor):
        """Get current queue status for a doctor"""
        waiting_patients = DoctorQueue.objects.filter(
            doctor=doctor, 
            status='waiting'
        ).order_by('position')
        
        consulting_patient = DoctorQueue.objects.filter(
            doctor=doctor, 
            status='consulting'
        ).first()
        
        return {
            'waiting_count': waiting_patients.count(),
            'waiting_patients': waiting_patients,
            'consulting_patient': consulting_patient,
            'max_queue_size': doctor.max_queue_size,
            'is_consulting': doctor.is_consulting,
            'current_patient': doctor.current_patient
        }
    
    @staticmethod
    def start_consultation(doctor, patient):
        """Start consultation with next patient in queue"""
        with transaction.atomic():
            # Get next patient in queue
            next_patient = DoctorQueue.objects.filter(
                doctor=doctor,
                status='waiting'
            ).order_by('position').first()
            
            if not next_patient or next_patient.patient != patient:
                raise ValueError("Patient is not next in queue")
            
            # Update queue status
            next_patient.status = 'consulting'
            next_patient.save()
            
            # Update doctor status
            doctor.is_consulting = True
            doctor.current_patient = patient
            doctor.save()
            
            # Update appointment
            appointment = Appointment.objects.filter(
                doctor=doctor,
                patient=patient,
                appointment_type='queue',
                status='pending'
            ).first()
            
            if appointment:
                appointment.status = 'accepted'
                appointment.consultation_started_at = timezone.now()
                appointment.save()
            
            return next_patient
    
    @staticmethod
    def complete_consultation(doctor):
        """Complete current consultation and move to next patient"""
        with transaction.atomic():
            if not doctor.is_consulting or not doctor.current_patient:
                raise ValueError("No active consultation")
            
            # Complete current consultation
            current_queue_entry = DoctorQueue.objects.filter(
                doctor=doctor,
                patient=doctor.current_patient,
                status='consulting'
            ).first()
            
            if current_queue_entry:
                current_queue_entry.status = 'completed'
                current_queue_entry.save()
            
            # Update appointment
            appointment = Appointment.objects.filter(
                doctor=doctor,
                patient=doctor.current_patient,
                appointment_type='queue',
                status='accepted'
            ).first()
            
            if appointment:
                appointment.status = 'completed'
                appointment.consultation_ended_at = timezone.now()
                appointment.save()
            
            # Reset doctor status
            doctor.is_consulting = False
            doctor.current_patient = None
            doctor.save()
            
            # Reorder remaining queue
            QueueService._reorder_queue(doctor)
            
            return True
    
    @staticmethod
    def _reorder_queue(doctor):
        """Reorder queue after consultation completion"""
        waiting_patients = DoctorQueue.objects.filter(
            doctor=doctor,
            status='waiting'
        ).order_by('position')
        
        for i, queue_entry in enumerate(waiting_patients, 1):
            queue_entry.position = i
            queue_entry.estimated_wait_time = i * doctor.consultation_duration
            queue_entry.save()
            
            # Update appointment
            appointment = Appointment.objects.filter(
                doctor=doctor,
                patient=queue_entry.patient,
                appointment_type='queue',
                status='pending'
            ).first()
            
            if appointment:
                appointment.queue_position = i
                appointment.estimated_wait_time = queue_entry.estimated_wait_time
                appointment.save()
    
    @staticmethod
    def remove_patient_from_queue(doctor, patient):
        """Remove patient from queue"""
        with transaction.atomic():
            queue_entry = DoctorQueue.objects.filter(
                doctor=doctor,
                patient=patient,
                status='waiting'
            ).first()
            
            if queue_entry:
                queue_entry.status = 'left'
                queue_entry.save()
                
                # Update appointment
                appointment = Appointment.objects.filter(
                    doctor=doctor,
                    patient=patient,
                    appointment_type='queue',
                    status='pending'
                ).first()
                
                if appointment:
                    appointment.status = 'rejected'
                    appointment.save()
                
                # Reorder queue
                QueueService._reorder_queue(doctor)
                
                return True
            
            return False

class VisitingDoctorService:
    """Service for managing visiting doctor schedules"""
    
    @staticmethod
    def get_available_slots(doctor, date):
        """Get available time slots for visiting doctor on specific date"""
        from datetime import datetime
        
        # Check if doctor is available on this day
        day_of_week = date.weekday()
        schedule = VisitingDoctorSchedule.objects.filter(
            doctor=doctor,
            day_of_week=day_of_week,
            is_active=True
        ).first()
        
        if not schedule:
            return []
        
        # Check if date is within visiting period
        if doctor.visiting_start_date and date < doctor.visiting_start_date:
            return []
        
        if doctor.visiting_end_date and date > doctor.visiting_end_date:
            return []
        
        # Generate 15-minute slots
        slots = []
        current_time = schedule.start_time
        end_time = schedule.end_time
        
        while current_time < end_time:
            # Check if slot is available
            existing_appointment = Appointment.objects.filter(
                doctor=doctor,
                date=date,
                time=current_time,
                status__in=['pending', 'accepted']
            ).exists()
            
            if not existing_appointment:
                slots.append(current_time)
            
            # Add 15 minutes
            current_minutes = current_time.hour * 60 + current_time.minute
            current_minutes += 15
            current_time = datetime.strptime(
                f"{current_minutes // 60:02d}:{current_minutes % 60:02d}", 
                "%H:%M"
            ).time()
        
        return slots 