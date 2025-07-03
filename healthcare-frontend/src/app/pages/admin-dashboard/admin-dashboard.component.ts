import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AppointmentService } from '../../services/appointment.service';
import { ActivityService, Activity } from '../../services/activity.service'; // <-- Add this
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AdminSidebarComponent],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  users: any[] = [];
  latestUsers: any[] = [];
  appointments: any[] = [];
  activities: Activity[] = []; // <-- Add this
  loadingActivities = true;    // <-- Add this
  activityError = '';          // <-- Add this

  constructor(
    private userService: UserService,
    private appointmentService: AppointmentService,
    private activityService: ActivityService // <-- Add this
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadAppointments();
    this.loadActivities(); // <-- Add this
  }

  loadUsers() {
    this.userService.getUsers().subscribe(users => {
      this.users = users;
      this.latestUsers = users.slice(0, 5);
    });
  }

  loadAppointments() {
    this.appointmentService.getAppointments().subscribe(appointments => {
      this.appointments = appointments;
    });
  }

  loadActivities() { // <-- Add this
    this.activityService.getRecentActivities().subscribe({
      next: (data) => {
        this.activities = data;
        this.loadingActivities = false;
      },
      error: (err) => {
        this.activityError = 'Could not load recent activities.';
        this.loadingActivities = false;
      }
    });
  }
}