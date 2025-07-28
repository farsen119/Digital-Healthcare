#!/usr/bin/env python
"""
Test script for the new Doctor Status system
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare.settings')
django.setup()

from users.models import CustomUser, DoctorStatus
from django.utils import timezone

def test_doctor_status():
    print("🧪 Testing Doctor Status System")
    print("=" * 50)
    
    # Get or create a test doctor
    doctor, created = CustomUser.objects.get_or_create(
        username='test_doctor',
        defaults={
            'email': 'test_doctor@example.com',
            'first_name': 'Test',
            'last_name': 'Doctor',
            'role': 'doctor',
            'specialization': 'General Medicine',
            'consultation_hours': '09:00 AM - 05:00 PM'
        }
    )
    
    if created:
        doctor.set_password('testpass123')
        doctor.save()
        print(f"✅ Created test doctor: {doctor.username}")
    else:
        print(f"✅ Using existing doctor: {doctor.username}")
    
    # Test setting doctor online
    print("\n1. Testing Doctor Online Status:")
    status = DoctorStatus.set_online(doctor, available_for_consultation=True, changed_by='system')
    print(f"   ✅ Doctor set online: {status.is_online}")
    print(f"   ✅ Available for consultation: {status.is_available_for_consultation}")
    print(f"   ✅ Changed by: {status.status_changed_by}")
    
    # Test setting doctor offline
    print("\n2. Testing Doctor Offline Status:")
    status = DoctorStatus.set_offline(doctor, changed_by='doctor')
    print(f"   ✅ Doctor set offline: {status.is_online}")
    print(f"   ✅ Available for consultation: {status.is_available_for_consultation}")
    print(f"   ✅ Changed by: {status.status_changed_by}")
    
    # Test getting current status
    print("\n3. Testing Current Status:")
    current_status = DoctorStatus.get_current_status(doctor)
    if current_status:
        print(f"   ✅ Current status: {'Online' if current_status.is_online else 'Offline'}")
        print(f"   ✅ Last activity: {current_status.last_activity}")
    else:
        print("   ❌ No status found")
    
    # Test consultation hours logic
    print("\n4. Testing Consultation Hours Logic:")
    current_time = timezone.now().time()
    print(f"   Current time: {current_time}")
    
    if doctor.consultation_hours:
        try:
            hours_parts = doctor.consultation_hours.split(' - ')
            if len(hours_parts) == 2:
                from datetime import datetime
                start_time = datetime.strptime(hours_parts[0].strip(), "%I:%M %p").time()
                end_time = datetime.strptime(hours_parts[1].strip(), "%I:%M %p").time()
                available = start_time <= current_time <= end_time
                print(f"   Consultation hours: {doctor.consultation_hours}")
                print(f"   Within hours: {available}")
        except Exception as e:
            print(f"   Error parsing hours: {e}")
    
    print("\n✅ Doctor Status System Test Complete!")

if __name__ == "__main__":
    test_doctor_status() 