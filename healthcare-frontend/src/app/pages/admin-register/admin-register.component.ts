import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-register.component.html',
  styleUrl: './admin-register.component.css'
})
export class AdminRegisterComponent {
  form: any = {
    role: '', // Will be selected by admin
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    age: null,
    gender: '',
    city: '',
    photo: null,
    // Doctor-specific fields
    doctor_type: 'permanent', // Default to permanent
    specialization: '',
    license_number: '',
    experience_years: null,
    qualification: '',
    hospital: '',
    consultation_fee: null,
    bio: '',
    available_days: '',
    consultation_hours: '',
    // Queue system fields for permanent doctors
    max_queue_size: 10,
    consultation_duration: 15,
             // Visiting doctor fields
         visiting_days: [],
         visiting_day_times: {} as { [key: number]: { start_time: string; end_time: string } }
  };

  // Predefined list of specializations for the dropdown
  specializations = [
    'Cardiology',
    'Dermatology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'General Physician',
    'Psychiatry',
    'Gynecology',
    'Ophthalmology',
    'ENT (Ear, Nose, Throat)',
    'Dental',
    'Oncology',
    'Radiology',
    'Anesthesiology',
    'Emergency Medicine',
    'Other'
  ];

  // Doctor types
  doctorTypes = [
    { value: 'permanent', label: 'Permanent Doctor (Always Available)' },
    { value: 'visiting', label: 'Visiting Doctor (Special Days Only)' }
  ];

  // Days of week for visiting doctors
  daysOfWeek = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' }
  ];

  constructor(private auth: AuthService, private router: Router) {}

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.form.photo = event.target.files[0];
    }
  }

  onDoctorTypeChange() {
    // Reset fields when switching doctor types
    if (this.form.doctor_type === 'permanent') {
      // Clear visiting doctor fields
      this.form.visiting_days = [];
      this.form.visiting_day_times = {};
      // Initialize permanent doctor fields with defaults
      this.form.available_days = '';
      this.form.consultation_hours = '';
      this.form.max_queue_size = 10;
      this.form.consultation_duration = 15;
    } else {
      // Clear permanent doctor fields
      this.form.available_days = '';
      this.form.consultation_hours = '';
      this.form.max_queue_size = 10;
      this.form.consultation_duration = 15;
      // Initialize visiting day times for all days
      this.form.visiting_day_times = {};
      this.daysOfWeek.forEach(day => {
        this.form.visiting_day_times[day.value] = { start_time: '09:00', end_time: '17:00' };
      });
    }
  }

  onVisitingDayChange(dayValue: number, checked: boolean) {
    if (checked) {
      if (!this.form.visiting_days.includes(dayValue)) {
        this.form.visiting_days.push(dayValue);
        // Initialize time slots for the newly selected day
        if (!this.form.visiting_day_times[dayValue]) {
          this.form.visiting_day_times[dayValue] = { start_time: '09:00', end_time: '17:00' };
        }
      }
    } else {
      this.form.visiting_days = this.form.visiting_days.filter((day: number) => day !== dayValue);
      // Remove time slots for the deselected day
      delete this.form.visiting_day_times[dayValue];
    }
  }

  isVisitingDaySelected(dayValue: number): boolean {
    return this.form.visiting_days.includes(dayValue);
  }

  register() {
    // --- VALIDATION LOGIC ---
    if (this.form.password !== this.form.confirm_password) {
      alert('Passwords do not match!');
      return;
    }

    if (!this.form.role) {
      alert('Please select a user role.');
      return;
    }

    // Validate required fields for all users
    if (!this.form.first_name || !this.form.last_name || !this.form.username || 
        !this.form.email || !this.form.password || !this.form.phone || 
        !this.form.age || !this.form.gender) {
      alert('Please fill in all required fields: First Name, Last Name, Username, Email, Password, Phone, Age, and Gender.');
      return;
    }

    // Validate age
    if (this.form.age < 1 || this.form.age > 120) {
      alert('Please enter a valid age between 1 and 120.');
      return;
    }

    // If the role is doctor, validate required doctor fields
    if (this.form.role === 'doctor') {
      if (!this.form.specialization) {
        alert('Please select a specialization for the doctor role.');
        return;
      }
      if (!this.form.license_number) {
        alert('Please enter the medical license number.');
        return;
      }
      if (!this.form.qualification) {
        alert('Please enter the doctor\'s qualification.');
        return;
      }
      
      // Validate doctor type specific fields
      if (this.form.doctor_type === 'permanent') {
        if (!this.form.available_days) {
          alert('Please select available days for permanent doctors.');
          return;
        }
        if (!this.form.consultation_hours) {
          alert('Please set consultation hours for permanent doctors.');
          return;
        }
      } else if (this.form.doctor_type === 'visiting') {
        if (this.form.visiting_days.length === 0) {
          alert('Please select at least one visiting day for visiting doctors.');
          return;
        }
        // Validate that each selected visiting day has time slots
        for (const day of this.form.visiting_days) {
          if (!this.form.visiting_day_times[day] || 
              !this.form.visiting_day_times[day].start_time || 
              !this.form.visiting_day_times[day].end_time) {
            alert(`Please set start and end times for ${this.daysOfWeek.find(d => d.value === day)?.label}.`);
            return;
          }
        }
      }
    }

    // Create a new object for submission to avoid modifying the original form state
    const submitForm = { ...this.form };
    
    // Clean up data before sending to backend
    delete submitForm.confirm_password;
    
    // Remove doctor-specific fields for non-doctors
    if (submitForm.role !== 'doctor') {
      delete submitForm.specialization;
      delete submitForm.license_number;
      delete submitForm.experience_years;
      delete submitForm.qualification;
      delete submitForm.hospital;
      delete submitForm.consultation_fee;
      delete submitForm.bio;
      delete submitForm.available_days;
      delete submitForm.consultation_hours;
      delete submitForm.doctor_type;
      delete submitForm.max_queue_size;
      delete submitForm.consultation_duration;
      delete submitForm.visiting_days;
      delete submitForm.visiting_day_times;
    } else {
      // For doctors, remove fields based on doctor type
      if (submitForm.doctor_type === 'permanent') {
        // Remove visiting doctor fields for permanent doctors
        delete submitForm.visiting_days;
        delete submitForm.visiting_day_times;
      } else if (submitForm.doctor_type === 'visiting') {
        // Remove permanent doctor fields for visiting doctors
        delete submitForm.available_days;
        delete submitForm.consultation_hours;
        delete submitForm.max_queue_size;
        delete submitForm.consultation_duration;
      }
    }

    this.auth.register(submitForm).subscribe({
      next: () => {
        alert(`User registered successfully as ${this.form.role}!`);
        this.router.navigate(['/admin-dashboard']);
      },
      error: (err) => {
        console.error(err);
        alert('Registration failed. Please check your details.');
      }
    });
  }
}
