import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MedicineService {
  private apiUrl = 'http://localhost:8000/api/medicines/';

  constructor(private http: HttpClient) {}

  getMedicines(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  searchMedicines(query: string): Observable<any> {
    return this.http.get(this.apiUrl + '?search=' + query);
  }

  addMedicine(medicine: FormData) {
    return this.http.post(this.apiUrl, medicine);
  }

  updateMedicine(id: number, medicine: FormData) {
    return this.http.put(`${this.apiUrl}${id}/`, medicine);
  }

  deleteMedicine(id: number) {
    return this.http.delete(`${this.apiUrl}${id}/`);
  }
}