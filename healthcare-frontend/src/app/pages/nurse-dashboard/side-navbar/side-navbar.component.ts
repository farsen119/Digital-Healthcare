import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-nurse-side-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  providers: [AuthService],
  templateUrl: './side-navbar.component.html',
  styleUrl: './side-navbar.component.css'
})
export class NurseSideNavbarComponent implements OnInit {
  user: any = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
      }
    });
  }

  getPhotoUrl(): string {
    if (this.user && this.user.photo) {
      if (this.user.photo.startsWith('http')) {
        return this.user.photo;
      }
      // Add cache-busting parameter to force refresh
      const baseUrl = 'http://localhost:8000' + this.user.photo;
      return baseUrl + (baseUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
    }
    return '';
  }

  logout(): void {
    this.authService.logout();
  }
}
