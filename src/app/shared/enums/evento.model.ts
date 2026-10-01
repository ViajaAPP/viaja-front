import { Address } from './tour.model';

export type EventoStatus = 'IN_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'CANCELLED' | 'DONE';

export interface Evento {
  id: number;
  title: string;
  photo: string | null;
  photo_credit: string | null;
  start_time: string;
  end_time: string | null;
  price: number;
  capacity: number | null;
  place_name: string | null;
  status: EventoStatus;
  city: string | null;
  uf: string | null;
  distance_km: number | null;
  going_count: number;
  going: boolean;
  organizer: { user_id: number | null; first_name: string | null; photo: string | null };
  is_owner: boolean;
  review_note?: string | null;
  description?: string;
  address?: (Address & { id?: number }) | null;
  going_people?: { first_name: string | null; photo: string | null }[];
}

export interface EventoPayload extends Address {
  title: string;
  description: string;
  start_time: string;
  end_time: string | null;
  place_name: string;
  price: number;
  capacity: number | null;
  photo: string;
  photo_credit: string | null;
}

export interface FiltrosDeEventos {
  lat?: number;
  lon?: number;
  raio?: number;
  gratuito?: boolean;
  limite?: number;
  ordem?: 'data' | 'perto' | 'populares';
}

export const EVENTO_STATUS_LABELS: Record<EventoStatus, string> = {
  IN_REVIEW: 'Em análise',
  PUBLISHED: 'No ar',
  REJECTED: 'Precisa de ajustes',
  CANCELLED: 'Cancelado',
  DONE: 'Aconteceu',
};
