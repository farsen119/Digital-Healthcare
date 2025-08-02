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
    role: 'patient', // Fixed role - only patients can register
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
    photo: null
  };

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

    // Validate required fields
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

    // Create a new object for submission to avoid modifying the original form state
    const submitForm = { ...this.form };
    
    // Clean up data before sending to backend
    delete submitForm.confirm_password;
    
    // Ensure proper data types
    submitForm.age = parseInt(submitForm.age);
    submitForm.phone = submitForm.phone.toString().trim();
    
    // Remove empty optional fields
    if (!submitForm.city || submitForm.city.trim() === '') {
      delete submitForm.city;
    }
    if (!submitForm.photo) {
      delete submitForm.photo;
    }



    this.auth.register(submitForm).subscribe({
      next: () => {
        alert('Registration successful! Please login with your credentials.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        
        let errorMessage = 'Registration failed. ';
        
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage += err.error;
          } else if (typeof err.error === 'object') {
            // Handle validation errors from Django REST Framework
            const errorObj = err.error;
            const errorDetails = [];
            
            for (const field in errorObj) {
              if (Array.isArray(errorObj[field])) {
                errorDetails.push(`${field}: ${errorObj[field].join(', ')}`);
              } else if (typeof errorObj[field] === 'string') {
                errorDetails.push(`${field}: ${errorObj[field]}`);
              }
            }
            
            if (errorDetails.length > 0) {
              errorMessage += errorDetails.join('\n');
            } else {
              errorMessage += 'Please check your details and try again.';
            }
          } else {
            errorMessage += 'Please check your details and try again.';
          }
        } else {
          errorMessage += 'Network error. Please check your connection and try again.';
        }
        
        alert(errorMessage);
      }
    });
  }
}