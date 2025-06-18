import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = 'http://localhost:8000/api/users/';
  constructor(private http: HttpClient) {}

  getUsers() { return this.http.get<any[]>(this.apiUrl); }
  deleteUser(id: number) { return this.http.delete(`${this.apiUrl}${id}/`); }
  updateUser(id: number, data: any) {
    const formData = new FormData();
    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    }
    return this.http.put(`${this.apiUrl}${id}/`, formData);
  }
}