import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

// Helper function to check if running in the browser
function isBrowser(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8000/api';
  public currentUserSubject = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    if (isBrowser()) {
      const user = localStorage.getItem('user');
      if (user) this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login/`, { username, password }).pipe(
      tap(res => {
        if (isBrowser()) {
          localStorage.setItem('access', res.access);
          localStorage.setItem('refresh', res.refresh);
        }
        this.getProfile().subscribe();
      })
    );
  }

  logout() {
    if (isBrowser()) {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
    }
    this.currentUserSubject.next(null);
  }

  register(data: any): Observable<any> {
    const formData = new FormData();
    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    }
    return this.http.post(`${this.apiUrl}/register/`, formData);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/profile/`).pipe(
      tap(user => {
        if (isBrowser()) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        this.currentUserSubject.next(user);
      })
    );
  }

  updateProfile(data: any): Observable<any> {
    const formData = new FormData();
    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    }
    return this.http.put(`${this.apiUrl}/users/profile/`, formData).pipe(
      tap(user => {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        this.currentUserSubject.next(user);
      })
    );
  }

  isLoggedIn(): boolean {
    return isBrowser() && !!localStorage.getItem('access');
  }

  getRole(): string | null {
    const user = this.currentUserSubject.value;
    return user ? user.role : null;
  }
}