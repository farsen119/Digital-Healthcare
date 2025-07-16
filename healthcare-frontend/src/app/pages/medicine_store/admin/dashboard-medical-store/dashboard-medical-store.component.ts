import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminSidebarComponent } from '../../../../components/admin-sidebar/admin-sidebar.component';
import { AdminMedicalStoreNavBarComponent } from '../admin-medical-store-nav-bar/admin-medical-store-nav-bar.component';
import { OrderService } from '../../../../services/medicine_store_services/order.service';

@Component({
  selector: 'app-dashboard-medical-store',
  standalone: true,
  imports: [CommonModule, AdminSidebarComponent, AdminMedicalStoreNavBarComponent],
  templateUrl: './dashboard-medical-store.component.html',
  styleUrls: ['./dashboard-medical-store.component.scss']
})
export class DashboardMedicalStoreComponent implements OnInit {
  totalOrders = 0;
  totalRevenue = 0;
  pendingOrders = 0;
  recentOrders: any[] = [];

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.orderService.getAllOrders().subscribe((data: any) => {
      this.totalOrders = data.orders.length;
      this.totalRevenue = data.total_revenue;
      this.pendingOrders = data.orders.filter((o: any) => o.status === 'pending').length;
      this.recentOrders = data.orders.slice(0, 5);
    });
  }
}