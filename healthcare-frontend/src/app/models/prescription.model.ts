// This interface defines the structure of a Prescription object
export interface Prescription {
  id: number;
  appointment: number;
  patient_name: string;
  doctor_name?: string;
  appointment_date?: string;
  details: string;
  admin_notes?: string;
  created_at: string;
}

// This interface is used when creating a new prescription
export interface PrescriptionCreateDTO {
  appointment: number;
  details: string;
}

// This interface is used when an admin updates their notes
export interface AdminNotesUpdateDTO {
    admin_notes: string;
}

// This interface is used when a doctor updates the prescription details
export interface PrescriptionUpdateDTO {
  details: string;
}