import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CartService {
  private apiUrl = environment.apiBaseUrl + 'cart/';

  constructor(private http: HttpClient) {}

  getCart(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  addToCart(medicineId: number, quantity: number): Observable<any> {
    return this.http.post(this.apiUrl, { medicine_id: medicineId, quantity });
  }

  removeFromCart(medicineId: number): Observable<any> {
    return this.http.request('delete', this.apiUrl, { body: { medicine_id: medicineId } });
  }

  updateCartItem(medicineId: number, quantity: number): Observable<any> {
    return this.http.post(this.apiUrl, { medicine_id: medicineId, quantity });
  }
}