import { Component, OnInit } from '@angular/core';
import { AppointmentService } from '../../services/appointment.service';
import { AppointmentResponse } from '../../models/appointment.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-appointments.component.html'
})
export class DoctorAppointmentsComponent implements OnInit {
  appointments: AppointmentResponse[] = [];
  loading = false;
  error: string | null = null;

  constructor(private appointmentService: AppointmentService) {}

  // ADD THIS GETTER
  get hasPendingAppointments(): boolean {
    return this.appointments.some(a => a.status === 'pending');
  }

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

  accept(id: number) {
    this.appointmentService.updateAppointmentStatus(id, 'accepted').subscribe({
      next: () => this.load(),
      error: () => this.error = 'Failed to update appointment'
    });
  }

  reject(id: number) {
    this.appointmentService.updateAppointmentStatus(id, 'rejected').subscribe({
      next: () => this.load(),
      error: () => this.error = 'Failed to update appointment'
    });
  }
}