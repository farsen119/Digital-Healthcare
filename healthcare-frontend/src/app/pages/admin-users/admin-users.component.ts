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
      doctor_type: user.doctor_type || 'permanent',
      specialization: user.specialization || '',
      license_number: user.license_number || '',
      experience_years: user.experience_years || null,
      qualification: user.qualification || '',
      hospital: user.hospital || '',
      consultation_fee: user.consultation_fee || null,
      bio: user.bio || '',
      available_days: user.available_days || '',
      consultation_hours: user.consultation_hours || '',
      start_time: this.extractStartTime(user.consultation_hours),
      end_time: this.extractEndTime(user.consultation_hours),
      is_available_for_consultation: user.is_available_for_consultation || false,
      is_live: user.is_live || false,
      // Queue system fields for permanent doctors
      max_queue_size: user.max_queue_size || 10,
      consultation_duration: user.consultation_duration || 15,
      current_queue_position: user.current_queue_position || 0,
      is_consulting: user.is_consulting || false,
      // Visiting doctor fields
      visiting_days: user.visiting_days || [],
      visiting_day_times: user.visiting_day_times || {}
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

  // Helper method to extract start time from consultation hours
  extractStartTime(consultationHours: string): string {
    if (!consultationHours) return '';
    const parts = consultationHours.split('-').map(h => h.trim());
    if (parts.length !== 2) return '';
    
    const startTime = parts[0];
    return this.convertTo24HourFormat(startTime);
  }

  // Helper method to extract end time from consultation hours
  extractEndTime(consultationHours: string): string {
    if (!consultationHours) return '';
    const parts = consultationHours.split('-').map(h => h.trim());
    if (parts.length !== 2) return '';
    
    const endTime = parts[1];
    return this.convertTo24HourFormat(endTime);
  }

  // Helper method to convert 12-hour format to 24-hour format for HTML time input
  convertTo24HourFormat(timeStr: string): string {
    if (!timeStr) return '';
    
    // Try different time formats
    const timeFormats = [
      /^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/, // 8:00 AM, 5:30 PM
      /^(\d{1,2}):(\d{2})$/, // 08:00, 17:00
      /^(\d{1,2})\.(\d{2})\s*(AM|PM|am|pm)$/, // 8.00 AM, 5.30 PM
    ];

    for (const format of timeFormats) {
      const match = timeStr.match(format);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3]?.toUpperCase();

        // Handle 12-hour format
        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }

        // Validate hours and minutes
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }
    }

    return '';
  }

  // Helper method to convert 24-hour format to 12-hour format for display
  convertTo12HourFormat(timeStr: string): string {
    if (!timeStr) return '';
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return '';
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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

      // Handle consultation hours - convert time inputs to proper format
      if (updateData.start_time && updateData.end_time) {
        const startTime = this.convertTo12HourFormat(updateData.start_time);
        const endTime = this.convertTo12HourFormat(updateData.end_time);
        updateData.consultation_hours = `${startTime} - ${endTime}`;
      }

      // Handle doctor type specific fields
      if (updateData.role === 'doctor') {
        if (updateData.doctor_type === 'permanent') {
          // Remove visiting doctor fields for permanent doctors
          delete updateData.visiting_days;
          delete updateData.visiting_day_times;
        } else if (updateData.doctor_type === 'visiting') {
          // Remove permanent doctor fields for visiting doctors
          delete updateData.available_days;
          delete updateData.consultation_hours;
          delete updateData.max_queue_size;
          delete updateData.consultation_duration;
          delete updateData.start_time;
          delete updateData.end_time;
        }
      }
      
      // Remove the temporary time fields
      delete updateData.start_time;
      delete updateData.end_time;
      
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

  // Doctor type management methods
  onDoctorTypeChange() {
    if (this.editForm.doctor_type === 'permanent') {
      // Clear visiting doctor fields
      this.editForm.visiting_days = [];
      this.editForm.visiting_day_times = {};
      // Initialize permanent doctor fields with defaults
      this.editForm.available_days = this.editForm.available_days || '';
      this.editForm.consultation_hours = this.editForm.consultation_hours || '';
      this.editForm.max_queue_size = this.editForm.max_queue_size || 10;
      this.editForm.consultation_duration = this.editForm.consultation_duration || 15;
    } else {
      // Clear permanent doctor fields
      this.editForm.available_days = '';
      this.editForm.consultation_hours = '';
      this.editForm.max_queue_size = 10;
      this.editForm.consultation_duration = 15;
      // Initialize visiting day times for all days
      this.editForm.visiting_day_times = this.editForm.visiting_day_times || {};
      this.daysOfWeek.forEach(day => {
        if (!this.editForm.visiting_day_times[day.value]) {
          this.editForm.visiting_day_times[day.value] = { start_time: '09:00', end_time: '17:00' };
        }
      });
    }
  }

  // Days of week for visiting doctors
  daysOfWeek = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' }
  ];

  // Helper methods for visiting doctors
  getDayName(dayValue: number): string {
    const day = this.daysOfWeek.find(d => d.value === dayValue);
    return day ? day.label : '';
  }

  // Helper method to check if visiting_day_times has keys
  hasVisitingDayTimes(user: any): boolean {
    return user.visiting_day_times && Object.keys(user.visiting_day_times).length > 0;
  }

  // Simple visiting day management
  onVisitingDayChange(dayValue: number, checked: boolean) {
    if (checked) {
      if (!this.editForm.visiting_days.includes(dayValue)) {
        this.editForm.visiting_days.push(dayValue);
        // Initialize time slots for the newly selected day
        if (!this.editForm.visiting_day_times[dayValue]) {
          this.editForm.visiting_day_times[dayValue] = { start_time: '09:00', end_time: '17:00' };
        }
      }
    } else {
      this.editForm.visiting_days = this.editForm.visiting_days.filter((day: number) => day !== dayValue);
      // Remove time slots for the deselected day
      delete this.editForm.visiting_day_times[dayValue];
    }
  }

  isVisitingDaySelected(dayValue: number): boolean {
    return this.editForm.visiting_days && this.editForm.visiting_days.includes(dayValue);
  }
}