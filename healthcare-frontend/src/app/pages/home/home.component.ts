import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AvailableDoctorsComponent } from './available-doctors/available-doctors.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, AvailableDoctorsComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  user: any = null;
  constructor(public auth: AuthService, private router: Router) {
    this.auth.currentUser$.subscribe(u => this.user = u);
  }
  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}