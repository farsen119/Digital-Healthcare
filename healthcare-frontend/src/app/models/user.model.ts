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
}
