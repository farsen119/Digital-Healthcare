import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private apiUrl = 'http://localhost:8000/api/appointments/';
  constructor(private http: HttpClient) {}

  getAppointments() { return this.http.get<any[]>(this.apiUrl); }
  getAppointment(id: number) { return this.http.get<any>(`${this.apiUrl}${id}/`); }
  createAppointment(data: any) { return this.http.post(this.apiUrl, data); }
  updateAppointment(id: number, data: any) { return this.http.put(`${this.apiUrl}${id}/`, data); }
  deleteAppointment(id: number) { return this.http.delete(`${this.apiUrl}${id}/`); }
}