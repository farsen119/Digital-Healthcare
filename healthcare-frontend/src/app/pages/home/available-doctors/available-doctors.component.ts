import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-available-doctors',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './available-doctors.component.html',
  styleUrl: './available-doctors.component.css'
})
export class AvailableDoctorsComponent implements OnInit {
  doctors: any[] = [];
  loading = false;
  error = '';

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadAllDoctors();
  }

  loadAllDoctors() {
    this.loading = true;
    // Use public method that doesn't require authentication
    this.userService.getPublicDoctors().subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load doctors.';
        this.loading = false;
      }
    });
  }

  getDoctorPhotoUrl(doctor: any): string {
    if (doctor.photo) {
      if (doctor.photo.startsWith('http')) {
        return doctor.photo;
      }
      return 'http://localhost:8000' + doctor.photo;
    }
    return '';
  }
}
