import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  appointment?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = 'http://127.0.0.1:8000/api/notifications/';

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl);
  }

  markAsRead(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}${id}/`, { is_read: true });
  }
}