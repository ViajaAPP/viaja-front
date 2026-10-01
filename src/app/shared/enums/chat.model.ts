export interface ChatMember {
  id?: string;
  name?: string;
  fotoUrl?: string;
  user_id?: number;
  first_name?: string;
  last_name?: string;
  photo?: string;
  role?: string;
}

export interface ActiveGroup {
  chat_id: number;
  name?: string;
  imageUrl?: string;
  memberCount?: number;
  members?: ChatMember[];
  nextEvent?: string;
  nextEventTime?: string;
  chat_open?: boolean;
  tour_date?: string;
  tour_id?: number;
  tour_instance_id?: number;
  tour_photo?: string;
  tour_title?: string;
  event_id?: number;
}

export interface ChatResponse {
  activeGroups?: ActiveGroup[];
  direct_conversations?: any[];
  tour_list?: ActiveGroup[];
}

export interface ChatUser {
  first_name?: string;
  last_name?: string;
  photo?: string;
  user_id?: number;
}

export interface MapaDoGrupo {
  opens_at: string;
  closes_at: string;
  open: boolean;
  meeting_point: string | null;
  lat: number | null;
  lon: number | null;
}

export interface LocalizacaoNoGrupo {
  user_id: number;
  lat: number;
  lon: number;
  at: number;
}

export interface ChatMessage {
  chat_name: string;
  messages_list: MensagensList[];
  socket_connection_url?: string;
  user_list: ChatUser[];
  is_event?: boolean;
  map?: MapaDoGrupo | null;
}

export interface MensagensList {
  id: number;
  chat_id?: number;
  user_id: number;
  text: string;
  created_at: string;
  estado?: 'enviando' | 'falhou';
}

export interface UserChatList {
  user_name: string;
  user_id: number;
  role: string;
}