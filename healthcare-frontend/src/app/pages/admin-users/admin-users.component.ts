import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';

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
    this.editForm = { 
      ...user,
      // Ensure all fields are initialized
      age: user.age || null,
      gender: user.gender || '',
      license_number: user.license_number || '',
      experience_years: user.experience_years || null,
      qualification: user.qualification || '',
      hospital: user.hospital || '',
      consultation_fee: user.consultation_fee || null,
      bio: user.bio || '',
      available_days: user.available_days || '',
      consultation_hours: user.consultation_hours || '',
      is_live: user.is_live || false
    };
    this.editForm.photo = null; // Reset photo for new upload
  }

  cancelEdit() {
    this.editUserId = null;
    this.editForm = {};
  }

  saveEdit() {
    if (this.editUserId !== null) {
      // Create a clean data object for submission
      const updateData = { ...this.editForm };
      
      // Remove photo if not selected
      if (!updateData.photo) {
        delete updateData.photo;
      }
      
      // Handle null values for numeric fields
      if (updateData.experience_years === '') updateData.experience_years = null;
      if (updateData.consultation_fee === '') updateData.consultation_fee = null;
      
      console.log('Sending update data:', updateData); // Debug log
      
      this.userService.updateUser(this.editUserId, updateData).subscribe({
        next: (response) => {
          console.log('Update successful:', response); // Debug log
          this.editUserId = null;
          this.editForm = {};
          this.loadUsers();
          alert('User updated successfully!');
        },
        error: (err) => {
          console.error('Error updating user:', err);
          console.error('Error details:', err.error); // Debug log
          console.error('Error status:', err.status); // Debug log
          
          let errorMessage = 'Failed to update user. Please try again.';
          if (err.error && typeof err.error === 'object') {
            const errorDetails = Object.entries(err.error).map(([key, value]) => `${key}: ${value}`).join(', ');
            errorMessage = `Update failed: ${errorDetails}`;
          } else if (err.error && typeof err.error === 'string') {
            errorMessage = `Update failed: ${err.error}`;
          }
          
          alert(errorMessage);
        }
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