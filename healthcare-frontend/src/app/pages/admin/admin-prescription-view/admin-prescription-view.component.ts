import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../../services/appointment.service';
import { PrescriptionService, AdminNotesUpdateDTO } from '../../../services/prescription.service';
import { AppointmentResponse } from '../../../models/appointment.model';

@Component({
  selector: 'app-admin-prescription-view',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './admin-prescription-view.component.html',
  styleUrls: ['../../prescriptions/prescription-view/prescription-view.component.css'] // Reuse styles
})
export class AdminPrescriptionViewComponent implements OnInit {
  appointment: AppointmentResponse | null = null;
  isLoading = true;
  error: string | null = null;
  notesForm: FormGroup;
  notesSuccess: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private appointmentService: AppointmentService,
    private prescriptionService: PrescriptionService,
    private fb: FormBuilder
  ) {
    this.notesForm = this.fb.group({
      admin_notes: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('appointmentId');
    if (id) {
      this.loadAppointmentDetails(+id);
    } else {
      this.error = "No Appointment ID was provided.";
      this.isLoading = false;
    }
  }

  loadAppointmentDetails(id: number): void {
    this.isLoading = true;
    this.appointmentService.getAppointment(id).subscribe({
      next: (data) => {
        if (!data.prescription) {
          this.error = 'No prescription found for this appointment.';
        }
        this.appointment = data;
        // Pre-fill the form with existing admin notes
        this.notesForm.patchValue({
          admin_notes: data.prescription?.admin_notes || ''
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load appointment details.';
        this.isLoading = false;
      }
    });
  }

  saveAdminNotes(): void {
    if (!this.appointment?.prescription) {
      this.error = "Cannot save notes, no prescription loaded.";
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.notesSuccess = null;

    const notesData: AdminNotesUpdateDTO = this.notesForm.value;
    const prescriptionId = this.appointment.prescription.id;

    this.prescriptionService.updateAdminNotes(prescriptionId, notesData).subscribe({
      next: (updatedPrescription) => {
        if (this.appointment && this.appointment.prescription) {
            // Update the local data to reflect the change instantly
            this.appointment.prescription = updatedPrescription;
        }
        this.notesSuccess = 'Administrative notes saved successfully!';
        this.isLoading = false;
        // Optional: clear success message after a few seconds
        setTimeout(() => this.notesSuccess = null, 3000);
      },
      error: (err) => {
        this.error = 'Failed to save notes. Please try again.';
        this.isLoading = false;
      }
    });
  }
}