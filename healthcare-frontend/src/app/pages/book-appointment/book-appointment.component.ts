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
  timeSlots: string[] = [];
  selectedDoctor: any = null;

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
        console.log('Consultation hours:', this.selectedDoctor.consultation_hours);
        this.timeSlots = this.timeSlotService.generateTimeSlots(this.selectedDoctor.consultation_hours);
        console.log('Generated time slots:', this.timeSlots);
      }
    } else {
      this.selectedDoctor = null;
      this.timeSlots = [];
    }
    // Reset time when doctor changes
    this.form.time = '';
  }

  ngOnDestroy() {
    if (this.userSub) this.userSub.unsubscribe();
  }

  book() {
    this.loading = true;
    
    if (this.selectedDoctor?.doctor_type === 'permanent') {
      // For permanent doctors, join queue
      this.appointmentService.joinQueue(this.form.doctor).subscribe({
        next: (response) => {
          this.loading = false;
          alert(`Successfully joined queue! Position: ${response.queue_position}, Estimated wait: ${response.estimated_wait_time} minutes`);
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