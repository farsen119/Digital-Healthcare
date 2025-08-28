from django.db import transaction
from django.utils import timezone
from datetime import timedelta, datetime, time
import pytz
from .models import DoctorQueue, Appointment
from users.models import CustomUser

class QueueService:
    """Service for managing doctor queues"""
    
    @staticmethod
    def add_patient_to_queue(doctor, patient, reason=""):
        """Add a patient to doctor's queue with reason for visit"""
        with transaction.atomic():
            # Check if patient is already in queue for this doctor
            existing_queue = DoctorQueue.objects.filter(
                doctor=doctor,
                patient=patient,
                status__in=['waiting', 'consulting']
            ).first()
            
            if existing_queue:
                if existing_queue.status == 'waiting':
                    raise ValueError("You are already in the queue for this doctor.")
                elif existing_queue.status == 'consulting':
                    raise ValueError("You are currently in consultation with this doctor.")
            
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
            
            # Get current time in IST timezone
            ist_timezone = pytz.timezone('Asia/Kolkata')
            current_time_utc = timezone.now()
            current_time_ist = current_time_utc.astimezone(ist_timezone)
            
            # Create queue entry
            queue_entry = DoctorQueue.objects.create(
                doctor=doctor,
                patient=patient,
                position=position,
                estimated_wait_time=estimated_wait_time,
                status='waiting'
            )
            
            # Create appointment record with IST date and time
            appointment = Appointment.objects.create(
                patient=patient,
                doctor=doctor,
                date=current_time_ist.date(),
                time=current_time_ist.time(),  # IST time
                reason=reason or "Queue consultation",
                appointment_type='queue',
                is_queue_appointment=True,
                queue_position=position,
                estimated_wait_time=estimated_wait_time,
                queue_joined_at=current_time_ist
            )
            
            return queue_entry, appointment
    
    @staticmethod
    def cleanup_old_queue_entries():
        """Clean up old completed/left queue entries to prevent database bloat"""
        from datetime import timedelta
        
        # Remove queue entries older than 7 days
        cutoff_date = timezone.now() - timedelta(days=7)
        
        old_entries = DoctorQueue.objects.filter(
            status__in=['completed', 'left'],
            joined_at__lt=cutoff_date
        )
        
        count = old_entries.count()
        old_entries.delete()
        
        return count
    
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
        
        # Get accepted patients (patients with status 'accepted')
        accepted_patients = DoctorQueue.objects.filter(
            doctor=doctor,
            status='accepted'
        ).order_by('-joined_at')
        
        return {
            'waiting_count': waiting_patients.count(),
            'waiting_patients': waiting_patients,
            'consulting_patient': consulting_patient,
            'accepted_patients': accepted_patients,
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
            
            # Update appointment with IST time
            ist_timezone = pytz.timezone('Asia/Kolkata')
            current_time_ist = timezone.now().astimezone(ist_timezone)
            
            appointment = Appointment.objects.filter(
                doctor=doctor,
                patient=patient,
                appointment_type='queue',
                status='pending'
            ).first()
            
            if appointment:
                appointment.status = 'accepted'
                appointment.consultation_started_at = current_time_ist
                appointment.save()
            
            return next_patient
    
    @staticmethod
    def complete_consultation(doctor):
        """Complete current consultation and move to next patient"""
        try:
            with transaction.atomic():
                # Find any accepted patients for this doctor
                accepted_patients = DoctorQueue.objects.filter(
                    doctor=doctor,
                    status='accepted'
                )
                
                if accepted_patients.count() == 0:
                    raise ValueError("No active consultation")
                
                # Get the first accepted patient (most recent)
                current_queue_entry = accepted_patients.first()
                current_patient = current_queue_entry.patient
                
                # Complete current consultation
                # Delete any existing 'completed' entry to avoid unique constraint violation
                DoctorQueue.objects.filter(
                    doctor=doctor,
                    patient=current_patient,
                    status='completed'
                ).delete()
                
                # Update the accepted entry to completed using update() to avoid unique constraint issues
                DoctorQueue.objects.filter(id=current_queue_entry.id).update(status='completed')
                
                # Update appointment with IST time
                ist_timezone = pytz.timezone('Asia/Kolkata')
                current_time_ist = timezone.now().astimezone(ist_timezone)
                
                # Look for appointment with any status (pending, accepted, etc.) to ensure we find it
                appointment = Appointment.objects.filter(
                    doctor=doctor,
                    patient=current_patient,
                    appointment_type='queue'
                ).first()
                
                if appointment:
                    appointment.status = 'completed'
                    appointment.consultation_ended_at = current_time_ist
                    appointment.save()
                
                # Reset doctor status
                doctor.is_consulting = False
                doctor.current_patient = None
                doctor.save()
                
                # Reorder remaining queue
                QueueService._reorder_queue(doctor)
                
                return True
        except Exception as e:
            raise
    
    @staticmethod
    def complete_consultation_by_appointment(doctor, appointment_id):
         """Complete consultation for a specific appointment"""
         try:
             with transaction.atomic():
                 # Find the appointment
                 appointment = Appointment.objects.filter(
                     id=appointment_id,
                     doctor=doctor
                 ).first()
                 
                 if not appointment:
                     raise ValueError("Appointment not found")
                 
                 # Find the corresponding queue entry
                 queue_entry = DoctorQueue.objects.filter(
                     doctor=doctor,
                     patient=appointment.patient,
                     status='accepted'
                 ).first()
                 
                 if not queue_entry:
                     raise ValueError("No active consultation for this appointment")
                 
                 # Complete current consultation
                 # Delete any existing 'completed' entry to avoid unique constraint violation
                 DoctorQueue.objects.filter(
                     doctor=doctor,
                     patient=appointment.patient,
                     status='completed'
                 ).delete()
                 
                 # Update the accepted entry to completed
                 DoctorQueue.objects.filter(id=queue_entry.id).update(status='completed')
                 
                 # Update appointment with IST time
                 ist_timezone = pytz.timezone('Asia/Kolkata')
                 current_time_ist = timezone.now().astimezone(ist_timezone)
                 
                 appointment.status = 'completed'
                 appointment.consultation_ended_at = current_time_ist
                 appointment.save()
                 
                 # Reset doctor status if this was the current patient
                 if doctor.current_patient == appointment.patient:
                     doctor.is_consulting = False
                     doctor.current_patient = None
                     doctor.save()
                 
                 # Reorder remaining queue
                 QueueService._reorder_queue(doctor)
                 
                 return True
         except Exception as e:
             raise
    
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
    def get_available_dates(doctor):
        """Get available dates for visiting doctor (next 30 days)"""
        from datetime import date, timedelta
        
        available_dates = []
        today = date.today()
        
        # Check next 30 days
        for i in range(30):
            check_date = today + timedelta(days=i)
            day_of_week = check_date.weekday()
            
            # Check if doctor is available on this day
            if doctor.visiting_days and day_of_week in doctor.visiting_days:
                available_dates.append(check_date)
        
        return available_dates
    
    @staticmethod
    def get_available_slots(doctor, date):
        """Get available time slots for visiting doctor on specific date"""
        
        # Check if doctor is available on this day
        day_of_week = date.weekday()
        
        if not doctor.visiting_days or day_of_week not in doctor.visiting_days:
            return []
        
        # Get time slots for this day
        day_times = doctor.visiting_day_times.get(str(day_of_week), {})
        start_time_str = day_times.get('start_time')
        end_time_str = day_times.get('end_time')
        
        if not start_time_str or not end_time_str:
            return []
        
        # Parse start and end times
        try:
            start_time = datetime.strptime(start_time_str, '%H:%M').time()
            end_time = datetime.strptime(end_time_str, '%H:%M').time()
        except ValueError:
            return []
        
        # Generate 15-minute slots
        slots = []
        current_time = start_time
        
        while current_time < end_time:
            # Check if slot is available (not already booked)
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
            current_time = time(
                hour=current_minutes // 60,
                minute=current_minutes % 60
            )
        
        return slots
    
    @staticmethod
    def is_slot_available(doctor, date, time_slot):
        """Check if a specific time slot is available"""
        # Convert time_slot string to time object for comparison
        try:
            if isinstance(time_slot, str):
                time_obj = datetime.strptime(time_slot, '%H:%M').time()
            else:
                time_obj = time_slot
        except ValueError:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Invalid time format: {time_slot}")
            return False
        
        available_slots = VisitingDoctorService.get_available_slots(doctor, date)
        return time_obj in available_slots 