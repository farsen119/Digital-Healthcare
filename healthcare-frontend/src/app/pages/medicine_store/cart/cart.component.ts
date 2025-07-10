import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../services/medicine_store_services/cart.service';
import { OrderService } from '../../../services/medicine_store_services/order.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
})
export class CartComponent {
  cart: any = { items: [] };
  message = '';

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {
    this.loadCart();
  }

  loadCart() {
    this.cartService.getCart().subscribe((data: any) => this.cart = data);
  }

  removeItem(medicineId: number) {
    this.cartService.removeFromCart(medicineId).subscribe(() => this.loadCart());
  }

  changeQuantity(medicineId: number, quantity: string) {
    const qty = parseInt(quantity, 10);
    if (qty > 0) {
      this.cartService.updateCartItem(medicineId, qty).subscribe(() => this.loadCart());
    }
  }

  checkout() {
    this.orderService.checkout().subscribe({
      next: () => {
        this.message = 'Order placed!';
        setTimeout(() => this.router.navigate(['/orders']), 1000);
      },
      error: (err: any) => this.message = err.error?.error || 'Checkout failed'
    });
  }
}