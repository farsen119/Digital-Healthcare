import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import { UserService } from '../../services/user.service';
import { TimeSlotService } from '../../services/time-slot.service';
import { AppointmentCreateDTO } from '../../models/appointment.model';
import { User } from '../../models/user.model';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-book-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminSidebarComponent],
  templateUrl: './admin-book-appointment.component.html',
  styleUrls: ['./admin-book-appointment.component.css']
})
export class AdminBookAppointmentComponent implements OnInit, OnDestroy {
  appointment: Partial<AppointmentCreateDTO> = {
    reason: '',
    status: 'pending'
  };
  
  doctors: User[] = [];
  patients: User[] = [];
  timeSlots: any[] = [];
  availableDates: any[] = [];
  selectedDoctor: any = null;
  loadingSlots = false;
  loadingDates = false;

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
    private appointmentService: AppointmentService,
    private userService: UserService,
    public timeSlotService: TimeSlotService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Set current date as default
    this.appointment.date = this.getCurrentDate();
    
    this.subscriptions.push(
      this.userService.getDoctors().subscribe(data => this.doctors = data)
    );
    this.subscriptions.push(
      this.userService.getPatients().subscribe(data => this.patients = data)
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getCurrentDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  onDoctorChange() {
    if (this.appointment.doctor) {
      this.selectedDoctor = this.doctors.find(doc => doc.id == this.appointment.doctor);
      if (this.selectedDoctor) {
        console.log('Selected doctor:', this.selectedDoctor);
        
        if (this.selectedDoctor.doctor_type === 'permanent') {
          // For permanent doctors, set current date and clear time (not needed)
          this.appointment.date = this.getCurrentDate();
          this.appointment.time = ''; // Clear time for permanent doctors
          this.timeSlots = []; // No time slots needed
        } else if (this.selectedDoctor.doctor_type === 'visiting') {
          // For visiting doctors, load available dates
          this.loadAvailableDates();
        }
      }
    } else {
      this.selectedDoctor = null;
      this.timeSlots = [];
      this.availableDates = [];
    }
    // Reset time when doctor changes
    this.appointment.time = '';
  }

  loadCurrentTimeSlots() {
    // This method is no longer needed for permanent doctors
    // Time will be automatically set in the backend
  }

  loadAvailableDates() {
    if (!this.selectedDoctor || this.selectedDoctor.doctor_type !== 'visiting') return;
    
    this.loadingDates = true;
    this.availableDates = [];
    
    this.subscriptions.push(
      this.appointmentService.getAvailableDates(this.selectedDoctor.id).subscribe({
        next: (response: any) => {
          if (response.doctor_type === 'visiting') {
            this.availableDates = response.available_dates;
          }
          this.loadingDates = false;
        },
        error: (error) => {
          console.error('Error loading available dates:', error);
          this.loadingDates = false;
        }
      })
    );
  }

  onDateChange() {
    if (!this.selectedDoctor || !this.appointment.date) return;
    
    if (this.selectedDoctor.doctor_type === 'visiting') {
      this.loadAvailableTimeSlots();
    }
  }

  loadAvailableTimeSlots() {
    if (!this.selectedDoctor || this.selectedDoctor.doctor_type !== 'visiting' || !this.appointment.date) return;
    
    this.loadingSlots = true;
    this.timeSlots = [];
    
    this.subscriptions.push(
      this.appointmentService.getAvailableSlots(this.selectedDoctor.id, this.appointment.date).subscribe({
        next: (response: any) => {
          if (response.doctor_type === 'visiting') {
            this.timeSlots = response.available_slots;
          }
          this.loadingSlots = false;
        },
        error: (error) => {
          console.error('Error loading available slots:', error);
          this.loadingSlots = false;
        }
      })
    );
  }

  // Helper method to get day name
  getDayName(dayValue: number): string {
    const day = this.daysOfWeek.find(d => d.value === dayValue);
    return day ? day.label : 'Unknown';
  }

  // Helper method to get visiting days display
  getVisitingDaysDisplay(): string {
    if (!this.selectedDoctor || !this.selectedDoctor.visiting_days || this.selectedDoctor.visiting_days.length === 0) {
      return 'Not specified';
    }
    return this.selectedDoctor.visiting_days.map((day: number) => this.getDayName(day)).join(', ');
  }

  // Helper method to get visiting time slots display
  getVisitingTimeSlotsDisplay(): string {
    if (!this.selectedDoctor || !this.selectedDoctor.visiting_days || this.selectedDoctor.visiting_days.length === 0) {
      return 'Not specified';
    }
    const timeSlots = this.selectedDoctor.visiting_days.map((day: number) => {
      const dayName = this.getDayName(day);
      const timeSlot = this.selectedDoctor.visiting_day_times[day];
      if (timeSlot && timeSlot.start_time && timeSlot.end_time) {
        return `${dayName}: ${timeSlot.start_time} - ${timeSlot.end_time}`;
      }
      return dayName;
    });
    return timeSlots.join(', ');
  }

  onSubmit(): void {
    // Check required fields based on doctor type
    const isPermanentDoctor = this.selectedDoctor?.doctor_type === 'permanent';
    const isVisitingDoctor = this.selectedDoctor?.doctor_type === 'visiting';
    
    if (!this.appointment.doctor || !this.appointment.patient || !this.appointment.reason) {
      alert('Please fill in all required fields: Doctor, Patient, and Reason for Visit.');
      return;
    }
    
    if (isPermanentDoctor) {
      // For permanent doctors, only date is required (auto-set to today)
      if (!this.appointment.date) {
        alert('Please ensure the date is set.');
        return;
      }
    } else if (isVisitingDoctor) {
      // For visiting doctors, date and time are required
      if (!this.appointment.date || !this.appointment.time) {
        alert('Please fill in all required fields: Date, Time, Doctor, Patient, and Reason for Visit.');
        return;
      }
    }
    
    this.appointmentService.createAppointment(this.appointment as AppointmentCreateDTO).subscribe({
      next: (response: any) => {
        let successMessage = 'Appointment created successfully!';
        
        // Add IST time information for permanent doctors
        if (isPermanentDoctor && response.joined_at_full) {
          successMessage += ` (Added to queue at ${response.joined_at_full})`;
        }
        
        alert(successMessage);
        this.router.navigate(['/admin-appointments']);
      },
      error: (err) => {
        console.error('Backend error details:', err.error);
        alert(`Failed to create appointment. Check console for backend error details.`);
      }
    });
  }
}
