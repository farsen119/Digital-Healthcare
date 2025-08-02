import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimeSlotService {

  constructor() { }

  /**
   * Generate time slots based on doctor's consultation hours
   * @param consultationHours - Format: "8:00 AM - 5:00 PM" or "08:00 - 17:00" or "10AM-5PM"
   * @returns Array of time slots in 15-minute intervals
   */
  generateTimeSlots(consultationHours: string): string[] {
    if (!consultationHours || consultationHours.trim() === '') {
      console.log('No consultation hours provided, using default slots');
      return this.getDefaultTimeSlots();
    }

    try {
      // Parse consultation hours - handle different dash formats
      let hours: string[];
      if (consultationHours.includes(' - ')) {
        // Format: "10:00 AM - 5:00 PM"
        hours = consultationHours.split(' - ').map(h => h.trim());
      } else if (consultationHours.includes('-')) {
        // Format: "10AM-5PM"
        hours = consultationHours.split('-').map(h => h.trim());
      } else {
        console.log('Invalid consultation hours format (no dash found):', consultationHours);
        return this.getDefaultTimeSlots();
      }

      if (hours.length !== 2) {
        console.log('Invalid consultation hours format:', consultationHours);
        return this.getDefaultTimeSlots();
      }

      console.log('Split hours:', hours);

      const startTime = this.parseTime(hours[0]);
      const endTime = this.parseTime(hours[1]);

      if (!startTime || !endTime) {
        console.log('Could not parse start or end time:', { start: hours[0], end: hours[1] });
        return this.getDefaultTimeSlots();
      }

      console.log('Parsed times:', {
        start: startTime.toLocaleTimeString(),
        end: endTime.toLocaleTimeString(),
        consultationHours
      });

      const slots = this.generateSlotsBetweenTimes(startTime, endTime);
      console.log('Generated slots:', slots);
      return slots;
    } catch (error) {
      console.error('Error parsing consultation hours:', error);
      return this.getDefaultTimeSlots();
    }
  }

  /**
   * Parse time string to Date object
   */
  private parseTime(timeStr: string): Date | null {
    const today = new Date();
    
    // Clean the time string
    timeStr = timeStr.trim();
    
    // Try different time formats
    const timeFormats = [
      /^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/, // 8:00 AM, 5:30 PM
      /^(\d{1,2}):(\d{2})$/, // 08:00, 17:00
      /^(\d{1,2})\.(\d{2})\s*(AM|PM|am|pm)$/, // 8.00 AM, 5.30 PM
      /^(\d{1,2})(AM|PM|am|pm)$/, // 10AM, 5PM
    ];

    for (const format of timeFormats) {
      const match = timeStr.match(format);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0; // Default to 0 minutes if not specified
        const period = match[3]?.toUpperCase() || match[2]?.toUpperCase();

        // Handle 12-hour format
        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }

        // Validate hours and minutes
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          const date = new Date(today);
          date.setHours(hours, minutes, 0, 0);
          return date;
        }
      }
    }

    return null;
  }

  /**
   * Generate time slots between start and end time in 15-minute intervals
   */
  private generateSlotsBetweenTimes(startTime: Date, endTime: Date): string[] {
    const slots: string[] = [];
    const currentTime = new Date(startTime);

    // Only generate slots that are strictly before the end time
    while (currentTime < endTime) {
      slots.push(this.formatTimeForInput(currentTime));
      currentTime.setMinutes(currentTime.getMinutes() + 15);
    }

    return slots;
  }

  /**
   * Format time for HTML time input (HH:MM)
   */
  private formatTimeForInput(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Get default time slots (9 AM to 5 PM)
   */
  private getDefaultTimeSlots(): string[] {
    const slots: string[] = [];
    const startHour = 9;
    const endHour = 17;

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeStr);
      }
    }

    return slots;
  }

  /**
   * Format time for display (12-hour format)
   */
  formatTimeForDisplay(timeStr: string): string {
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timeStr;
    }
  }

  /**
   * Check if a time slot is available (not in the past for today)
   */
  isTimeSlotAvailable(timeStr: string, selectedDate: string): boolean {
    if (!selectedDate) return true;

    const today = new Date();
    const selectedDateObj = new Date(selectedDate);
    
    // If selected date is today, check if time is in the past
    if (selectedDateObj.toDateString() === today.toDateString()) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const slotTime = new Date();
      slotTime.setHours(hours, minutes, 0, 0);
      
      return slotTime > today;
    }

    return true;
  }
} 