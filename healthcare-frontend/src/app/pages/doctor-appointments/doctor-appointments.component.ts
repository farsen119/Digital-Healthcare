import { Component, OnInit } from '@angular/core';
import { AppointmentService } from '../../services/appointment.service';
import { AppointmentResponse } from '../../models/appointment.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Use RouterModule instead of RouterLink
import { SideNavbarComponent } from '../doctor-dashboard/side-navbar/side-navbar.component';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [CommonModule, RouterModule, SideNavbarComponent], // Use RouterModule
  templateUrl: './doctor-appointments.component.html',
  styleUrls: ['./doctor-appointments.component.css']
})
export class DoctorAppointmentsComponent implements OnInit {
  appointments: AppointmentResponse[] = [];
  loading = false;
  error: string | null = null;

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;
    this.appointmentService.getAppointments().subscribe({
      next: (a) => {
        this.appointments = a;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load appointments';
        this.loading = false;
      }
    });
  }

  // --- THIS IS THE CORRECTED METHOD ---
  accept(id: number) {
    this.appointmentService.updateAppointmentStatus(id, 'accepted').subscribe({
      next: (updatedAppointment) => {
        // Find the appointment in our local array
        const index = this.appointments.findIndex(a => a.id === id);
        if (index !== -1) {
          // Replace the old item with the new one from the server
          this.appointments[index] = updatedAppointment;
        }
      },
      error: () => this.error = 'Failed to update appointment'
    });
  }

  // --- THIS IS THE CORRECTED METHOD ---
  reject(id: number) {
    this.appointmentService.updateAppointmentStatus(id, 'rejected').subscribe({
      next: (updatedAppointment) => {
        const index = this.appointments.findIndex(a => a.id === id);
        if (index !== -1) {
          this.appointments[index] = updatedAppointment;
        }
      },
      error: () => this.error = 'Failed to update appointment'
    });
  }
}