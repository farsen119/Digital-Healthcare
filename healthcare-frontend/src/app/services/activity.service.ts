import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Activity {
  type: string;
  message: string;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private apiUrl = 'http://localhost:8000/api/recent-activities/';
  constructor(private http: HttpClient) {}

  getRecentActivities(): Observable<Activity[]> {
    return this.http.get<Activity[]>(this.apiUrl);
  }
}