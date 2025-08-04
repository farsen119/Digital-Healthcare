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
  editForm: any = {};

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

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.getProfile().subscribe(user => {
      this.user = user;
      this.editForm = { ...user }; // Initialize edit form with user data
    });
  }

  // Helper method to get day name
  getDayName(dayValue: number): string {
    const day = this.daysOfWeek.find(d => d.value === dayValue);
    return day ? day.label : 'Unknown';
  }

  // Helper method to check if doctor is permanent
  isPermanentDoctor(): boolean {
    return this.user && this.user.doctor_type === 'permanent';
  }

  // Helper method to check if doctor is visiting
  isVisitingDoctor(): boolean {
    return this.user && this.user.doctor_type === 'visiting';
  }

  // Helper method to get visiting days display
  getVisitingDaysDisplay(): string {
    if (!this.user || !this.user.visiting_days || this.user.visiting_days.length === 0) {
      return 'Not specified';
    }
    return this.user.visiting_days.map((day: number) => this.getDayName(day)).join(', ');
  }

  // Helper method to get visiting time slots display
  getVisitingTimeSlotsDisplay(): string {
    if (!this.user || !this.user.visiting_days || this.user.visiting_days.length === 0) {
      return 'Not specified';
    }
    const timeSlots = this.user.visiting_days.map((day: number) => {
      const dayName = this.getDayName(day);
      const timeSlot = this.user.visiting_day_times[day];
      if (timeSlot && timeSlot.start_time && timeSlot.end_time) {
        return `${dayName}: ${timeSlot.start_time} - ${timeSlot.end_time}`;
      }
      return dayName;
    });
    return timeSlots.join(', ');
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
    
    // Create FormData for file upload
    const formData = new FormData();
    
    // Add bio if changed
    if (this.editForm.bio !== this.user.bio) {
      formData.append('bio', this.editForm.bio || '');
    }
    
    // Add photo if selected
    if (this.photo) {
      formData.append('photo', this.photo);
    }
    
    this.auth.updateProfile(formData).subscribe({
      next: user => {
        this.user = user;
        this.editForm = { ...user }; // Update edit form with new data
        this.loading = false;
        this.showUpdateForm = false;
        this.photo = null;
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

  openUpdateForm() {
    this.showUpdateForm = true;
    this.editForm = { ...this.user }; // Reset edit form with current user data
    this.errorMsg = '';
  }

  cancelUpdate() {
    this.showUpdateForm = false;
    this.editForm = { ...this.user }; // Reset edit form
    this.photo = null;
    this.errorMsg = '';
  }
}
