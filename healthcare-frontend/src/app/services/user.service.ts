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
    return this.http.get<User>(`${this.apiUrl}${id}/`);
  }

  /**
   * Gets all users with the 'doctor' role.
   */
  getDoctors(): Observable<User[]> {
    const authHeaders = this.getAuthHeaders();
    return this.http.get<User[]>(`${this.apiUrl}?role=doctor`, { headers: authHeaders });
  }

  /**
   * Gets all users with the 'patient' role.
   */
  getPatients(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}?role=patient`);
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
      // Remove photo field if it's not a file
      const { photo, ...dataWithoutPhoto } = userData;
      
      // For JSON data, set proper Content-Type
      const jsonHeaders = new HttpHeaders({
        'Authorization': authHeaders.get('Authorization') || '',
        'Content-Type': 'application/json'
      });
      
      return this.http.patch<User>(`${this.apiUrl}${id}/`, dataWithoutPhoto, { headers: jsonHeaders });
    }
  }

  /**
   * Deletes a user by their ID.
   */
  deleteUser(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}${id}/`, { headers });
  }
}
