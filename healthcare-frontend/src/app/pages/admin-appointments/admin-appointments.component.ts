import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { AppointmentService } from '../../services/appointment.service';
import { 
  Appointment, 
  AppointmentResponse,
  AppointmentStatus, 
  AppointmentUpdateDTO 
} from '../../models/appointment.model';

interface StatusOption {
  value: AppointmentStatus;
  label: string;
  class: string;
}

@Component({
  selector: 'app-admin-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminSidebarComponent],
  templateUrl: './admin-appointments.component.html',
  styleUrls: ['./admin-appointments.component.css']
})
export class AdminAppointmentsComponent implements OnInit {
  appointments: AppointmentResponse[] = [];
  editId: number | null = null;
  editForm: AppointmentUpdateDTO = {};
  
  statusOptions: StatusOption[] = [
    { value: 'pending', label: 'Pending', class: 'bg-warning' },
    { value: 'accepted', label: 'Accepted', class: 'bg-success' },
    { value: 'rejected', label: 'Rejected', class: 'bg-danger' },
    { value: 'completed', label: 'Completed', class: 'bg-info' }
  ];

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.appointmentService.getAppointments().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        alert('Failed to load appointments. Please try again.');
      }
    });
  }

  startEdit(appointment: Appointment) {
    this.editId = appointment.id;
    this.editForm = {
      date: appointment.date,
      time: appointment.time,
      reason: appointment.reason,
      status: appointment.status
    };
  }

  cancelEdit() {
    this.editId = null;
    this.editForm = {};
  }

  saveEdit() {
    if (this.editId !== null) {
      this.appointmentService.updateAppointment(this.editId, this.editForm).subscribe({
        next: (updatedAppointment) => {
          this.updateLocalAppointment(updatedAppointment);
          this.cancelEdit();
        },
        error: (error) => {
          console.error('Error updating appointment:', error);
          alert('Failed to update appointment. Please try again.');
        }
      });
    }
  }

  updateStatus(appointment: Appointment, newStatus: AppointmentStatus) {
    this.appointmentService.updateAppointmentStatus(appointment.id, newStatus).subscribe({
      next: (updatedAppointment) => {
        this.updateLocalAppointment(updatedAppointment);
      },
      error: (error) => {
        console.error('Error updating appointment status:', error);
        alert('Failed to update status. Please check the backend API and browser console.');
      }
    });
  }

  deleteAppointment(id: number) {
    if (confirm('Are you sure you want to delete this appointment?')) {
      this.appointmentService.deleteAppointment(id).subscribe({
        next: () => {
          this.appointments = this.appointments.filter(a => a.id !== id);
        },
        error: (error) => {
          console.error('Error deleting appointment:', error);
          alert('Failed to delete appointment. Please try again.');
        }
      });
    }
  }
  
  private updateLocalAppointment(updatedAppointment: AppointmentResponse) {
    const index = this.appointments.findIndex(a => a.id === updatedAppointment.id);
    if (index !== -1) {
      this.appointments[index] = updatedAppointment;
    }
  }

  getStatusClass(status: AppointmentStatus): string {
    const statusOption = this.statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.class : '';
  }
}
