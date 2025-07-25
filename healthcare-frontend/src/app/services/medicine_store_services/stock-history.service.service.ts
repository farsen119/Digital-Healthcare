import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StockHistoryService {
  private apiUrl = environment.apiBaseUrl + 'stock-history/';

  constructor(private http: HttpClient) {}

  getStockHistory(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}