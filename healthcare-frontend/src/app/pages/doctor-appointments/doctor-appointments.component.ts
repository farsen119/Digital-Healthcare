import { Component, OnInit } from '@angular/core';
import { AppointmentService } from '../../services/appointment.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-appointments.component.html'
})
export class DoctorAppointmentsComponent implements OnInit {
  appointments: any[] = [];
  constructor(private appointmentService: AppointmentService) {}
  ngOnInit() {
    this.load();
  }
  load() {
    this.appointmentService.getAppointments().subscribe(a => this.appointments = a);
  }
  accept(id: number) {
    this.appointmentService.updateAppointment(id, { status: 'accepted' }).subscribe(() => this.load());
  }
  reject(id: number) {
    this.appointmentService.updateAppointment(id, { status: 'rejected' }).subscribe(() => this.load());
  }
}