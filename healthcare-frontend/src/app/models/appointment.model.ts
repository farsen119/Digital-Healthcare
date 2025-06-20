export type AppointmentStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface Appointment {
    id: number;
    date: string;
    time: string;
    doctor_name: string;
    patient_name_display: string;
    patient_name?: string;      // <-- add this
    patient_email?: string;
    reason: string;
    status: AppointmentStatus;
    doctor_id: number;
    patient_id: number | null; // Patient can be null for guests
}

export interface AppointmentUpdateDTO {
    date?: string;
    time?: string;
    reason?: string;
    status?: AppointmentStatus;
}

export interface AppointmentCreateDTO {
    date: string;
    time: string;
    doctor: number; // Changed from doctor_id
    reason: string;
    status?: AppointmentStatus;

    // For EITHER a registered patient OR a guest
    patient?: number; // Changed from patient_id
    patient_name?: string;
    patient_email?: string;
}

export interface AppointmentResponse extends Appointment {
    created_at: string;
    updated_at: string;
}

export interface AppointmentStats {
    total: number;
    today: number;
    upcoming: number;
    completed: number;
    cancelled: number;
}
