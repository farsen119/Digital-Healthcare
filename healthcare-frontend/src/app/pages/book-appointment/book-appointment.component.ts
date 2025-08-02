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
    reason: ''
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
  }

  ngOnDestroy() {
    if (this.userSub) this.userSub.unsubscribe();
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