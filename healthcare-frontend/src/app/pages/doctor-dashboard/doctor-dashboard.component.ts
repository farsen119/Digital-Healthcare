import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardNotificationComponent } from '../dashboard-notification/dashboard-notification.component';
import { SideNavbarComponent } from './side-navbar/side-navbar.component';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DashboardNotificationComponent, SideNavbarComponent],
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.css']
})
export class DoctorDashboardComponent implements OnInit {
  user: any = null;
  loading = false;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.getProfile().subscribe(user => {
      this.user = user;
      // Initialize is_live if not present
      if (this.user && this.user.is_live === undefined) {
        this.user.is_live = false;
      }
    });
  }

  toggleLiveStatus() {
    this.loading = true;
    
    const data = {
      is_live: this.user.is_live
    };
    
    this.auth.updateProfile(data).subscribe({
      next: user => {
        this.user = user;
        this.loading = false;
        const status = this.user.is_live ? 'Online' : 'Offline';
        alert(`Status updated! You are now ${status}.`);
      },
      error: (err) => {
        this.loading = false;
        // Revert the toggle if update failed
        this.user.is_live = !this.user.is_live;
        alert('Failed to update status. Please try again.');
      }
    });
  }
}