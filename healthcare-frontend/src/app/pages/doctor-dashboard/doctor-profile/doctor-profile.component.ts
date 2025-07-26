import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SideNavbarComponent } from '../side-navbar/side-navbar.component';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SideNavbarComponent],
  templateUrl: './doctor-profile.component.html',
  styleUrl: './doctor-profile.component.css'
})
export class DoctorProfileComponent implements OnInit {
  user: any = null;
  photo: File | null = null;
  loading = false;
  showUpdateForm = false;
  errorMsg: string = '';

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
    
    // Only send profile photo - all other fields are read-only
    const data: any = {};
    
    // Add photo if selected
    if (this.photo) data.photo = this.photo;
    
    this.auth.updateProfile(data).subscribe({
      next: user => {
        this.user = user;
        this.loading = false;
        this.showUpdateForm = false;
        this.photo = null;
        alert('Profile photo updated successfully!');
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
