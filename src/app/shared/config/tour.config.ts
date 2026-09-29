import { RegistrationStatus, RequestStatus, TourStatus } from '../enums/tour.model';
import { UserRole } from '../enums/user.model';

export const ROLE_LABELS: Record<UserRole, string> = {
  TOURIST: 'Viajante',
  GUIDE: 'Guia de turismo',
  EVENT_PROMOTER: 'Promotor de eventos',
  ADMIN: 'Administração',
};

export const REGISTRATION_LABELS: Record<RegistrationStatus, string> = {
  OPEN: 'Aceitando pedidos',
  FULL: 'Esgotado',
  CLOSED: 'Pedidos encerrados',
};

export const TOUR_STATUS_LABELS: Record<TourStatus, string> = {
  SCHEDULED: 'Agendado',
  DONE: 'Realizado',
  CANCELED: 'Cancelado',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: 'Aguardando o guia',
  ACCEPTED: 'Confirmado',
  DENIED: 'Recusado',
};

export const UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

export const PRICE_FORMAT = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const DATE_TIME_FORMAT = 'dd/MM/yyyy, HH:mm';
export const ERROR_MESSAGE_TIMEOUT_MS = 5000;
