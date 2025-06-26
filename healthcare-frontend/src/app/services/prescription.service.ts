import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Prescription, PrescriptionCreateDTO, } from '../models/prescription.model';

export interface PrescriptionUpdateDTO {
  details: string;
}
export interface AdminNotesUpdateDTO {
  admin_notes: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  // Use a hardcoded URL, just like in your AppointmentService
  private apiUrl = 'http://127.0.0.1:8000/api/prescriptions/';

  constructor(private http: HttpClient) {}

  /**
   * Creates a new prescription for an appointment.
   * @param data The prescription data transfer object.
   */
  createPrescription(data: PrescriptionCreateDTO): Observable<Prescription> {
    return this.http.post<Prescription>(this.apiUrl, data);
  }

  updatePrescription(id: number, data: PrescriptionUpdateDTO): Observable<Prescription> {
    // The PUT request goes to the specific prescription URL, e.g., /api/prescriptions/123/
    return this.http.patch<Prescription>(`${this.apiUrl}${id}/`, data);
  }
  updateAdminNotes(id: number, data: AdminNotesUpdateDTO): Observable<Prescription> {
    // We use PATCH to send only the admin_notes field.
    return this.http.patch<Prescription>(`${this.apiUrl}${id}/`, data);
  }
  getAllPrescriptions(): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(this.apiUrl);
  }
}