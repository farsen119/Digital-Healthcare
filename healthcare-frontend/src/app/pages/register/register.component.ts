import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  form: any = {
    role: 'patient', // Default role
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    specialization: '', // Specialization field
    city: '',
    photo: null
  };

  // Predefined list of specializations for the dropdown
  specializations = [
    'Cardiology',
    'Dermatology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'General Physician',
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
    // If the role is doctor, specialization cannot be empty
    if (this.form.role === 'doctor' && !this.form.specialization) {
      alert('Please select a specialization for the doctor role.');
      return;
    }

    // Create a new object for submission to avoid modifying the original form state
    const submitForm = { ...this.form };
    
    // Clean up data before sending to backend
    delete submitForm.confirm_password;
    if (submitForm.role !== 'doctor') {
      delete submitForm.specialization; // Don't send specialization for non-doctors
    }

    this.auth.register(submitForm).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => {
        console.error(err);
        alert('Registration failed. Please check your details.');
      }
    });
  }
}