import { ChatResponse } from '../enums/chat.model';

export const CHAT_MOCK: ChatResponse = {
  activeGroups: [
    {
      chat_id: '1',
      name: 'Trilha Vali do Pati',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
      memberCount: 6,
      members: [
        { id: '1', name: 'Ana',    fotoUrl: 'https://i.pravatar.cc/40?img=1' },
        { id: '2', name: 'Lucas',  fotoUrl: 'https://i.pravatar.cc/40?img=2' },
        { id: '3', name: 'Maria',  fotoUrl: 'https://i.pravatar.cc/40?img=3' },
      ],
      nextEvent: 'Próxima saída: Amanhã,',
      nextEventTime: '08:00',
    },
    {
      chat_id: '2',
      name: 'Rota dos Vinhos – SC',
      imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80',
      memberCount: 12,
      members: [
        { id: '4', name: 'Pedro',  fotoUrl: 'https://i.pravatar.cc/40?img=4' },
        { id: '5', name: 'Julia',  fotoUrl: 'https://i.pravatar.cc/40?img=5' },
        { id: '6', name: 'Carlos', fotoUrl: 'https://i.pravatar.cc/40?img=6' },
      ],
      nextEvent: 'Evento em',
      nextEventTime: 'andamento',
    },
    {
      chat_id: '3',
      name: 'Chapada Diamantina',
      imageUrl: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=600&q=80',
      memberCount: 9,
      members: [
        { id: '7', name: 'Sofia',  fotoUrl: 'https://i.pravatar.cc/40?img=7' },
        { id: '8', name: 'Thiago', fotoUrl: 'https://i.pravatar.cc/40?img=8' },
        { id: '9', name: 'Camila', fotoUrl: 'https://i.pravatar.cc/40?img=9' },
      ],
      nextEvent: 'Próxima saída: Sáb,',
      nextEventTime: '07:30',
    },
  ],
};