import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PrescriptionService } from '../../../services/prescription.service';
import { Prescription } from '../../../models/prescription.model';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-admin-prescription-list',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminSidebarComponent],
  templateUrl: './admin-prescription-list.component.html',
})
export class AdminPrescriptionListComponent implements OnInit {
  prescriptions: Prescription[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private prescriptionService: PrescriptionService) {}

  ngOnInit(): void {
    this.prescriptionService.getAllPrescriptions().subscribe({
      next: (data) => {
        this.prescriptions = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load prescriptions.';
        this.isLoading = false;
      }
    });
  }
}