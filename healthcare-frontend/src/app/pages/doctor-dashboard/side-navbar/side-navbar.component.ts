import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { WebSocketService } from '../../../services/websocket.service';
import { WebSocketMessage } from '../../../types/websocket.types';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-side-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './side-navbar.component.html',
  styleUrl: './side-navbar.component.css'
})
export class SideNavbarComponent implements OnInit, OnDestroy {
  user: any = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private webSocketService: WebSocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.auth.getProfile().subscribe({
        next: (user) => {
          this.user = user;
        },
        error: (error) => {
          // Handle error silently
        }
      })
    );

    this.subscriptions.push(
      this.webSocketService.messages$.subscribe(message => {
        if (message && message.type === 'doctor_status_change') {
          this.handleStatusUpdate(message);
        }
      })
    );

    this.subscriptions.push(
      this.webSocketService.doctorStatus$.subscribe((statuses: any[]) => {
        const userStatus = statuses.find(status => status.doctor_id === this.user?.id);
        if (userStatus) {
          this.handleStatusUpdate({
            type: 'doctor_status_change',
            doctor_id: userStatus.doctor_id,
            is_available_for_consultation: userStatus.is_available_for_consultation,
            doctor_info: userStatus.doctor_info
          });
        }
      })
    );

    this.subscriptions.push(
      this.webSocketService.connectionStatus$.subscribe(connected => {
        if (connected) {
          this.webSocketService.refreshDoctorStatuses();
        }
      })
    );

    this.subscriptions.push(
      interval(5000).subscribe(() => {
        if (!this.webSocketService.isConnected() && this.webSocketService.isInFallbackMode()) {
          this.webSocketService.refreshDoctorStatuses();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  handleStatusUpdate(message: WebSocketMessage) {
    if (!message.doctor_id || !message.doctor_info) return;
    
    if (this.user && message.doctor_id === this.user.id) {
      this.user = {
        ...this.user,
        is_available_for_consultation: message.doctor_info.is_available_for_consultation
      };
      
      this.cdr.detectChanges();
    }
  }

  getPhotoUrl(): string {
    if (this.user && this.user.photo) {
      if (this.user.photo.startsWith('http')) {
        return this.user.photo;
      }
      return 'http://localhost:8000' + this.user.photo;
    }
    return '';
  }
}
