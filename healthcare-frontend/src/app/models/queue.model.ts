export interface DoctorQueue {
  id: number;
  doctor: number;
  doctor_name: string;
  patient: number;
  patient_name: string;
  position: number;
  joined_at: string;
  estimated_wait_time: number;
  status: 'waiting' | 'consulting' | 'completed' | 'left';
}

export interface QueueStatus {
  waiting_count: number;
  waiting_patients: DoctorQueue[];
  consulting_patient: DoctorQueue | null;
  max_queue_size: number;
  is_consulting: boolean;
  current_patient: number | null;
}

export interface VisitingDoctorSchedule {
  id: number;
  doctor: number;
  doctor_name: string;
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface AvailableSlots {
  doctor_id: number;
  date: string;
  available_slots: string[];
}

export interface QueueJoinResponse {
  message: string;
  queue_position: number;
  estimated_wait_time: number;
  appointment_id: number;
} 