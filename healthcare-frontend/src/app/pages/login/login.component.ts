import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  form = { username: '', password: '' };
  loading = false;

  constructor(public auth: AuthService, private router: Router) {}

  login() {
    this.loading = true;
    this.auth.login(this.form.username, this.form.password).subscribe({
      next: () => {
        // Wait for profile to be loaded and then redirect based on role
        const subscription = this.auth.currentUser$.subscribe(user => {
          if (!user) return;
          if (user.role === 'admin') {
            this.router.navigate(['/admin-dashboard']);
          } else if (user.role === 'doctor') {
            this.router.navigate(['/doctor-dashboard']);
          } else if (user.role === 'patient') {
            this.router.navigate(['/patient-dashboard']);
          } else {
            this.router.navigate(['/profile']);
          }
          subscription.unsubscribe();
          this.loading = false;
        });
      },
      error: (err) => {
        alert('Login failed. Please check your credentials.');
        this.loading = false;
      }
    });
  }
}