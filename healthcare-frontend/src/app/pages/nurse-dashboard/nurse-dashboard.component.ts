import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NurseSideNavbarComponent } from './side-navbar/side-navbar.component';
import { DashboardNotificationComponent } from '../dashboard-notification/dashboard-notification.component';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-nurse-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NurseSideNavbarComponent,
    DashboardNotificationComponent
  ],
  providers: [AuthService],
  templateUrl: './nurse-dashboard.component.html',
  styleUrl: './nurse-dashboard.component.css'
})
export class NurseDashboardComponent implements OnInit {
  user: User | null = null;
  loading = false;
  loadingPatients = false;

  // Mock data for demonstration
  assignedPatients: any[] = [];
  pendingReminders: any[] = [];
  completedTasks: any[] = [];
  urgentPatients: any[] = [];
  recentPatientCare: any[] = [];
  recentReminders: any[] = [];
  todayReminders: any[] = [];
  upcomingReminders: any[] = [];
  healthChecks: any[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardData();
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

  loadDashboardData(): void {
    this.loadingPatients = true;
    
    // Mock data - replace with actual API calls
    setTimeout(() => {
      this.assignedPatients = [
        {
          id: 1,
          patient_name: 'John Doe',
          condition: 'Diabetes Management',
          assigned_date: new Date(),
          reminders_count: 3,
          priority: 'high',
          processing: false
        },
        {
          id: 2,
          patient_name: 'Jane Smith',
          condition: 'Hypertension',
          assigned_date: new Date(),
          reminders_count: 2,
          priority: 'medium',
          processing: false
        },
        {
          id: 3,
          patient_name: 'Mike Johnson',
          condition: 'Post-surgery Care',
          assigned_date: new Date(),
          reminders_count: 1,
          priority: 'normal',
          processing: false
        }
      ];
      
      this.urgentPatients = [
        { id: 1, patient_name: 'John Doe', condition: 'Diabetes Management', priority: 'high' }
      ];
      
      this.pendingReminders = [
        { id: 1, patient_name: 'John Doe', medicine_name: 'Insulin', time: '08:00 AM', status: 'pending' },
        { id: 2, patient_name: 'Jane Smith', medicine_name: 'Blood Pressure Med', time: '09:00 AM', status: 'pending' },
        { id: 3, patient_name: 'Mike Johnson', medicine_name: 'Pain Relief', time: '10:00 AM', status: 'pending' }
      ];
      
      this.completedTasks = [
        { id: 1, task: 'Medicine reminder sent', time: '07:30 AM' },
        { id: 2, task: 'Health status updated', time: '06:45 AM' },
        { id: 3, task: 'Patient check-up completed', time: '05:30 AM' }
      ];
      
      this.recentPatientCare = [
        { id: 1, patient_name: 'John Doe', care_type: 'Medicine Administration', date: new Date(), status: 'completed' },
        { id: 2, patient_name: 'Jane Smith', care_type: 'Vital Signs Check', date: new Date(), status: 'in_progress' },
        { id: 3, patient_name: 'Mike Johnson', care_type: 'Wound Dressing', date: new Date(), status: 'completed' }
      ];
      
      this.recentReminders = [
        { id: 1, patient_name: 'John Doe', medicine_name: 'Insulin', time: '08:00 AM', date: new Date(), status: 'completed' },
        { id: 2, patient_name: 'Jane Smith', medicine_name: 'Blood Pressure Med', time: '09:00 AM', date: new Date(), status: 'pending' }
      ];
      
      this.todayReminders = [
        { id: 1, patient_name: 'John Doe', medicine_name: 'Insulin', time: '08:00 AM' },
        { id: 2, patient_name: 'Jane Smith', medicine_name: 'Blood Pressure Med', time: '09:00 AM' }
      ];
      
      this.upcomingReminders = [
        { id: 1, patient_name: 'Mike Johnson', medicine_name: 'Pain Relief', time: '10:00 AM' },
        { id: 2, patient_name: 'John Doe', medicine_name: 'Evening Insulin', time: '06:00 PM' }
      ];
      
      this.healthChecks = [
        { id: 1, patient_name: 'John Doe', check_type: 'Blood Sugar', status: 'monitoring' },
        { id: 2, patient_name: 'Jane Smith', check_type: 'Blood Pressure', status: 'monitoring' }
      ];
      
      this.loadingPatients = false;
    }, 1000);
  }

  toggleDutyStatus(): void {
    if (!this.user) return;
    
    this.loading = true;
    this.user.is_available_for_duty = !this.user.is_available_for_duty;
    
    // Here you would make an API call to update the user's duty status
    setTimeout(() => {
      this.loading = false;
      // Show success message
    }, 500);
  }

  refreshPatients(): void {
    this.loadDashboardData();
  }

  viewPatientDetails(patient: any): void {
    patient.processing = true;
    // Navigate to patient details or open modal
    setTimeout(() => {
      patient.processing = false;
    }, 1000);
  }

  manageReminders(patient: any): void {
    patient.processing = true;
    // Navigate to reminders management
    setTimeout(() => {
      patient.processing = false;
    }, 1000);
  }

  updateHealthStatus(patient: any): void {
    patient.processing = true;
    // Navigate to health status update
    setTimeout(() => {
      patient.processing = false;
    }, 1000);
  }
}
