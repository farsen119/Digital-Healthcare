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
    city: '',
    photo: null,
    // Doctor-specific fields
    specialization: '',
    license_number: '',
    experience_years: null,
    qualification: '',
    hospital: '',
    consultation_fee: null,
    bio: '',
    available_days: '',
    consultation_hours: ''
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

  constructor(private auth: AuthService, private router: Router) {}

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.form.photo = event.target.files[0];
    }
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
