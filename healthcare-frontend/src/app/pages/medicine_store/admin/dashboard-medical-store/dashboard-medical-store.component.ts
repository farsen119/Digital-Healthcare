import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AdminSidebarComponent } from '../../../../components/admin-sidebar/admin-sidebar.component';
import { AdminMedicalStoreNavBarComponent } from '../admin-medical-store-nav-bar/admin-medical-store-nav-bar.component';
import { MedicineService } from '../../../../services/medicine_store_services/medicine.service';
import { OrderService } from '../../../../services/medicine_store_services/order.service';
import { StockHistoryService } from '../../../../services/medicine_store_services/stock-history.service.service';

@Component({
  selector: 'app-dashboard-medical-store',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    AdminSidebarComponent,
    AdminMedicalStoreNavBarComponent
  ],
  templateUrl: './dashboard-medical-store.component.html',
  styleUrls: ['./dashboard-medical-store.component.css']
})
export class DashboardMedicalStoreComponent implements OnInit {
  totalOrders = 0;
  totalRevenue = 0;
  pendingOrders = 0;
  recentOrders: any[] = [];
  lowStockMedicines: any[] = [];
  stockHistory: any[] = [];

  constructor(
    private medicineService: MedicineService,
    private orderService: OrderService,
    private stockHistoryService: StockHistoryService
  ) {}

  ngOnInit() {
    this.orderService.getAllOrders().subscribe((data: any) => {
      this.totalOrders = data.orders.length;
      this.totalRevenue = data.total_revenue;
      this.pendingOrders = data.orders.filter((o: any) => o.status === 'pending').length;
      this.recentOrders = data.orders.slice(0, 5);
    });

    this.medicineService.getMedicines().subscribe((meds: any[]) => {
      this.lowStockMedicines = meds.filter(m => m.stock < 10); // or use m.is_low_stock if available
    });

    this.stockHistoryService.getStockHistory().subscribe((history: any[]) => {
      this.stockHistory = history;
    });
  }
}