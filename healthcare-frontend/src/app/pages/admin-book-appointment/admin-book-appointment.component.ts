import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import { UserService } from '../../services/user.service';
import { AppointmentCreateDTO } from '../../models/appointment.model';
import { User } from '../../models/user.model';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-admin-book-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminSidebarComponent],
  templateUrl: './admin-book-appointment.component.html',
  styleUrls: ['./admin-book-appointment.component.css']
})
export class AdminBookAppointmentComponent implements OnInit {
  appointment: Partial<AppointmentCreateDTO> = {
    reason: '',
    status: 'pending'
  };
  
  doctors: User[] = [];
  patients: User[] = [];
  isGuest = false;

  constructor(
    private appointmentService: AppointmentService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userService.getDoctors().subscribe(data => this.doctors = data);
    this.userService.getPatients().subscribe(data => this.patients = data);
  }

  onIsGuestChange(): void {
    if (this.isGuest) {
      delete this.appointment.patient; // Use 'patient'
    } else {
      delete this.appointment.patient_name;
      delete this.appointment.patient_email;
    }
  }

  onSubmit(): void {
    // Use 'doctor' for the validation check
    if (!this.appointment.date || !this.appointment.time || !this.appointment.doctor) {
      alert('Please fill in all required fields: Date, Time, and Doctor.');
      return;
    }
    
    this.appointmentService.createAppointment(this.appointment as AppointmentCreateDTO).subscribe({
      next: () => {
        alert('Appointment created successfully!');
        this.router.navigate(['/admin-appointments']);
      },
      error: (err) => {
        console.error('Backend error details:', err.error);
        alert(`Failed to create appointment. Check console for backend error details.`);
      }
    });
  }
}
