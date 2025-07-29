import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { WebSocketService } from '../../services/websocket.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardNotificationComponent } from '../dashboard-notification/dashboard-notification.component';
import { SideNavbarComponent } from './side-navbar/side-navbar.component';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DashboardNotificationComponent, SideNavbarComponent],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.css'
})
export class PatientDashboardComponent implements OnInit, OnDestroy {
  user: any = null;
  photo: File | null = null;
  loading = false;
  showUpdateForm = false;
  errorMsg: string = '';
  availableDoctors: any[] = [];
  allDoctors: any[] = []; // Store all doctors
  loadingDoctors = false;
  isWebSocketConnected = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private userService: UserService,
    public webSocketService: WebSocketService
  ) {}

  ngOnInit() {
    // Load user profile first
    this.auth.getProfile().subscribe({
      next: user => {
        this.user = user;
        // Load doctors and setup WebSocket
        this.loadAllDoctors();
        this.setupWebSocket();
      },
      error: err => {
        console.error('Failed to load user profile:', err);
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  setupWebSocket() {
    // Subscribe to WebSocket connection status
    this.subscriptions.push(
      this.webSocketService.connectionStatus$.subscribe(connected => {
        this.isWebSocketConnected = connected;
        if (connected) {
          this.webSocketService.refreshDoctorStatuses();
        }
      })
    );

    // Subscribe to doctor status updates (same as admin dashboard)
    this.subscriptions.push(
      this.webSocketService.doctorStatus$.subscribe((statuses: any[]) => {
        // Update doctor statuses without reloading
        this.updateDoctorStatuses(statuses);
      })
    );

    // Subscribe to doctor status changes from WebSocket
    this.subscriptions.push(
      this.webSocketService.messages$.subscribe(message => {
        if (message && message.type === 'doctor_status_change') {
          this.handleDoctorStatusChange(message);
        }
      })
    );

    // Fallback polling (same as admin dashboard - 3 seconds)
    this.subscriptions.push(
      interval(3000).subscribe(() => {
        if (!this.webSocketService.isConnected() && this.webSocketService.isInFallbackMode()) {
          this.webSocketService.refreshDoctorStatuses();
        }
      })
    );
  }

  handleDoctorStatusChange(message: any) {
    if (!message.doctor_id || !message.doctor_info) return;
    
    // Update the doctor status in allDoctors array
    const doctorIndex = this.allDoctors.findIndex(d => d.id === message.doctor_id);
    if (doctorIndex !== -1) {
      this.allDoctors[doctorIndex].is_available_for_consultation = message.doctor_info.is_available_for_consultation;
    }
    
    // Update available doctors list without reloading
    this.updateAvailableDoctorsList();
  }

  updateDoctorStatuses(statuses: any[]) {
    // Update statuses in allDoctors array without reloading
    statuses.forEach(status => {
      const doctorIndex = this.allDoctors.findIndex(d => d.id === status.doctor_id);
      if (doctorIndex !== -1) {
        this.allDoctors[doctorIndex].is_available_for_consultation = status.is_available_for_consultation;
      }
    });
    
    // Update available doctors list
    this.updateAvailableDoctorsList();
  }

  updateAvailableDoctorsList() {
    // Filter available doctors from allDoctors without API call
    this.availableDoctors = this.allDoctors.filter(doctor => doctor.is_available_for_consultation);
  }

  loadAllDoctors() {
    // Only load if user is authenticated
    if (!this.user || this.loadingDoctors) return;

    this.loadingDoctors = true;
    
    const timeout = setTimeout(() => {
      this.loadingDoctors = false;
    }, 8000);

    this.userService.getUsers().subscribe({
      next: (users) => {
        clearTimeout(timeout);
        // Store all doctors and filter available ones
        this.allDoctors = users.filter(user => user.role === 'doctor');
        this.updateAvailableDoctorsList();
        this.loadingDoctors = false;
      },
      error: (err) => {
        clearTimeout(timeout);
        this.loadingDoctors = false;
        // Handle error silently - don't log 403 errors
        if (err.status !== 403) {
          console.error('Error loading doctors:', err);
        }
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