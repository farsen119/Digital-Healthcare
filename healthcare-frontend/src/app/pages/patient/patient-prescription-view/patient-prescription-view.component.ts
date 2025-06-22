import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../../services/appointment.service';
import { AppointmentResponse } from '../../../models/appointment.model';

@Component({
  selector: 'app-patient-prescription-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-prescription-view.component.html',
  // We can reuse the same CSS file from the doctor's view for a consistent look
  styleUrls: ['../../prescriptions/prescription-view/prescription-view.component.css']
})
export class PatientPrescriptionViewComponent implements OnInit {
  appointment: AppointmentResponse | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('appointmentId');
    if (id) {
      this.appointmentService.getAppointment(+id).subscribe({
        next: (data) => {
          if (!data.prescription) {
            this.error = 'No prescription found for this appointment.';
          }
          this.appointment = data;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load prescription details.';
          this.isLoading = false;
        }
      });
    } else {
      this.error = 'No Appointment ID provided in the URL.';
      this.isLoading = false;
    }
  }

  printPrescription(): void {
    window.print();
  }
}