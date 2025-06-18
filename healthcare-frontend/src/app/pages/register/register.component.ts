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
    role: 'patient',
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    specialization: '',
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
    // For patient, check password match
    if (this.form.role === 'patient' && this.form.password !== this.form.confirm_password) {
      alert('Passwords do not match!');
      return;
    }
    // Remove confirm_password before sending to backend
    const submitForm = { ...this.form };
    delete submitForm.confirm_password;

    this.auth.register(submitForm).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => alert('Registration failed. Please check your details.')
    });
  }
}