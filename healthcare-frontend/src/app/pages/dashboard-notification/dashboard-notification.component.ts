import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-dashboard-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-notification.component.html',
  styleUrls: ['./dashboard-notification.component.css']
})
export class DashboardNotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  private intervalId: any;

  constructor(
    private notificationService: NotificationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.loadNotifications();
    if (isPlatformBrowser(this.platformId)) {
      this.intervalId = setInterval(() => this.loadNotifications(), 30000);
    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe({
      next: (notifs) => {
        this.notifications = notifs;
        this.unreadCount = notifs.filter(n => !n.is_read).length;
      },
      error: err => {
        console.error('Notification fetch error:', err);
      }
    });
  }

  markAsRead(notif: Notification) {
    if (!notif.is_read) {
      this.notificationService.markAsRead(notif.id).subscribe(() => {
        notif.is_read = true;
        this.unreadCount = this.notifications.filter(n => !n.is_read).length;
      });
    }
  }
}