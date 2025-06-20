import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://127.0.0.1:8000/api/users/';

  constructor(private http: HttpClient) {}

  /**
   * Gets all users.
   */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
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
    return this.http.get<User[]>(`${this.apiUrl}?role=doctor`);
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
  updateUser(id: number, userData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}${id}/`, userData);
  }

  /**
   * Deletes a user by their ID.
   */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`);
  }
}
