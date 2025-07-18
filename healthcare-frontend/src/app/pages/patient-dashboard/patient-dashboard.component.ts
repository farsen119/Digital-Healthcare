import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardNotificationComponent } from '../dashboard-notification/dashboard-notification.component';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DashboardNotificationComponent],
  templateUrl: './patient-dashboard.component.html'
})
export class PatientDashboardComponent implements OnInit {
  user: any = null;
  photo: File | null = null;
  loading = false;
  showUpdateForm = false;
  errorMsg: string = '';

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.getProfile().subscribe(user => this.user = user);
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.photo = event.target.files[0];
    }
  }

  getPhotoUrl(): string {
    if (this.user && this.user.photo) {
      if (this.user.photo.startsWith('http')) {
        return this.user.photo;
      }
      return 'http://localhost:8000' + this.user.photo;
    }
    return '';
  }

  update() {
    this.loading = true;
    this.errorMsg = '';
    const data: any = {
      first_name: this.user.first_name,
      last_name: this.user.last_name,
      email: this.user.email,
      phone: this.user.phone,
      city: this.user.city
    };
    if (this.photo) data.photo = this.photo;
    this.auth.updateProfile(data).subscribe({
      next: user => {
        this.user = user;
        this.loading = false;
        this.showUpdateForm = false;
        this.photo = null;
        alert('Profile updated!');
      },
      error: (err) => {
        this.loading = false;
        if (err.error) {
          if (typeof err.error === 'string') {
            this.errorMsg = err.error;
          } else if (typeof err.error === 'object') {
            this.errorMsg = Object.values(err.error).join('\n');
          } else {
            this.errorMsg = 'Update failed. Unknown error.';
          }
        } else {
          this.errorMsg = 'Update failed. Network or server error.';
        }
        alert(this.errorMsg);
      }
    });
  }

  openUpdateForm() {
    this.showUpdateForm = true;
    this.errorMsg = '';
  }

  cancelUpdate() {
    this.showUpdateForm = false;
    this.photo = null;
    this.errorMsg = '';
  }
}