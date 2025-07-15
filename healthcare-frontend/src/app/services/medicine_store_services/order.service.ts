import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private baseUrl = environment.apiBaseUrl + 'order-management/';

  constructor(private http: HttpClient) {}

  getMyOrders() {
    return this.http.get<any[]>(this.baseUrl + 'my-orders/');
  }

  checkout() {
    return this.http.post(this.baseUrl + 'create/', {});
  }

  // Admin
  getAllOrders() {
    return this.http.get<any>(this.baseUrl + 'admin-orders/');
  }

  updateOrderStatus(orderId: number, status: string) {
    return this.http.patch(this.baseUrl + `orders/${orderId}/status/`, { status });
  }

  cancelOrder(orderId: number, reason: string) {
    return this.http.patch(this.baseUrl + `orders/${orderId}/status/`, {
      status: 'cancelled',
      cancel_reason: reason
    });
  }
}