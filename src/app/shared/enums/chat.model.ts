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

export interface ChatMessage { 
  chat_name: string;
  // lista de mensagens retornada pela API
  messages_list: MensagensList[];
  // url completa para handshake do websocket
  socket_connection_url?: string;
  // lista de participantes
  user_list: ChatUser[];
}

export interface MensagensList {
	user_id: number;
	message_id: number;
	content: string;
	send_date: string;
}

export interface UserChatList{
    user_name: string, 
    user_id: number, 
    role: string
}