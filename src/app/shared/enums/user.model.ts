export type UserRole = 'TOURIST' | 'GUIDE' | 'EVENT_PROMOTER' | 'ADMIN';

export interface LoginResponse {
  token: string;
  user_id: number;
  role: UserRole;
}

export interface Perfil {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  photo: string;
  role: UserRole;
  bio?: string | null;
}
