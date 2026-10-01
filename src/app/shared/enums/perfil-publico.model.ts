import { UserRole } from './user.model';
import { Evento } from './evento.model';
import { PasseioEncontrado } from '../services/busca/busca.service';

export interface AvaliacaoRecebida {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  tour_id: number;
  tour_title: string | null;
  author_id: number;
  author: string;
  author_photo: string | null;
}

export interface AvaliacaoEscrita {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  tour_id: number;
  tour_title: string | null;
  tour_photo: string | null;
}

export interface CidadeVisitada {
  city: string;
  uf: string | null;
  count: number;
}

export interface NumerosDoPerfil {
  traveler: { trips: number; events_attended: number; reviews_written: number; cities: CidadeVisitada[] } | null;
  guide: { travelers_guided: number; tours_done: number; tours_active: number } | null;
  promoter: { events_done: number; people_attended: number; events_upcoming: number } | null;
}

export interface PerfilPublico {
  user_id: number;
  first_name: string;
  last_name: string;
  photo: string | null;
  role: UserRole | null;
  bio: string | null;
  member_since: string;
  is_me: boolean;
  rating: { average: number; count: number } | null;
  response_time: { label: string } | null;
  tours: PasseioEncontrado[];
  events: Evento[];
  reviews_received: AvaliacaoRecebida[];
  reviews_written: AvaliacaoEscrita[];
  stats: NumerosDoPerfil;
}
