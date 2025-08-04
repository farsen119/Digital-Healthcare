import { Component, OnInit, OnDestroy } from '@angular/core';
import { AppointmentService } from '../../services/appointment.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { TimeSlotService } from '../../services/time-slot.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-appointment.component.html'
})
export class BookAppointmentComponent implements OnInit, OnDestroy {
  form: any = {
    doctor: '',
    date: '',
    time: '',
    reason: ''
  };
  doctors: any[] = [];
  loading = false;
  userSub: Subscription | undefined;
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

  constructor(
    private appointmentService: AppointmentService,
    private userService: UserService,
    public auth: AuthService,
    public timeSlotService: TimeSlotService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Set current date as default
    this.form.date = this.getCurrentDate();
    
    this.userService.getDoctors().subscribe(doctors => {
      this.doctors = doctors;
      
      // Check if doctor is pre-selected from URL parameter
      this.route.queryParams.subscribe(params => {
        if (params['doctor_id']) {
          this.form.doctor = params['doctor_id'];
          this.onDoctorChange();
        } else if (params['doctor']) {
          this.form.doctor = params['doctor'];
          this.onDoctorChange();
        }
      });
    });
  }

  getCurrentDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  onDoctorChange() {
    if (this.form.doctor) {
      this.selectedDoctor = this.doctors.find(doc => doc.id == this.form.doctor);
      if (this.selectedDoctor) {
        console.log('Selected doctor:', this.selectedDoctor);
        
        if (this.selectedDoctor.doctor_type === 'permanent') {
          // For permanent doctors, set current date and clear time (not needed)
          this.form.date = this.getCurrentDate();
          this.form.time = ''; // Clear time for permanent doctors
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
    this.form.time = '';
  }

  loadCurrentTimeSlots() {
    // This method is no longer needed for permanent doctors
    // Time will be automatically set in the backend
  }

  loadAvailableDates() {
    if (!this.selectedDoctor || this.selectedDoctor.doctor_type !== 'visiting') return;
    
    this.loadingDates = true;
    this.availableDates = [];
    
    this.appointmentService.getAvailableDates(this.selectedDoctor.id).subscribe({
      next: (response) => {
        if (response.doctor_type === 'visiting') {
          this.availableDates = response.available_dates;
        }
        this.loadingDates = false;
      },
      error: (error) => {
        console.error('Error loading available dates:', error);
        this.loadingDates = false;
      }
    });
  }

  onDateChange() {
    if (!this.selectedDoctor || !this.form.date) return;
    
    if (this.selectedDoctor.doctor_type === 'visiting') {
      this.loadAvailableTimeSlots();
    }
  }

  loadAvailableTimeSlots() {
    if (!this.selectedDoctor || this.selectedDoctor.doctor_type !== 'visiting' || !this.form.date) return;
    
    this.loadingSlots = true;
    this.timeSlots = [];
    
    this.appointmentService.getAvailableSlots(this.selectedDoctor.id, this.form.date).subscribe({
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
    });
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

  ngOnDestroy() {
    if (this.userSub) this.userSub.unsubscribe();
  }

  book() {
    this.loading = true;
    
    if (this.selectedDoctor?.doctor_type === 'permanent') {
      // For permanent doctors, join queue with reason
      this.appointmentService.joinQueue(this.form.doctor, this.form.reason).subscribe({
        next: (response: any) => {
          this.loading = false;
          const timeInfo = response.joined_at_full ? ` (Joined at ${response.joined_at_full})` : '';
          alert(`Successfully joined queue! Position: ${response.queue_position}, Estimated wait: ${response.estimated_wait_time} minutes${timeInfo}`);
          this.router.navigate(['/patient-dashboard']);
        },
        error: (error) => {
          this.loading = false;
          alert(error.error?.error || 'Failed to join queue. Please try again.');
          console.error('Queue join error:', error);
        }
      });
    } else {
      // For visiting doctors, create scheduled appointment
      this.appointmentService.createAppointment(this.form).subscribe({
        next: () => {
          this.loading = false;
          alert('Appointment booked successfully!');
          this.router.navigate(['/patient-dashboard']);
        },
        error: (error) => {
          this.loading = false;
          alert('Booking failed. Please try again.');
          console.error('Booking error:', error);
        }
      });
    }
  }
}