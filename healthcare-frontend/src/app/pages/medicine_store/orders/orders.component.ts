import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../services/medicine_store_services/order.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './orders.component.html',
})
export class OrdersComponent {
  orders: any[] = [];
  cancelReasons = [
    'Ordered by mistake',
    'Found a better price elsewhere',
    'No longer needed',
    'Other'
  ];
  message = '';

  constructor(private orderService: OrderService) {
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.getMyOrders().subscribe((data: any) => this.orders = data);
  }

  showCancel(order: any) {
    order.showCancel = true;
    order.cancelReason = '';
  }

  hideCancel(order: any) {
    order.showCancel = false;
    order.cancelReason = '';
  }

  confirmCancelOrder(order: any) {
    if (!order.cancelReason) {
      this.message = 'Please select a reason for cancellation.';
      setTimeout(() => this.message = '', 2000);
      return;
    }
    this.orderService.cancelOrder(order.id, order.cancelReason).subscribe({
      next: (updatedOrder: any) => {
        order.status = updatedOrder.status;
        order.cancel_reason = updatedOrder.cancel_reason; // <-- update local order
        order.showCancel = false;
        this.message = 'Order cancelled successfully.';
        setTimeout(() => this.message = '', 2000);
      },
      error: () => {
        this.message = 'Failed to cancel order.';
        setTimeout(() => this.message = '', 2000);
      }
    });
  }
}