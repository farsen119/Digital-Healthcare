import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { WebSocketService } from './websocket.service';

// Helper function to check if running in the browser
function isBrowser(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8000/api';
  public currentUserSubject = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private webSocketService: WebSocketService) {
    if (isBrowser()) {
      const user = localStorage.getItem('user');
      if (user) this.currentUserSubject.next(JSON.parse(user));
    }
  }

  // Login using Django SimpleJWT endpoint
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/token/`, { username, password }).pipe(
      tap(res => {
        if (isBrowser()) {
          localStorage.setItem('access', res.access);
          localStorage.setItem('refresh', res.refresh);
        }
        this.getProfile().subscribe(user => {
          // If user is a doctor, automatically set them online
          if (user && user.role === 'doctor') {
            this.setDoctorOnline().subscribe();
          }
        });
      })
    );
  }

  logout(): void {
    // If user is a doctor, set them offline before logout
    const currentUser = this.currentUserSubject.value;
    if (currentUser && currentUser.role === 'doctor') {
      this.setDoctorOffline().subscribe({
        next: () => {
          this.performLogout();
        },
        error: (error) => {
          // Still perform logout even if setting offline fails
          this.performLogout();
        }
      });
    } else {
      this.performLogout();
    }
  }

  private performLogout(): void {
    // Disconnect WebSocket
    this.webSocketService.disconnect();
    
    if (isBrowser()) {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
    }
    this.currentUserSubject.next(null);
  }

  setDoctorOnline(): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/login-status/`, {});
  }

  setDoctorOffline(): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/logout-status/`, {});
  }

  register(data: any): Observable<any> {
    const formData = new FormData();
    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        if (key === 'visiting_day_times' && typeof data[key] === 'object') {
          // Handle complex objects by converting to JSON string
          formData.append(key, JSON.stringify(data[key]));
        } else if (key === 'visiting_days' && Array.isArray(data[key])) {
          // Handle arrays by converting to JSON string
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    }
    return this.http.post(`${this.apiUrl}/register/`, formData);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/profile/`).pipe(
      tap((user: any) => {
        if (isBrowser()) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        this.currentUserSubject.next(user);
      })
    );
  }

  updateProfile(data: any): Observable<any> {
    // Check if we're updating boolean fields (like is_live)
    const hasBooleanFields = Object.keys(data).some(key => 
      typeof data[key] === 'boolean' || key === 'is_live'
    );
    
    if (hasBooleanFields) {
      // Send as JSON for boolean fields
      return this.http.put(`${this.apiUrl}/users/profile/`, data).pipe(
        tap((user: any) => {
          if (isBrowser()) {
            localStorage.setItem('user', JSON.stringify(user));
          }
          this.currentUserSubject.next(user);
        })
      );
    } else {
      // Send as FormData for file uploads
      const formData = new FormData();
      for (const key in data) {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      }
      return this.http.put(`${this.apiUrl}/users/profile/`, formData).pipe(
        tap((user: any) => {
          if (isBrowser()) {
            localStorage.setItem('user', JSON.stringify(user));
          }
          this.currentUserSubject.next(user);
        })
      );
    }
  }

  isLoggedIn(): boolean {
    return isBrowser() && !!localStorage.getItem('access');
  }

  getRole(): string | null {
    const user = this.currentUserSubject.value;
    return user ? user.role : null;
  }

  // Refresh token support for automatic JWT refresh
  refreshToken(): Observable<any> {
    if (isBrowser()) {
      const refresh = localStorage.getItem('refresh');
      if (refresh) {
        return this.http.post<any>(`${this.apiUrl}/token/refresh/`, { refresh }).pipe(
          tap(res => {
            if (res.access) {
              localStorage.setItem('access', res.access);
            }
          })
        );
      }
    }
    return new Observable(observer => {
      observer.error('No refresh token');
    });
  }
}