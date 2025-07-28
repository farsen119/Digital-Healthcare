// WebSocket message interface
export interface WebSocketMessage {
  type: string;
  doctor_id?: number;
  is_available_for_consultation?: boolean;
  doctor_info?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    is_available_for_consultation: boolean;
    consultation_hours: string;
    specialization: string;
    hospital: string;
  };
}

// Doctor status interface
export interface DoctorStatus {
  doctor_id: number;
  is_available_for_consultation: boolean;
  doctor_info: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    is_available_for_consultation: boolean;
    consultation_hours: string;
    specialization: string;
    hospital: string;
  };
} 