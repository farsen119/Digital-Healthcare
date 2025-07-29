export type UserRole = 'admin' | 'doctor' | 'patient';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
  phone?: string;
  city?: string;
  age?: number;
  gender?: string;
  photo?: string;
  // Doctor-specific fields
  specialization?: string;
  license_number?: string;
  experience_years?: number;
  qualification?: string;
  hospital?: string;
  consultation_fee?: number;
  bio?: string;
  available_days?: string;
  consultation_hours?: string;
  is_live?: boolean;
  is_available_for_consultation?: boolean;
  // Patient-specific fields
  date_of_birth?: string;
  address?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  medical_history?: string;
  current_medications?: string;
  allergies?: string;
  height?: number;
  weight?: number;
  occupation?: string;
  marital_status?: string;
  bmi?: number;
}
