import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { AppointmentService } from '../../services/appointment.service';

@Component({
  selector: 'app-admin-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  templateUrl: './admin-appointments.component.html',
  styleUrl: './admin-appointments.component.css'
})
export class AdminAppointmentsComponent implements OnInit {
  appointments: any[] = [];
  editId: number | null = null;
  editForm: any = {};

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.appointmentService.getAppointments().subscribe(a => this.appointments = a);
  }

  startEdit(appt: any) {
    this.editId = appt.id;
    this.editForm = { ...appt };
  }

  cancelEdit() {
    this.editId = null;
    this.editForm = {};
  }

  saveEdit() {
    if (this.editId !== null) {
      this.appointmentService.updateAppointment(this.editId, this.editForm).subscribe(() => {
        this.editId = null;
        this.editForm = {};
        this.load();
      });
    }
  }

  deleteAppointment(id: number) {
    if (confirm('Are you sure you want to delete this appointment?')) {
      this.appointmentService.deleteAppointment(id).subscribe(() => this.load());
    }
  }
}