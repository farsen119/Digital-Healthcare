import { Component, OnInit } from '@angular/core';
import { AppointmentService } from '../../services/appointment.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Use RouterModule
import { AppointmentResponse } from '../../models/appointment.model'; // <-- IMPORT THE MODEL
import { SideNavbarComponent } from '../patient-dashboard/side-navbar/side-navbar.component';

@Component({
  selector: 'app-patient-appointments',
  standalone: true,
  imports: [CommonModule, RouterModule, SideNavbarComponent], // Use RouterModule
  templateUrl: './patient-appointments.component.html',
  styleUrl: './patient-appointments.component.css'

})
export class PatientAppointmentsComponent implements OnInit {
  // Use the strong type here instead of any[]
  appointments: AppointmentResponse[] = [];

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    // The getAppointments() method should correctly filter by user role on the backend
    this.appointmentService.getAppointments().subscribe(a => this.appointments = a);
  }
}