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

  // Helper methods to filter users by role
  getAdmins() {
    return this.users.filter(user => user.role === 'admin');
  }

  getDoctors() {
    return this.users.filter(user => user.role === 'doctor');
  }

  getPatients() {
    return this.users.filter(user => user.role === 'patient');
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
      blood_group: user.blood_group || '',
      emergency_contact_name: user.emergency_contact_name || '',
      emergency_contact_phone: user.emergency_contact_phone || '',
      emergency_contact_relationship: user.emergency_contact_relationship || '',
      date_of_birth: user.date_of_birth ? this.formatDateForInput(user.date_of_birth) : '',
      address: user.address || '',
      medical_history: user.medical_history || '',
      current_medications: user.current_medications || '',
      allergies: user.allergies || '',
      height: user.height || null,
      weight: user.weight || null,
      occupation: user.occupation || '',
      marital_status: user.marital_status || '',
      // Doctor-specific fields
      license_number: user.license_number || '',
      experience_years: user.experience_years || null,
      qualification: user.qualification || '',
      hospital: user.hospital || '',
      consultation_fee: user.consultation_fee || null,
      bio: user.bio || '',
      available_days: user.available_days || '',
      consultation_hours: user.consultation_hours || '',
      is_available_for_consultation: user.is_available_for_consultation || false
    };
    this.editForm.photo = null; // Reset photo for new upload
  }

  // Helper method to format date for input field
  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
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
      if (updateData.height === '') updateData.height = null;
      if (updateData.weight === '') updateData.weight = null;
      
      // Handle date_of_birth - ensure it's in correct format or remove if empty
      if (updateData.date_of_birth === '' || !updateData.date_of_birth) {
        delete updateData.date_of_birth;
      } else {
        // Ensure date is in YYYY-MM-DD format
        const date = new Date(updateData.date_of_birth);
        if (!isNaN(date.getTime())) {
          updateData.date_of_birth = date.toISOString().split('T')[0];
        } else {
          delete updateData.date_of_birth;
        }
      }
      
      this.userService.updateUser(this.editUserId, updateData).subscribe({
        next: (response) => {
          // Update the user in the list
          const index = this.users.findIndex(u => u.id === this.editUserId);
          if (index !== -1) {
            this.users[index] = { ...this.users[index], ...updateData };
          }
          this.cancelEdit();
          this.loadUsers(); // Refresh the list
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