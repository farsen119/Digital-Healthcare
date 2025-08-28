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
        // On success, just return to dashboard (don't complete consultation)
        next: () => this.updatePrescriptionAndReturn(),
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
        // On success, go to view prescription page
        next: () => this.savePrescriptionAndView(),
        error: (err) => {
          this.error = err.error?.details || 'Failed to save prescription.';
          this.isLoading = false;
          console.error(err);
        }
      });
    }
  }

  private updatePrescriptionAndReturn(): void {
    // Just update prescription and return to dashboard (don't complete consultation)
    this.isLoading = false;
    // Set flag to indicate returning from prescription
    sessionStorage.setItem('returningFromPrescription', 'true');
    // Show success message and return to dashboard
    alert('Prescription updated successfully! The prescription view will now show the updated details.');
    this.router.navigate(['/doctor-dashboard']);
  }

  private savePrescriptionAndView(): void {
    // Just save prescription and go to view prescription page
    this.isLoading = false;
    // Show success message and go to view prescription page
    alert('Prescription saved successfully! Going to view prescription page...');
    this.router.navigate(['/prescriptions/view', this.appointmentId]);
  }

  private completeConsultationAndReturn(): void {
    // Complete the consultation and return to dashboard
    this.appointmentService.completeConsultation().subscribe({
      next: () => {
        this.isLoading = false;
        // Set flag to indicate returning from prescription
        sessionStorage.setItem('returningFromPrescription', 'true');
        // Set flag to refresh appointment lists
        sessionStorage.setItem('refreshAppointments', 'true');
        // Show success message and return to dashboard
        alert('Consultation completed successfully! Returning to dashboard...');
        this.router.navigate(['/doctor-dashboard']);
      },
      error: (err) => {
        this.error = 'Failed to complete consultation.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }
}