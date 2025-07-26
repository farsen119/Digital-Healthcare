import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component'; // <-- Import this


@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminSidebarComponent],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  editUserId: number | null = null;
  editForm: any = {};

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe(users => {
      this.users = users;
    });
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe(() => this.loadUsers());
    }
  }

  startEdit(user: any) {
    this.editUserId = user.id;
    this.editForm = { ...user };
    this.editForm.photo = null; // Reset photo for new upload
  }

  cancelEdit() {
    this.editUserId = null;
    this.editForm = {};
  }

  saveEdit() {
    if (this.editUserId !== null) {
      this.userService.updateUser(this.editUserId, this.editForm).subscribe(() => {
        this.editUserId = null;
        this.editForm = {};
        this.loadUsers();
      });
    }
  }

  onEditFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.editForm.photo = input.files[0];
    }
  }

  getPhotoUrl(user: any): string {
    if (user.photo) {
      if (user.photo.startsWith('http')) {
        return user.photo;
      }
      return 'http://localhost:8000' + user.photo;
    }
    return '';
  }
}