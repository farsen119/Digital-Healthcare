import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private orderUrl = 'http://localhost:8000/api/orders/';
  private myOrdersUrl = 'http://localhost:8000/api/my-orders/';

  constructor(private http: HttpClient) {}

  checkout(): Observable<any> {
    return this.http.post(this.orderUrl, {});
  }

  getMyOrders(): Observable<any> {
    return this.http.get(this.myOrdersUrl);
  }
}