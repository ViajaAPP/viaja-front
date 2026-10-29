export type UserRole = 'TOURIST' | 'GUIDE' | 'EVENT_PROMOTER' | 'ADMIN';

export interface LoginResponse {
  token: string;
  user_id: number;
  role: UserRole;
  extra_roles?: UserRole[];
}

export interface PedidoDePapel {
  id: number;
  created_at: string;
  user_id: number;
  role: UserRole;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  review_note: string | null;
  user?: { first_name: string; last_name: string; photo: string | null; role: UserRole } | null;
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
