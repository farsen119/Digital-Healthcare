import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Manage Users</h2>
    <div *ngFor="let user of users">
      {{ user.username }} - {{ user.role }}
      <button (click)="deleteUser(user.id)">Delete</button>
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  constructor(private userService: UserService) {}
  ngOnInit() {
    this.userService.getUsers().subscribe(users => this.users = users);
  }
  deleteUser(id: number) {
    this.userService.deleteUser(id).subscribe(() => this.ngOnInit());
  }
}