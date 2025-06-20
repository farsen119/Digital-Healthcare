import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
    Appointment, 
    AppointmentCreateDTO, 
    AppointmentResponse, 
    AppointmentUpdateDTO, 
} from '../models/appointment.model';

@Injectable({
    providedIn: 'root'
})
export class AppointmentService {
    private apiUrl = 'http://127.0.0.1:8000/api/appointments/'; 

    constructor(private http: HttpClient) {}

    getAppointments(): Observable<AppointmentResponse[]> {
        return this.http.get<AppointmentResponse[]>(this.apiUrl);
    }
    
    getAppointment(id: number): Observable<AppointmentResponse> {
        return this.http.get<AppointmentResponse>(`${this.apiUrl}${id}/`);
    }

    createAppointment(data: AppointmentCreateDTO): Observable<AppointmentResponse> {
        return this.http.post<AppointmentResponse>(this.apiUrl, data);
    }

    updateAppointment(id: number, data: AppointmentUpdateDTO): Observable<AppointmentResponse> {
        return this.http.patch<AppointmentResponse>(`${this.apiUrl}${id}/`, data);
    }

    deleteAppointment(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}${id}/`);
    }

    getTodayAppointments(): Observable<AppointmentResponse[]> {
        return this.http.get<AppointmentResponse[]>(`${this.apiUrl}today/`);
    }

    getUpcomingAppointments(): Observable<AppointmentResponse[]> {
        return this.http.get<AppointmentResponse[]>(`${this.apiUrl}upcoming/`);
    }

    updateAppointmentStatus(id: number, status: AppointmentResponse['status']): Observable<AppointmentResponse> {
        return this.http.patch<AppointmentResponse>(`${this.apiUrl}${id}/status/`, { status });
    }
}