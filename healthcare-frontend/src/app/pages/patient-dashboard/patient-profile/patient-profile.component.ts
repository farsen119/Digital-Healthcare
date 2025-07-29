import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SideNavbarComponent } from '../side-navbar/side-navbar.component';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SideNavbarComponent],
  templateUrl: './patient-profile.component.html',
  styleUrl: './patient-profile.component.css'
})
export class PatientProfileComponent implements OnInit {
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
      age: this.user.age,
      gender: this.user.gender,
      city: this.user.city,
      // Patient-specific fields
      date_of_birth: this.user.date_of_birth,
      address: this.user.address,
      blood_group: this.user.blood_group,
      emergency_contact_name: this.user.emergency_contact_name,
      emergency_contact_phone: this.user.emergency_contact_phone,
      emergency_contact_relationship: this.user.emergency_contact_relationship,
      medical_history: this.user.medical_history,
      current_medications: this.user.current_medications,
      allergies: this.user.allergies,
      height: this.user.height,
      weight: this.user.weight,
      occupation: this.user.occupation,
      marital_status: this.user.marital_status
    };
    if (this.photo) data.photo = this.photo;
    this.auth.updateProfile(data).subscribe({
      next: user => {
        this.user = user;
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
    this.errorMsg = '';
  }

  cancelUpdate() {
    this.showUpdateForm = false;
    this.photo = null;
    this.errorMsg = '';
  }
}
