import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { environment } from '../../environments/environment';
import { WebSocketMessage, DoctorStatus } from '../types/websocket.types';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private pollingInterval = 2000;
  private pollingTimer: any = null;
  private isConnecting = false;
  private fallbackMode = false;
  private fallbackCooldown = false;
  private fallbackCooldownTime = 20000; // 20 seconds cooldown

  private doctorStatusSubject = new BehaviorSubject<any[]>([]);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private messagesSubject = new BehaviorSubject<WebSocketMessage | null>(null);

  public doctorStatus$ = this.doctorStatusSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();

  constructor(private http: HttpClient) {
    setTimeout(() => { 
      this.connect(); 
    }, 1000);
  }

  private getWebSocketUrl(): string {
    const baseUrl = environment.apiBaseUrl.replace('/api/', '');
    return `${baseUrl.replace('http', 'ws')}/ws/doctor-status/`;
  }

  public connect(): void {
    if (this.isConnecting || this.isConnected() || this.fallbackCooldown) return;
    this.isConnecting = true;
    try {
      this.socket = new WebSocket(this.getWebSocketUrl());
      this.socket.onopen = () => {
        this.connectionStatusSubject.next(true);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.fallbackMode = false;
        this.stopPolling();
      };
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'doctor_status_change') {
            this.handleDoctorStatusChange(data);
          } else {
            this.messagesSubject.next(data);
          }
        } catch (error) {}
      };
      this.socket.onclose = (event) => {
        this.connectionStatusSubject.next(false);
        this.isConnecting = false;
        this.stopPolling();
        if (!this.fallbackMode) {
          this.startFallbackMode();
        }
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.enterFallbackCooldown();
        }
      };
      this.socket.onerror = (error) => {
        this.connectionStatusSubject.next(false);
        this.isConnecting = false;
        if (!this.fallbackMode) {
          this.startFallbackMode();
        }
      };
    } catch (error) {
      this.connectionStatusSubject.next(false);
      this.isConnecting = false;
      this.startFallbackMode();
    }
  }

  private enterFallbackCooldown() {
    this.fallbackCooldown = true;
    this.fallbackMode = true;
    setTimeout(() => {
      this.fallbackCooldown = false;
      this.reconnectAttempts = 0;
      this.connect();
    }, this.fallbackCooldownTime);
  }

  private startFallbackMode(): void {
    if (this.fallbackMode) return;
    this.fallbackMode = true;
    this.startPolling();
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect');
      this.socket = null;
    }
    this.stopPolling();
    this.connectionStatusSubject.next(false);
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  public sendMessage(message: any): void {
    if (this.isConnected()) {
      this.socket!.send(JSON.stringify(message));
    } else {
      // If WebSocket is not connected, use HTTP fallback
      this.sendMessageViaHTTP(message);
    }
  }

  private sendMessageViaHTTP(message: any): void {
    if (message.type === 'doctor_status_update') {
      this.http.put(`${environment.apiBaseUrl}profile/`, {
        is_available_for_consultation: message.is_available_for_consultation
      }).subscribe({
        next: () => {
          this.pollDoctorStatus();
        },
        error: () => {
          // Silent error handling
        }
      });
    }
  }

  public updateDoctorStatus(doctorId: number, isAvailable: boolean): void {
    const message = {
      type: 'doctor_status_update',
      doctor_id: doctorId,
      is_available_for_consultation: isAvailable
    };
    this.sendMessage(message);
  }

  private handleDoctorStatusChange(data: WebSocketMessage): void {
    if (!data.doctor_id || !data.doctor_info) return;
    
    const doctorStatus = {
      doctor_id: data.doctor_id,
      is_available_for_consultation: data.is_available_for_consultation || false,
      doctor_info: data.doctor_info
    };

    const currentStatuses = this.doctorStatusSubject.value;
    const existingIndex = currentStatuses.findIndex(
      status => status.doctor_id === doctorStatus.doctor_id
    );

    if (existingIndex >= 0) {
      currentStatuses[existingIndex] = doctorStatus;
    } else {
      currentStatuses.push(doctorStatus);
    }

    this.doctorStatusSubject.next([...currentStatuses]);
    this.messagesSubject.next(data);
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    
    setTimeout(() => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.connect();
      } else {
        this.startFallbackMode();
      }
    }, this.reconnectInterval);
  }

  private startPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }
    
    // Initial poll
    this.pollDoctorStatus();
    
    // Set up periodic polling
    this.pollingTimer = setInterval(() => {
      this.pollDoctorStatus();
    }, this.pollingInterval);
  }

  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  private pollDoctorStatus(): void {
    this.http.get(`${environment.apiBaseUrl}users/`).subscribe({
      next: (users: any) => {
        const doctors = users.filter((user: any) => user.role === 'doctor');
        const doctorStatuses = doctors.map((doctor: any) => ({
          doctor_id: doctor.id,
          is_available_for_consultation: doctor.is_available_for_consultation,
          doctor_info: {
            id: doctor.id,
            username: doctor.username,
            first_name: doctor.first_name,
            last_name: doctor.last_name,
            is_available_for_consultation: doctor.is_available_for_consultation,
            consultation_hours: doctor.consultation_hours,
            specialization: doctor.specialization,
            hospital: doctor.hospital
          }
        }));
        
        this.doctorStatusSubject.next(doctorStatuses);
      },
      error: () => {
        // Silent error handling
      }
    });
  }

  public refreshDoctorStatuses(): void {
    if (this.isConnected()) {
      return;
    } else {
      this.pollDoctorStatus();
    }
  }

  public forceReconnect(): void {
    this.reconnectAttempts = 0;
    this.fallbackMode = false;
    this.disconnect();
    setTimeout(() => { 
      this.connect(); 
    }, 1000);
  }

  public isInFallbackMode(): boolean {
    return this.fallbackMode;
  }
} 