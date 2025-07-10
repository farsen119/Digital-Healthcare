import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MedicineService } from '../../../services/medicine_store_services/medicine.service';
import { CartService } from '../../../services/medicine_store_services/cart.service';

@Component({
  selector: 'app-medicine-store',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './medicine-store.component.html',
})
export class MedicineStoreComponent implements OnInit {
  medicines: any[] = [];
  searchQuery = '';
  message = '';
  cartCount = 0;

  constructor(private medicineService: MedicineService, private cartService: CartService) {}

  ngOnInit() {
    this.loadMedicines();
    this.loadCartCount();
  }

  loadMedicines() {
    this.medicineService.getMedicines().subscribe(data => this.medicines = data);
  }

  search() {
    if (this.searchQuery.trim()) {
      this.medicineService.searchMedicines(this.searchQuery).subscribe(data => this.medicines = data);
    } else {
      this.loadMedicines();
    }
  }

  addToCart(medicineId: number) {
    this.cartService.addToCart(medicineId, 1).subscribe({
      next: () => {
        this.message = 'Added to cart!';
        this.loadCartCount();
      },
      error: err => this.message = err.error?.error || 'Error adding to cart'
    });
  }

  loadCartCount() {
    this.cartService.getCart().subscribe(cart => {
      this.cartCount = cart.items ? cart.items.length : 0;
    });
  }
}