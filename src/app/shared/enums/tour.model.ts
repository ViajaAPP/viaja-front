export type TourStatus = 'SCHEDULED' | 'DONE' | 'CANCELLED';
export type RegistrationStatus = 'OPEN' | 'FULL' | 'CLOSED';
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'DENIED';

export interface Address {
  cep: string;
  uf: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
}

export interface TourPayload extends Address {
  title: string;
  description: string;
  price: number;
  estimated_duration_minutes: number;
  meeting_point: string;
  photo: string;
}

export interface PublicUser {
  user_id: number;
  first_name: string;
  last_name: string;
  photo: string;
}

export interface TourInstance {
  id: number;
  tour_id: number;
  start_time: string;
  max_capacity: number;
  status: TourStatus;
  registration: RegistrationStatus;
  current_capacity?: number;
  my_request_status?: RequestStatus | null;
  open_for_requests?: boolean;
}

export interface TourInstancePayload {
  start_time?: string;
  max_capacity?: number;
  status?: TourStatus;
  registration?: RegistrationStatus;
}

export interface Tour {
  id: number;
  created_by_id: number;
  title: string;
  description: string;
  price: number;
  estimated_duration_minutes: number;
  meeting_point: string;
  photo: string;
  address_id: number;
  published: boolean;
  tour_instance?: TourInstance[];
}

export interface TourDetail extends Tour {
  address: Address | null;
  guide: PublicUser | null;
  instances: TourInstance[];
  is_owner: boolean;
  can_moderate: boolean;
  favorite: boolean;
}

export interface TourRequestItem {
  id: number;
  tour_instance_id: number;
  requester_id: number;
  status: RequestStatus;
  message: string | null;
  created_at: string;
  requester?: PublicUser | null;
  tour_instance?: TourInstance & { tour: Tour };
}
