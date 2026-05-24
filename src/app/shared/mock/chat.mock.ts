import { ChatMessage, ChatResponse } from '../enums/chat.model';

const TOUR_PHOTO = 'https://s2-g1.glbimg.com/yIzYsLe7tJStPzIFJ9cY4na9SfM=/0x0:1600x900/984x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_59edd422c0c84a879bd37670ae4f538a/internal_photos/bs/2023/g/I/o4AQFdQYWE6NJdJWJXQA/foto-unisantos-final.jpeg';

export const CHAT_MOCK: ChatResponse = {
  direct_conversations: [],
  tour_list: [
    {
      chat_id: 1,
      chat_open: true,
      members: [
        {
          first_name: 'Sophia',
          last_name: 'Verardo de Araújo',
          photo: 'https://plus.unsplash.com/premium_photo-1669138512601-e3f00b684edc?q=80&w=685&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          role: 'TOURIST',
          user_id: 6,
        },
        {
          first_name: 'Sophia',
          last_name: 'Verardo de Araújo',
          photo: 'https://plus.unsplash.com/premium_photo-1669138512601-e3f00b684edc?q=80&w=685&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          role: 'GUIDE',
          user_id: 7,
        },
      ],
      tour_date: 'Saída amanhã às 13:00',
      tour_id: 3,
      tour_instance_id: 4,
      tour_photo: TOUR_PHOTO,
      tour_title: 'Tour Teste',
    },
  ],

  activeGroups: [
    {
      chat_id: 1,
      name: 'Tour Teste',
      imageUrl: TOUR_PHOTO,
      memberCount: 2,
      members: [
        { id: '6', name: 'Sophia Verardo de Araújo', fotoUrl: 'https://plus.unsplash.com/premium_photo-1669138512601-e3f00b684edc?q=80&w=685' },
        { id: '7', name: 'Sophia Verardo de Araújo', fotoUrl: 'https://plus.unsplash.com/premium_photo-1669138512601-e3f00b684edc?q=80&w=685' },
      ],
      nextEvent: 'Saída amanhã às 13:00',
      nextEventTime: '',
      chat_open: true,
      tour_date: 'Saída amanhã às 13:00',
      tour_id: 3,
      tour_instance_id: 4,
      tour_photo: TOUR_PHOTO,
      tour_title: 'Tour Teste',
    },
  ],
};

export const CHAT_MESSAGE_MOCK: ChatMessage = {
  chat_name: 'Tour Teste',
  messages_list: [
    {
      id: 1,
      chat_id: 1,
      user_id: 6,
      text: 'Olá! Este é um mock de mensagem.',
      created_at: '2026-05-24T12:00:00Z',
    },
    {
      id: 2,
      chat_id: 1,
      user_id: 7,
      text: 'Olá! Resposta de guia mock.',
      created_at: '2026-05-24T12:01:00Z',
    },
  ],
  socket_connection_url: 'ws://localhost/ws?user_id=6&chats=1',
  user_list: [
    {
      first_name: 'Sophia',
      last_name: 'Verardo de Araújo',
      photo: 'https://plus.unsplash.com/premium_photo-1669138512601-e3f00b684edc?q=80&w=685',
      user_id: 6,
    },
    {
      first_name: 'Sophia',
      last_name: 'Verardo de Araújo',
      photo: 'https://plus.unsplash.com/premium_photo-1669138512601-e3f00b684edc?q=80&w=685',
      user_id: 7,
    },
  ],
};