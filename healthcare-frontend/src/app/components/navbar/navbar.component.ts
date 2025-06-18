import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // <-- Import this!

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink], // <-- Add RouterLink here
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  user: any = null;
  constructor(public auth: AuthService, private router: Router) {
    this.auth.currentUser$.subscribe(u => this.user = u);
  }
  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}