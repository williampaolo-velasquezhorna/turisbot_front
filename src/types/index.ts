export interface User {
  id?: string;
  nombres: string;
  apellidos: string;
  email: string;
  username: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description?: string;
}

export interface Package {
  _id: string;
  name: string;
  description: string;
  destination: string;
  duration: string;
  price: string;
  category?: string[];
  priceAmount?: number;
  currency?: string;
  groupSize?: number;
  status?: string;
  highlights?: string[];
  included?: string[];
  notIncluded?: string[];
  bestSeason?: string;
  difficulty?: string;
  ageRequirement?: string;
  images?: string[];
  itinerary?: ItineraryDay[];
  departurePoint?: string;
  serviceType?: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PackageFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface DestinationCountry {
  _id: string;
  name: string;
  flag: string;
  continent: string;
  enabled: boolean;
}

export interface DestinationRegion {
  _id: string;
  name: string;
  country: string;
  provinces: string[];
}

export interface ServiceType {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface PackageFormData {
  name: string;
  description: string;
  destination: string;
  duration: string;
  price: string;
  priceAmount: number;
  currency: string;
  bestSeason: string;
  difficulty: string;
  ageRequirement: string;
  groupSize: number | null;
  category: string[];
  highlights: string[];
  included: string[];
  notIncluded: string[];
  images: string[];
  itinerary: ItineraryDay[];
  departurePoint: string;
  serviceType: string;
}
