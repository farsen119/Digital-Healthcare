export type AppointmentStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface Appointment {
    id: number;
    date: string;
    time: string;
    doctor_name: string;
    patient_name_display: string;
    reason: string;
    status: AppointmentStatus;
    doctor_id: number;
    patient_id: number;
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
    doctor_id: number;
    patient_id: number;
    reason: string;
    status?: AppointmentStatus;
}

export interface AppointmentResponse extends Appointment {
    created_at: string;
    updated_at: string;
}

// export interface AppointmentStats {

//     total: number;
//     today: number;
//     upcoming: number;
//     completed: number;
//     cancelled: number;
// }
