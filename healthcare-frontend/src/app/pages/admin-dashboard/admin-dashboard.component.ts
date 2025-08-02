import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AppointmentService } from '../../services/appointment.service';
import { ActivityService, Activity } from '../../services/activity.service';
import { WebSocketService } from '../../services/websocket.service';
import { WebSocketMessage, DoctorStatus } from '../../types/websocket.types';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { OrderService } from '../../services/medicine_store_services/order.service';
import { Subscription } from 'rxjs';
import { interval } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AdminSidebarComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  users: any[] = [];
  latestUsers: any[] = [];
  appointments: any[] = [];
  activities: Activity[] = [];
  loadingActivities = true;
  activityError = '';

  orders: any[] = [];
  latestOrders: any[] = [];
  totalRevenue: number = 0;

  // WebSocket related properties
  onlineDoctors: any[] = [];
  allDoctors: any[] = [];
  totalDoctors: number = 0;
  onlineCount: number = 0;
  offlineCount: number = 0;
  isWebSocketConnected: boolean = false;
  isRefreshing: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private userService: UserService,
    private appointmentService: AppointmentService,
    private activityService: ActivityService,
    private orderService: OrderService,
    public webSocketService: WebSocketService
  ) {}

  // Getter for online doctors
  get onlineDoctorsList(): any[] {
    return this.allDoctors.filter(d => d.is_available_for_consultation);
  }

  ngOnInit() {
    this.loadUsers();
    this.loadAppointments();
    this.loadActivities();
    this.loadOrders();
    this.setupWebSocket();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  setupWebSocket() {
    this.subscriptions.push(
      this.webSocketService.connectionStatus$.subscribe(connected => {
        this.isWebSocketConnected = connected;
        if (connected) {
          this.webSocketService.refreshDoctorStatuses();
        }
      })
    );

    this.subscriptions.push(
      this.webSocketService.doctorStatus$.subscribe((statuses: any[]) => {
        statuses.forEach(status => {
          const doctorIndex = this.allDoctors.findIndex(d => d.id === status.doctor_id);
          if (doctorIndex !== -1) {
            this.allDoctors[doctorIndex].is_available_for_consultation = status.is_available_for_consultation;
          }
        });
        
        this.onlineDoctors = statuses.filter(status => status.is_available_for_consultation);
        this.updateStats();
      })
    );

    this.subscriptions.push(
      this.webSocketService.messages$.subscribe(message => {
        if (message && message.type === 'doctor_status_change') {
          this.handleDoctorStatusChange(message);
        }
      })
    );

    this.loadInitialData();

    this.subscriptions.push(
      interval(3000).subscribe(() => {
        if (!this.webSocketService.isConnected() && this.webSocketService.isInFallbackMode()) {
          this.webSocketService.refreshDoctorStatuses();
        }
      })
    );
  }

  loadInitialData() {
    this.loadUsers();
    this.loadAppointments();
    this.loadActivities();
    this.loadOrders();
    
    this.userService.getDoctors().subscribe(doctors => {
      this.allDoctors = doctors;
      this.totalDoctors = this.allDoctors.length;
      this.updateStats();
    });
  }

  handleDoctorStatusChange(message: WebSocketMessage) {
    if (!message.doctor_id || !message.doctor_info) return;
    
    const doctorIndex = this.allDoctors.findIndex(d => d.id === message.doctor_id);
    if (doctorIndex !== -1) {
      this.allDoctors[doctorIndex].is_available_for_consultation = message.doctor_info.is_available_for_consultation;
      this.updateStats();
    }
  }

  updateStats() {
    this.onlineCount = this.allDoctors.filter(d => d.is_available_for_consultation).length;
    this.offlineCount = this.totalDoctors - this.onlineCount;
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

  manualRefresh() {
    this.isRefreshing = true;
    
    this.loadInitialData();
    this.webSocketService.refreshDoctorStatuses();
    
    setTimeout(() => {
      this.isRefreshing = false;
    }, 1000);
  }
}