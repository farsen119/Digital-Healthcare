import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PrescriptionService, PrescriptionUpdateDTO } from '../../../services/prescription.service';
import { AppointmentService } from '../../../services/appointment.service';
import { AppointmentResponse } from '../../../models/appointment.model';

@Component({
  selector: 'app-prescription-write',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './prescription-write.component.html'
})
export class PrescriptionWriteComponent implements OnInit {
  prescriptionForm: FormGroup;
  appointment: AppointmentResponse | null = null;
  isLoading = true;
  error: string | null = null;
  appointmentId!: number;

  // Properties to manage edit mode
  isEditMode = false;
  private existingPrescriptionId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private prescriptionService: PrescriptionService,
    private appointmentService: AppointmentService
  ) {
    this.prescriptionForm = this.fb.group({
      details: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('appointmentId');
    if (id) {
      this.appointmentId = +id;
      this.appointmentService.getAppointment(this.appointmentId).subscribe({
        next: (data) => {
          this.appointment = data;
          // If the appointment already has a prescription, we are in edit mode.
          if (data.prescription) {
            this.isEditMode = true;
            this.existingPrescriptionId = data.prescription.id;
            // Pre-fill the form with the existing prescription details
            this.prescriptionForm.patchValue({
              details: data.prescription.details
            });
          }
          this.isLoading = false;
        },
        error: () => {
          this.error = 'Failed to load appointment details.';
          this.isLoading = false;
        }
      });
    } else {
      this.error = 'No Appointment ID found in URL.'
      this.isLoading = false;
    }
  }

  saveOrUpdatePrescription(): void {
    if (this.prescriptionForm.invalid) {
      return;
    }
    this.isLoading = true;
    this.error = null;

    if (this.isEditMode && this.existingPrescriptionId) {
      // In EDIT MODE: call the update service
      const updateData: PrescriptionUpdateDTO = {
        details: this.prescriptionForm.value.details
      };
      this.prescriptionService.updatePrescription(this.existingPrescriptionId, updateData).subscribe({
        // On success, navigate to the view page for this appointment
        next: () => this.router.navigate(['/prescriptions/view', this.appointmentId]),
        error: (err) => {
          this.error = 'Failed to update prescription.';
          this.isLoading = false;
          console.error(err);
        }
      });
    } else {
      // In CREATE MODE: call the create service
      const createData = {
        appointment: this.appointmentId,
        details: this.prescriptionForm.value.details
      };
      this.prescriptionService.createPrescription(createData).subscribe({
        // On success, navigate to the view page for this appointment
        next: () => this.router.navigate(['/prescriptions/view', this.appointmentId]),
        error: (err) => {
          this.error = err.error?.details || 'Failed to save prescription.';
          this.isLoading = false;
          console.error(err);
        }
      });
    }
  }
}