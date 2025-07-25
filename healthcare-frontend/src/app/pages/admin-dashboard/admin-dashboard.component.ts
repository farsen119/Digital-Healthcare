import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AppointmentService } from '../../services/appointment.service';
import { ActivityService, Activity } from '../../services/activity.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { OrderService } from '../../services/medicine_store_services/order.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AdminSidebarComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  users: any[] = [];
  latestUsers: any[] = [];
  appointments: any[] = [];
  activities: Activity[] = [];
  loadingActivities = true;
  activityError = '';

  orders: any[] = [];
  latestOrders: any[] = [];
  totalRevenue: number = 0; // <-- Add this

  constructor(
    private userService: UserService,
    private appointmentService: AppointmentService,
    private activityService: ActivityService,
    private orderService: OrderService // <-- Inject here
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadAppointments();
    this.loadActivities();
    this.loadOrders(); // <-- Load orders and revenue
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

  loadActivities() {
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

  loadOrders() {
    this.orderService.getAllOrders().subscribe(data => {
      this.orders = data.orders;
      this.latestOrders = this.orders.slice(0, 5);
      this.totalRevenue = data.total_revenue;
    });
  }
}