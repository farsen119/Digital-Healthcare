import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../../services/medicine_store_services/order.service';
import { RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '../../../../components/admin-sidebar/admin-sidebar.component';
import { AdminMedicalStoreNavBarComponent } from '../admin-medical-store-nav-bar/admin-medical-store-nav-bar.component';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminSidebarComponent, AdminMedicalStoreNavBarComponent],
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.scss']
})
export class AdminOrdersComponent implements OnInit {
  orders: any[] = [];
  totalRevenue = 0;
  statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  message = '';

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.getAllOrders().subscribe((data: any) => {
      this.orders = data.orders;
      this.totalRevenue = data.total_revenue;
    });
  }

  changeStatus(order: any, newStatus: string) {
    this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: (updatedOrder: any) => {
        order.status = updatedOrder.status;
        this.message = `Order #${order.id} status updated to ${updatedOrder.status}`;
      },
      error: () => {
        this.message = 'Failed to update order status';
      }
    });
  }
}