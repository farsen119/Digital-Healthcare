import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AppointmentService } from '../../services/appointment.service';
import { WebSocketService } from '../../services/websocket.service';
import { WebSocketMessage } from '../../types/websocket.types';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
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
  loadingQueue = false;
  private subscriptions: Subscription[] = [];

  // Queue management
  queuePatients: any[] = [];
  acceptedPatients: any[] = [];
  rejectedPatients: any[] = [];

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
    private appointmentService: AppointmentService,
    private router: Router,
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
          // Load queue data for permanent doctors
          if (this.isPermanentDoctor()) {
            this.loadQueueData();
            // Check for next patient after loading queue data
            setTimeout(() => this.checkForNextPatient(), 1000);
          }
        },
        error: error => {
          // Handle error silently
        }
      })
    );

    // Check if returning from prescription page
    this.checkIfReturningFromPrescription();

    this.subscriptions.push(
      this.webSocketService.messages$.subscribe(message => {
        if (message && message.type === 'doctor_status_change') {
          this.handleStatusChange(message);
        }
        // Handle queue updates
        if (message && message.type === 'queue_update') {
          this.handleQueueUpdate(message);
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

  // Queue Management Methods
  loadQueueData() {
    if (!this.user?.id) return;
    
    this.loadingQueue = true;
    this.appointmentService.getQueueStatus(this.user.id).subscribe({
      next: (response: any) => {
        this.queuePatients = response.waiting_patients || [];
        
        // Show only the currently consulting patient (accepted but not completed)
        // This should be the patient that the doctor accepted but hasn't completed consultation yet
        if (response.accepted_patients && response.accepted_patients.length > 0) {
          // Get the most recent accepted patient (the one currently being consulted)
          this.acceptedPatients = [response.accepted_patients[0]];
        } else {
          this.acceptedPatients = [];
        }
        

        this.loadingQueue = false;
        
        // Check for next patient after loading queue data
        this.checkForNextPatient();
      },
      error: (error) => {
        console.error('Error loading queue data:', error);
        this.loadingQueue = false;
      }
    });
  }

  refreshQueue() {
    this.loadQueueData();
  }

  acceptPatient(patient: any) {
    if (!patient || !this.user?.id) return;
    

    patient.processing = true;
    this.appointmentService.acceptPatient(patient.patient).subscribe({
      next: (response) => {

        patient.processing = false;
        this.showSuccessMessage('Patient accepted successfully! Redirecting to prescription...');
        
        // Automatically navigate to prescription write page
        if (response.appointment_id) {
          setTimeout(() => {
            this.router.navigate(['/prescriptions/write', response.appointment_id]);
          }, 1000); // Small delay to show success message
        } else {
          this.showErrorMessage('Appointment ID not found. Cannot create prescription.');
        }
      },
      error: (error) => {
        console.error('Error accepting patient:', error);
        patient.processing = false;
        this.showErrorMessage('Failed to accept patient. Please try again.');
      }
    });
  }

  rejectPatient(patient: any) {
    if (!patient || !this.user?.id) return;
    
    if (confirm(`Are you sure you want to reject ${patient.patient_name || 'this patient'}?`)) {
      patient.processing = true;
      this.appointmentService.rejectPatient(patient.patient).subscribe({
        next: (response) => {
          // Remove patient from queue
          this.queuePatients = this.queuePatients.filter(p => p.id !== patient.id);
          this.rejectedPatients.push({ ...patient, rejected_at: new Date() });
          patient.processing = false;
          this.showSuccessMessage('Patient rejected successfully!');
          
          // Reload queue data to get updated state
          this.loadQueueData();
        },
        error: (error) => {
          console.error('Error rejecting patient:', error);
          patient.processing = false;
          this.showErrorMessage('Failed to reject patient. Please try again.');
        }
      });
    }
  }

  viewPatientDetails(patient: any) {
    // Navigate to patient details page
    this.router.navigate(['/patient-details', patient.patient_id]);
  }

  viewPrescription(patient: any) {
    // Navigate to prescription view page
    if (patient.appointment_id) {
      this.router.navigate(['/prescriptions/view', patient.appointment_id]);
    } else {
      this.showErrorMessage('Appointment ID not found. Cannot view prescription.');
    }
  }

  writePrescription(patient: any) {
    // Navigate to prescription write page
    if (patient.appointment_id) {
      this.router.navigate(['/prescriptions/write', patient.appointment_id]);
    } else {
      this.showErrorMessage('Appointment ID not found. Cannot write prescription.');
    }
  }

  completeConsultation(patient: any) {
    if (confirm(`Are you sure you want to complete consultation with ${patient.patient_name || 'this patient'}?`)) {
      this.appointmentService.completeConsultation().subscribe({
        next: (response) => {
          this.showSuccessMessage('Consultation completed successfully!');
          // Reload queue data to update the dashboard
          this.loadQueueData();
        },
        error: (error) => {
          console.error('Error completing consultation:', error);
          this.showErrorMessage('Failed to complete consultation. Please try again.');
        }
      });
    }
  }

  // Check if prescription exists for the currently consulting patient
  hasPrescription(patient: any): boolean {
    return patient && patient.appointment_id && patient.prescription;
  }





  private handleQueueUpdate(message: WebSocketMessage) {
    // Handle real-time queue updates
    if (message.doctor_id === this.user?.id) {
      this.loadQueueData();
    }
  }

  private showSuccessMessage(message: string) {
    // You can implement a toast notification here
    alert(message);
  }

  private showErrorMessage(message: string) {
    // You can implement a toast notification here
    alert(message);
  }

  private checkForNextPatient(): void {
    // Check if there are patients in queue and doctor is not consulting
    if (this.queuePatients.length > 0 && !this.user?.is_consulting) {
      const firstPatient = this.queuePatients.find(p => p.position === 1);
      if (firstPatient) {
        this.showSuccessMessage(`Next patient available: ${firstPatient.patient_name}. You can now accept them.`);
      }
    }
  }

  // Method to check if doctor can accept next patient
  canAcceptNextPatient(): boolean {
    return this.queuePatients.length > 0 && !this.user?.is_consulting;
  }

  private checkIfReturningFromPrescription(): void {
    // Check if there's a flag in sessionStorage indicating return from prescription
    const returningFromPrescription = sessionStorage.getItem('returningFromPrescription');
    if (returningFromPrescription === 'true') {
      sessionStorage.removeItem('returningFromPrescription');
      // Reload queue data and check for next patient
      setTimeout(() => {
        this.loadQueueData();
        this.checkForNextPatient();
      }, 500);
    }
  }

  // Method to handle when doctor returns to dashboard
  onReturnToDashboard(): void {
    // Reload queue data and check for next patient
    this.loadQueueData();
    setTimeout(() => {
      this.checkForNextPatient();
    }, 1000);
  }
}