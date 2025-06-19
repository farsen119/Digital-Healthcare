import { Component, OnInit } from '@angular/core';
import { AppointmentService } from '../../services/appointment.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-appointment.component.html'
})
export class BookAppointmentComponent implements OnInit {
  form: any = {
    doctor: '',
    date: '',
    time: '',
    reason: '',
    patient_name: '',
    patient_email: ''
  };
  doctors: any[] = [];

  constructor(
    private appointmentService: AppointmentService,
    private userService: UserService,
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userService.getDoctors().subscribe(doctors => this.doctors = doctors);
  }

  book() {
    this.appointmentService.createAppointment(this.form).subscribe({
      next: () => {
        alert('Appointment booked!');
        this.router.navigate(['/']);
      },
      error: () => alert('Booking failed.')
    });
  }
}