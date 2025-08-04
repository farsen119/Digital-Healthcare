import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { WebSocketService } from '../../services/websocket.service';
import { AppointmentService } from '../../services/appointment.service';
import { OrderService } from '../../services/medicine_store_services/order.service';
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
  
  // Available Doctors
  availableDoctors: any[] = [];
  allDoctors: any[] = [];
  loadingDoctors = false;
  isWebSocketConnected = false;
  
  // Patient Data
  appointments: any[] = [];
  recentAppointments: any[] = [];
  upcomingAppointments: any[] = [];
  prescriptions: any[] = [];
  orders: any[] = [];
  recentOrders: any[] = [];
  
  // Stats
  totalAppointments = 0;
  totalPrescriptions = 0;
  totalOrders = 0;
  totalSpent = 0;

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
  
  private subscriptions: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private appointmentService: AppointmentService,
    private orderService: OrderService,
    public webSocketService: WebSocketService
  ) {}

  ngOnInit() {
    // Load user profile first
    this.auth.getProfile().subscribe({
      next: user => {
        this.user = user;
        // Load all data
        this.loadAllDoctors();
        this.loadPatientData();
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

  loadPatientData() {
    // Load appointments
    this.appointmentService.getAppointments().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.recentAppointments = appointments.slice(0, 3);
        this.upcomingAppointments = appointments.filter(apt => 
          new Date(apt.date) > new Date() && apt.status === 'accepted'
        ).slice(0, 3);
        this.totalAppointments = appointments.length;
        
        // Count prescriptions
        this.prescriptions = appointments.filter(apt => apt.prescription);
        this.totalPrescriptions = this.prescriptions.length;
      },
      error: (err) => {
        console.error('Error loading appointments:', err);
      }
    });

    // Load orders
    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.recentOrders = orders.slice(0, 3);
        this.totalOrders = orders.length;
        this.totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
      },
      error: (err) => {
        console.error('Error loading orders:', err);
      }
    });
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

    this.userService.getDoctors().subscribe({
      next: (doctors) => {
        clearTimeout(timeout);
        // Store all doctors and filter available ones
        this.allDoctors = doctors;
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

  // Helper method to check if doctor is permanent
  isPermanentDoctor(doctor: any): boolean {
    return doctor && doctor.doctor_type === 'permanent';
  }

  // Helper method to check if doctor is visiting
  isVisitingDoctor(doctor: any): boolean {
    return doctor && doctor.doctor_type === 'visiting';
  }

  // Helper method to get day name
  getDayName(dayValue: number): string {
    const day = this.daysOfWeek.find(d => d.value === dayValue);
    return day ? day.label : 'Unknown';
  }

  // Helper method to get visiting days display
  getVisitingDaysDisplay(doctor: any): string {
    if (!doctor || !doctor.visiting_days || doctor.visiting_days.length === 0) {
      return 'Not specified';
    }
    return doctor.visiting_days.map((day: number) => this.getDayName(day)).join(', ');
  }

  // Helper method to get visiting time slots display
  getVisitingTimeSlotsDisplay(doctor: any): string {
    if (!doctor || !doctor.visiting_days || doctor.visiting_days.length === 0) {
      return 'Not specified';
    }
    const timeSlots = doctor.visiting_days.map((day: number) => {
      const dayName = this.getDayName(day);
      const timeSlot = doctor.visiting_day_times[day];
      if (timeSlot && timeSlot.start_time && timeSlot.end_time) {
        return `${dayName}: ${timeSlot.start_time} - ${timeSlot.end_time}`;
      }
      return dayName;
    });
    return timeSlots.join(', ');
  }

  // Get currently available doctors (permanent doctors who are online and available)
  getCurrentlyAvailableDoctors(): any[] {
    return this.allDoctors.filter(doctor => 
      this.isPermanentDoctor(doctor) && 
      doctor.is_available_for_consultation
    );
  }

  // Get special doctors (visiting doctors)
  getSpecialDoctors(): any[] {
    return this.allDoctors.filter(doctor => 
      this.isVisitingDoctor(doctor)
    );
  }
}