import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8000/api/users/';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return new HttpHeaders();
    }
    
    const token = localStorage.getItem('access');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Gets all users.
   */
  getUsers(): Observable<User[]> {
    const authHeaders = this.getAuthHeaders();
    return this.http.get<User[]>(this.apiUrl, { headers: authHeaders });
  }

  /**
   * Gets a single user by their ID.
   */
  getUser(id: number): Observable<User> {
    const authHeaders = this.getAuthHeaders();
    return this.http.get<User>(`${this.apiUrl}${id}/`, { headers: authHeaders });
  }

  /**
   * Gets all users with the 'doctor' role.
   */
  getDoctors(): Observable<User[]> {
    const authHeaders = this.getAuthHeaders();
    return this.http.get<User[]>(`${this.apiUrl}?role=doctor`, { headers: authHeaders });
  }

  /**
   * Gets all doctors without authentication (for public display).
   */
  getPublicDoctors(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}public-doctors/`);
  }

  /**
   * Gets all users with the 'patient' role.
   */
  getPatients(): Observable<User[]> {
    const authHeaders = this.getAuthHeaders();
    return this.http.get<User[]>(`${this.apiUrl}?role=patient`, { headers: authHeaders });
  }

  /**
   * Gets all users with the 'pharmacist' role.
   */
  getPharmacists(): Observable<User[]> {
    const authHeaders = this.getAuthHeaders();
    return this.http.get<User[]>(`${this.apiUrl}?role=pharmacist`, { headers: authHeaders });
  }

  /**
   * Gets all users with the 'nurse' role.
   */
  getNurses(): Observable<User[]> {
    const authHeaders = this.getAuthHeaders();
    return this.http.get<User[]>(`${this.apiUrl}?role=nurse`, { headers: authHeaders });
  }

  /**
   * Creates a new user (admin only).
   */
  createUser(userData: any): Observable<User> {
    const authHeaders = this.getAuthHeaders();
    
    // Check if there's a file to upload
    if (userData.photo && userData.photo instanceof File) {
      // Use FormData for file uploads
      const formData = new FormData();
      
      // Add all user data to FormData
      Object.keys(userData).forEach(key => {
        if (key === 'photo') {
          formData.append('photo', userData.photo);
        } else if (userData[key] !== null && userData[key] !== undefined) {
          formData.append(key, userData[key]);
        }
      });
      
      return this.http.post<User>(this.apiUrl, formData, { 
        headers: new HttpHeaders({
          'Authorization': authHeaders.get('Authorization') || ''
        })
      });
    } else {
      // For regular JSON data
      return this.http.post<User>(this.apiUrl, userData, { headers: authHeaders });
    }
  }

  /**
   * Updates a user's profile data.
   */
  updateUser(id: number, userData: any): Observable<User> {
    const authHeaders = this.getAuthHeaders();
    
    // Check if there's a file to upload
    if (userData.photo && userData.photo instanceof File) {
      // Use FormData for file uploads - don't set Content-Type, let browser set it
      const formData = new FormData();
      
      // Add all user data to FormData
      Object.keys(userData).forEach(key => {
        if (key === 'photo') {
          formData.append('photo', userData.photo);
        } else if (userData[key] !== null && userData[key] !== undefined) {
          formData.append(key, userData[key]);
        }
      });
      
      // For FormData, don't set Content-Type - browser will set it with boundary
      return this.http.patch<User>(`${this.apiUrl}${id}/`, formData, { 
        headers: new HttpHeaders({
          'Authorization': authHeaders.get('Authorization') || ''
        })
      });
    } else {
      // For regular JSON data
      return this.http.patch<User>(`${this.apiUrl}${id}/`, userData, { headers: authHeaders });
    }
  }

  /**
   * Deletes a user.
   */
  deleteUser(id: number): Observable<void> {
    const authHeaders = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}${id}/`, { headers: authHeaders });
  }
}
