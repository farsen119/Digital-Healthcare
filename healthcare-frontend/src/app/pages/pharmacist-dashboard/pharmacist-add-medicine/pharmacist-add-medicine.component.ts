import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedicineService } from '../../../services/medicine_store_services/medicine.service';
import { PharmacistSideNavbarComponent } from '../side-navbar/side-navbar.component';

@Component({
  selector: 'app-pharmacist-add-medicine',
  standalone: true,
  imports: [CommonModule, FormsModule, PharmacistSideNavbarComponent],
  templateUrl: './pharmacist-add-medicine.component.html',
  styleUrls: ['./pharmacist-add-medicine.component.css']
})
export class PharmacistAddMedicineComponent implements OnInit {
  medicines: any[] = [];
  newMedicine: any = { name: '', description: '', price: '', stock: '', image: null };
  editMedicine: any = null;
  message = '';

  constructor(private medicineService: MedicineService) {}

  ngOnInit() {
    this.loadMedicines();
  }

  loadMedicines() {
    this.medicineService.getMedicines().subscribe({
      next: (data: any) => {
        this.medicines = data;
      },
      error: (error: any) => {
        this.message = 'Error loading medicines: ' + (error.error?.detail || error.message || 'Unknown error');
      }
    });
  }

  addMedicine() {
    const formData = new FormData();
    formData.append('name', this.newMedicine.name);
    formData.append('description', this.newMedicine.description);
    formData.append('price', this.newMedicine.price);
    formData.append('stock', this.newMedicine.stock);
    if (this.newMedicine.image) {
      formData.append('image', this.newMedicine.image);
    }
    
    this.medicineService.addMedicine(formData).subscribe({
      next: (response: any) => {
        this.message = 'Medicine added!';
        this.newMedicine = { name: '', description: '', price: '', stock: '', image: null };
        this.loadMedicines();
      },
      error: (error: any) => {
        this.message = 'Error adding medicine: ' + (error.error?.detail || error.error?.error || error.message || 'Unknown error');
      }
    });
  }

  startEdit(med: any) {
    this.editMedicine = { ...med };
  }

  updateMedicine() {
    const formData = new FormData();
    formData.append('name', this.editMedicine.name);
    formData.append('description', this.editMedicine.description);
    formData.append('price', this.editMedicine.price);
    formData.append('stock', this.editMedicine.stock);
    if (this.editMedicine.image && typeof this.editMedicine.image !== 'string') {
      formData.append('image', this.editMedicine.image);
    }
    
    this.medicineService.updateMedicine(this.editMedicine.id, formData).subscribe({
      next: (response: any) => {
        this.message = 'Medicine updated!';
        this.editMedicine = null;
        this.loadMedicines();
      },
      error: (error: any) => {
        this.message = 'Error updating medicine: ' + (error.error?.detail || error.error?.error || error.message || 'Unknown error');
      }
    });
  }

  deleteMedicine(id: number) {
    if (confirm('Are you sure you want to delete this medicine?')) {
      this.medicineService.deleteMedicine(id).subscribe({
        next: (response: any) => {
          this.message = 'Medicine deleted!';
          this.loadMedicines();
        },
        error: (error: any) => {
          this.message = 'Error deleting medicine: ' + (error.error?.detail || error.error?.error || error.message || 'Unknown error');
        }
      });
    }
  }

  handleFileInput(event: any, isEdit = false) {
    const file = event.target.files[0];
    if (isEdit) {
      this.editMedicine.image = file;
    } else {
      this.newMedicine.image = file;
    }
  }
}
