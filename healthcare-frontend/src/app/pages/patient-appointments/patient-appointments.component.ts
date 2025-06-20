import { Component, OnInit } from '@angular/core';
import { AppointmentService } from '../../services/appointment.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-patient-appointments',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './patient-appointments.component.html'
})
export class PatientAppointmentsComponent implements OnInit {
  appointments: any[] = [];

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.appointmentService.getAppointments().subscribe(a => this.appointments = a);
  }
}