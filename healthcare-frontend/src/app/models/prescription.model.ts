// This interface defines the structure of a Prescription object returned from the API
export interface Prescription {
  id: number;
  appointment: number;
  patient_name: string;
  details: string;
  created_at: string;
}

// This interface is used when creating a new prescription
export interface PrescriptionCreateDTO {
  appointment: number; // The ID of the appointment
  details: string;
}