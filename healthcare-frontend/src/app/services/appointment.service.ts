import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    AppointmentCreateDTO,
    AppointmentResponse,
    AppointmentUpdateDTO,
    AppointmentStatus
} from '../models/appointment.model';
import {
    DoctorQueue,
    QueueStatus,
    VisitingDoctorSchedule,
    AvailableSlots,
    QueueJoinResponse
} from '../models/queue.model';

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

    updateAppointmentStatus(id: number, status: AppointmentStatus): Observable<AppointmentResponse> {
        return this.http.patch<AppointmentResponse>(`${this.apiUrl}${id}/status/`, { status });
    }

    // Queue Management Methods
    joinQueue(doctorId: number): Observable<QueueJoinResponse> {
        return this.http.post<QueueJoinResponse>(`${this.apiUrl}join-queue/`, { doctor_id: doctorId });
    }

    leaveQueue(doctorId: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}leave-queue/`, { doctor_id: doctorId });
    }

    getQueueStatus(doctorId: number): Observable<QueueStatus> {
        return this.http.get<QueueStatus>(`${this.apiUrl}queue-status/${doctorId}/`);
    }

    startConsultation(patientId: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}start-consultation/`, { patient_id: patientId });
    }

    completeConsultation(): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}complete-consultation/`, {});
    }

    // Visiting Doctor Schedule Methods
    getAvailableSlots(doctorId: number, date: string): Observable<AvailableSlots> {
        return this.http.get<AvailableSlots>(`${this.apiUrl}available-slots/${doctorId}/?date=${date}`);
    }

    // Doctor Queue Management
    getDoctorQueues(): Observable<DoctorQueue[]> {
        return this.http.get<DoctorQueue[]>(`${this.apiUrl}queues/`);
    }

    // Visiting Doctor Schedules
    getVisitingSchedules(): Observable<VisitingDoctorSchedule[]> {
        return this.http.get<VisitingDoctorSchedule[]>(`${this.apiUrl}schedules/`);
    }

    createVisitingSchedule(schedule: Partial<VisitingDoctorSchedule>): Observable<VisitingDoctorSchedule> {
        return this.http.post<VisitingDoctorSchedule>(`${this.apiUrl}schedules/`, schedule);
    }

    updateVisitingSchedule(id: number, schedule: Partial<VisitingDoctorSchedule>): Observable<VisitingDoctorSchedule> {
        return this.http.patch<VisitingDoctorSchedule>(`${this.apiUrl}schedules/${id}/`, schedule);
    }

    deleteVisitingSchedule(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}schedules/${id}/`);
    }
}
