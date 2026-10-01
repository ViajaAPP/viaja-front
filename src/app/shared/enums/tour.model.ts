export type TourStatus = 'SCHEDULED' | 'DONE' | 'CANCELLED';
export type RegistrationStatus = 'OPEN' | 'FULL' | 'CLOSED';
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'DENIED' | 'EXPIRED' | 'CANCELLED';

export interface Address {
  cep: string;
  uf: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  lat?: number | null;
  lon?: number | null;
}

export interface TourPayload extends Address {
  title: string;
  description: string;
  price: number;
  estimated_duration_minutes: number;
  meeting_point: string;
  photo: string;
  photo_credit?: string | null;
  instant_booking?: boolean;
  min_participants?: number;
}

export interface TourPhoto {
  id: number;
  url: string;
  credit: string | null;
  position: number;
}

export interface TourReview {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  author_id: number;
  author: string;
  author_photo: string | null;
}

export interface RatingSummary {
  average: number | null;
  count: number;
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
  photo_credit?: string | null;
  address_id: number;
  published: boolean;
  instant_booking?: boolean;
  min_participants?: number;
  tour_instance?: TourInstance[];
}

export interface TourDetail extends Tour {
  address: Address | null;
  guide: PublicUser | null;
  instances: TourInstance[];
  is_owner: boolean;
  can_moderate: boolean;
  favorite: boolean;
  photos: TourPhoto[];
  reviews: TourReview[];
  rating: RatingSummary;
  review_instance_id: number | null;
  guide_response: { hours: number; label: string; samples: number } | null;
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
