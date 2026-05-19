export interface ChatMember {
  id: string;
  name: string;
  fotoUrl: string;
}

export interface ActiveGroup {
  chat_id: string;
  name: string;
  imageUrl: string;
  memberCount: number;
  members: ChatMember[];
  nextEvent: string;
  nextEventTime: string;
}

export interface ChatResponse {
  activeGroups: ActiveGroup[];
}