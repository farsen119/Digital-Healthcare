import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';
import { WebSocketMessage } from '../../types/websocket.types';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DashboardNotificationComponent } from '../dashboard-notification/dashboard-notification.component';
import { SideNavbarComponent } from './side-navbar/side-navbar.component';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DashboardNotificationComponent, SideNavbarComponent],
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.css']
})
export class DoctorDashboardComponent implements OnInit, OnDestroy {
  user: any = null;
  loading = false;
  private subscriptions: Subscription[] = [];

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

  constructor(
    private auth: AuthService,
    public webSocketService: WebSocketService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.auth.getProfile().subscribe({
        next: user => {
          this.user = user;
          if (this.user && this.user.is_available_for_consultation === undefined) {
            this.user.is_available_for_consultation = false;
          }
        },
        error: error => {
          // Handle error silently
        }
      })
    );

    this.subscriptions.push(
      this.webSocketService.messages$.subscribe(message => {
        if (message && message.type === 'doctor_status_change') {
          this.handleStatusChange(message);
        }
      })
    );

    this.subscriptions.push(
      this.webSocketService.connectionStatus$.subscribe(connected => {
        // Connection status updated
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Helper method to check if doctor is permanent
  isPermanentDoctor(): boolean {
    return this.user && this.user.doctor_type === 'permanent';
  }

  // Helper method to check if doctor is visiting
  isVisitingDoctor(): boolean {
    return this.user && this.user.doctor_type === 'visiting';
  }

  // Helper method to get day name
  getDayName(dayValue: number): string {
    const day = this.daysOfWeek.find(d => d.value === dayValue);
    return day ? day.label : 'Unknown';
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

  toggleConsultationStatus() {
    if (!this.user || this.loading) {
      return;
    }
    
    this.loading = true;
    const newStatus = !this.user.is_available_for_consultation;
    
    this.user.is_available_for_consultation = newStatus;
    
    this.webSocketService.updateDoctorStatus(this.user.id, newStatus);
    
    const data = {
      is_available_for_consultation: newStatus
    };
    
    this.auth.updateProfile(data).subscribe({
      next: user => {
        this.user = user;
        this.loading = false;
      },
      error: (err) => {
        this.user.is_available_for_consultation = !newStatus;
        this.loading = false;
        alert('Failed to update status. Please try again.');
      }
    });
  }

  private handleStatusChange(message: WebSocketMessage) {
    if (!message.doctor_id || !message.doctor_info) return;
    
    // Update local user state if it's the current user
    if (message.doctor_id === this.user?.id) {
      this.user.is_available_for_consultation = message.doctor_info.is_available_for_consultation;
    }
  }
}