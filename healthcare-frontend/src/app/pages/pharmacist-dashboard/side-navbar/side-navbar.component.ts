import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-pharmacist-side-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './side-navbar.component.html',
  styleUrl: './side-navbar.component.css'
})
export class PharmacistSideNavbarComponent implements OnInit {
  user: any = null;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.getProfile().subscribe({
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
      return 'http://localhost:8000' + this.user.photo;
    }
    return '';
  }
}
