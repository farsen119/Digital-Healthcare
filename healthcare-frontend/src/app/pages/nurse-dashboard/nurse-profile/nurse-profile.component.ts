import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NurseSideNavbarComponent } from '../side-navbar/side-navbar.component';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-nurse-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, NurseSideNavbarComponent],
  providers: [AuthService, UserService],
  templateUrl: './nurse-profile.component.html',
  styleUrl: './nurse-profile.component.css'
})
export class NurseProfileComponent implements OnInit {
  user: any = null;
  showUpdateForm = false;
  loading = false;
  errorMsg = '';
  selectedFile: File | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
      }
    });
  }

  getPhotoUrl(): string {
    if (this.user && this.user.photo) {
      if (this.user.photo.startsWith('http')) {
        return this.user.photo;
      }
      // Add cache-busting parameter to force refresh
      const baseUrl = 'http://localhost:8000' + this.user.photo;
      return baseUrl + (baseUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
    }
    return '';
  }

  openUpdateForm(): void {
    this.showUpdateForm = true;
    this.errorMsg = '';
  }

  cancelUpdate(): void {
    this.showUpdateForm = false;
    this.errorMsg = '';
    this.selectedFile = null;
    // Reload user data to reset any changes
    this.loadUserData();
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  update(): void {
    if (!this.user) return;

    this.loading = true;
    this.errorMsg = '';

    const data: any = {
      first_name: this.user.first_name,
      last_name: this.user.last_name,
      email: this.user.email,
      phone: this.user.phone,
      age: this.user.age,
      gender: this.user.gender,
      city: this.user.city,
      address: this.user.address,
      // Nurse-specific fields
      nurse_license: this.user.nurse_license,
      nursing_qualification: this.user.nursing_qualification,
      nurse_specialization: this.user.nurse_specialization,
      nurse_experience_years: this.user.nurse_experience_years,
      hospital_assignment: this.user.hospital_assignment,
      shift_preference: this.user.shift_preference,
      is_available_for_duty: this.user.is_available_for_duty,
      // Additional fields
      date_of_birth: this.user.date_of_birth,
      blood_group: this.user.blood_group,
      emergency_contact_name: this.user.emergency_contact_name,
      emergency_contact_phone: this.user.emergency_contact_phone,
      emergency_contact_relationship: this.user.emergency_contact_relationship,
      occupation: this.user.occupation,
      marital_status: this.user.marital_status
    };

    // Add photo if selected
    if (this.selectedFile) {
      data.photo = this.selectedFile;
    }

    this.authService.updateProfile(data).subscribe({
      next: (user) => {
        this.user = user;
        // Force reload user data to ensure all components get updated
        this.loadUserData();
        this.loading = false;
        this.showUpdateForm = false;
        this.selectedFile = null;
        alert('Profile updated successfully!');
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
}