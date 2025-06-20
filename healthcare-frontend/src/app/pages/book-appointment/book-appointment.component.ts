import { Component, OnInit, OnDestroy } from '@angular/core';
import { AppointmentService } from '../../services/appointment.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
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
    reason: '',
    patient_name: '',
    patient_email: ''
  };
  doctors: any[] = [];
  userSub: Subscription | undefined;

  constructor(
    private appointmentService: AppointmentService,
    private userService: UserService,
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userService.getDoctors().subscribe(doctors => this.doctors = doctors);
    // Subscribe to user changes for real-time updates
    this.userSub = this.auth.currentUser$.subscribe(user => {
      if (user && this.auth.getRole() === 'patient') {
        this.form.patient_name = user.name;
        this.form.patient_email = user.email;
      }
    });
    // If already logged in as patient, pre-fill
    const user = this.auth.currentUserSubject.value;
    if (user && this.auth.getRole() === 'patient') {
      this.form.patient_name = user.first_name;
      this.form.patient_email = user.email;
    }
  }

  ngOnDestroy() {
    if (this.userSub) this.userSub.unsubscribe();
  }

  book() {
    // If logged in as patient, ensure name/email are set from auth
    const user = this.auth.currentUserSubject.value;
    if (user && this.auth.getRole() === 'patient') {
      this.form.patient_name = user.name;
      this.form.patient_email = user.email;
    }
    this.appointmentService.createAppointment(this.form).subscribe({
      next: () => {
        alert('Appointment booked!');
        this.router.navigate(['/']);
      },
      error: () => alert('Booking failed.')
    });
  }
}