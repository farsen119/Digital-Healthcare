import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PharmacistSideNavbarComponent } from './side-navbar/side-navbar.component';

@Component({
  selector: 'app-pharmacist-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PharmacistSideNavbarComponent],
  templateUrl: './pharmacist-dashboard.component.html',
  styleUrl: './pharmacist-dashboard.component.css'
})
export class PharmacistDashboardComponent implements OnInit {
  user: any = null;
  pendingPrescriptions: any[] = [];
  dispensedPrescriptions: any[] = [];
  totalPrescriptions = 0;
  availableMedicines = 0;
  lowStockMedicines = 0;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.loadUserProfile();
    this.loadDashboardData();
  }

  loadUserProfile() {
    this.auth.getProfile().subscribe({
      next: (user) => {
        this.user = user;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
      }
    });
  }

  loadDashboardData() {
    // TODO: Load pharmacist-specific data
    // - Pending prescriptions
    // - Dispensed prescriptions
    // - Medicine inventory
    // - Stock alerts
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
}
