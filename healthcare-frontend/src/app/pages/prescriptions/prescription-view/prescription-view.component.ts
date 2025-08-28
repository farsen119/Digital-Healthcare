import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../../services/appointment.service';
import { AppointmentResponse } from '../../../models/appointment.model';

@Component({
  selector: 'app-prescription-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './prescription-view.component.html',
  styleUrls: ['./prescription-view.component.css']
})
export class PrescriptionViewComponent implements OnInit {
  appointment: AppointmentResponse | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {
    this.loadPrescriptionData();
  }

  private loadPrescriptionData(): void {
    // Get the appointment ID from the URL
    const id = this.route.snapshot.paramMap.get('appointmentId');
    if (id) {
      this.isLoading = true;
      this.error = null;
      
      // Use the existing AppointmentService to get the details
      this.appointmentService.getAppointment(+id).subscribe({
        next: (data) => {
          // Check if a prescription actually exists on the appointment
          if (!data.prescription) {
            this.error = 'No prescription found for this appointment.';
          }
          this.appointment = data;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load prescription details.';
          this.isLoading = false;
          console.error(err);
        }
      });
    } else {
      this.error = 'No Appointment ID provided in the URL.';
      this.isLoading = false;
    }
  }

  // Method to refresh prescription data
  refreshPrescription(): void {
    this.loadPrescriptionData();
  }

  // This function will trigger the browser's print dialog
  printPrescription(): void {
    window.print();
  }

  // Complete consultation method
  completeConsultation(): void {
    if (confirm('Are you sure you want to complete this consultation? This will mark the appointment as completed.')) {
      this.appointmentService.completeConsultation(this.appointment?.id).subscribe({
        next: (response) => {
          // Set flag to refresh appointment lists
          sessionStorage.setItem('refreshAppointments', 'true');
          // Show success message and return to dashboard
          alert('Consultation completed successfully! Returning to dashboard...');
          // Navigate back to doctor dashboard
          window.location.href = '/doctor-dashboard';
        },
        error: (err) => {
          console.error('Error completing consultation:', err);
          alert('Failed to complete consultation. Please try again.');
        }
      });
    }
  }
}