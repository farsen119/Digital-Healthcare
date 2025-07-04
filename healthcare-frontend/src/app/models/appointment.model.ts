import { Prescription } from './prescription.model';

export type AppointmentStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface Appointment {
    id: number;
    date: string;
    time: string;
    doctor_name: string;
    doctor_specialization?: string; 
    patient_name_display: string;
    patient_name?: string;
    patient_email?: string;

    reason: string;
    status: AppointmentStatus;
    doctor_id: number;
    patient_id: number | null;
    prescription?: Prescription;
}

// No changes needed below, this is the full file for completeness
export interface AppointmentUpdateDTO {
    date?: string;
    time?: string;
    reason?: string;
    status?: AppointmentStatus;
    prescription?: string;
}

export interface AppointmentCreateDTO {
    date: string;
    time: string;
    doctor: number;
    reason:string;
    status?: AppointmentStatus;
    patient?: number;
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
//  // Add this line to define the new property
//     doctor_specialization?: string;