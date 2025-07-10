import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedicineService } from '../../../../services/medicine_store_services/medicine.service';

@Component({
  selector: 'app-medicine-store-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medicine-store-settings.component.html',
})
export class MedicineStoreSettingsComponent implements OnInit {
  medicines: any[] = [];
  newMedicine: any = { name: '', description: '', price: '', stock: '', image: null };
  editMedicine: any = null;
  message = '';

  constructor(private medicineService: MedicineService) {}

  ngOnInit() {
    this.loadMedicines();
  }

  loadMedicines() {
    this.medicineService.getMedicines().subscribe((data: any) => this.medicines = data);
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
      next: () => {
        this.message = 'Medicine added!';
        this.newMedicine = { name: '', description: '', price: '', stock: '', image: null };
        this.loadMedicines();
      },
      error: (err: any) => this.message = err.error?.error || 'Error adding medicine'
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
      next: () => {
        this.message = 'Medicine updated!';
        this.editMedicine = null;
        this.loadMedicines();
      },
      error: (err: any) => this.message = err.error?.error || 'Error updating medicine'
    });
  }

  deleteMedicine(id: number) {
    if (confirm('Are you sure you want to delete this medicine?')) {
      this.medicineService.deleteMedicine(id).subscribe({
        next: () => {
          this.message = 'Medicine deleted!';
          this.loadMedicines();
        },
        error: (err: any) => this.message = err.error?.error || 'Error deleting medicine'
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