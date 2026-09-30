export interface User {
  name: string;
  fotoUser: string;
}

export interface Category {
  id: string;
  label: string;
  active?: boolean;
}

export interface Activity {
  id: string;
  title: string;
  guideFoto: string;
  guide: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  tag?: string;
  tagType?: 'recommended' | 'popular' | 'new' | 'nearby';
  distance_km?: number;
  city?: string;
  uf?: string;
}

export interface HomeResponse {
  user: User;
  greeting: string;
  titulo: string;
  categories: Category[];
  popularActivities: Activity[];
}