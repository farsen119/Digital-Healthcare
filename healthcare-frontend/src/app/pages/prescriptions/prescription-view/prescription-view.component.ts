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
    // Get the appointment ID from the URL
    const id = this.route.snapshot.paramMap.get('appointmentId');
    if (id) {
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

  // This function will trigger the browser's print dialog
  printPrescription(): void {
    window.print();
  }
}