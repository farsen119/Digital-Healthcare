import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../services/medicine_store_services/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders.component.html',
})
export class OrdersComponent {
  orders: any[] = [];

  constructor(private orderService: OrderService) {
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.getMyOrders().subscribe((data: any) => this.orders = data);
  }
}