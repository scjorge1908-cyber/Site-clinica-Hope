export interface Room {
  id: string;
  name: string;
  type: 'standard' | 'premium' | 'auditorium' | 'executivo_luxo';
  pricePerHour: number;
  rating: number;
  size: string;
  capacity: string;
  location: string;
  description: string;
  images: string[];
  features: string[];
  imageSettings?: {
    zoom?: number;
    posX?: number;
    posY?: number;
    rotate?: number;
    brightness?: number;
    contrast?: number;
  };
}

export interface Booking {
  id: string;
  roomName: string;
  roomType: string;
  pricePerHour: number;
  date: string; // e.g. "Segunda, 13 de Junho"
  dateKey: string; // e.g. "2026-06-13"
  timeSlots: string[]; // e.g. ["07:00", "09:00"]
  totalValue: number;
  status: 'Pendente' | 'Confirmado' | 'Cancelado';
  createdAt: string;
  professionalName?: string;
  professionalId?: string;
}

export interface TableOfPrices {
  standard: number;
  premium: number;
  auditorium: number;
  executivo_luxo: number;
}

export interface AdminSettings {
  appScriptId: string;
  publicKey: string;
  webhookSecret: string;
  isProductionMode: boolean;
  tableOfPrices: TableOfPrices;
  heroTitle: string;
  heroDescription: string;
  galleryImages: string[];
  showGallery?: boolean;
  revenueTotalMonth: number;
  newBookingsCount: number;
  occupancyRate: number;
  heroImage?: string;
  landingRoomsHeading?: string;
  landingRoomsSub?: string;
  bookingRoomsHeading?: string;
  trustTitle?: string;
  trustDesc?: string;
  plan1Title?: string;
  plan1Subtitle?: string;
  plan1Desc?: string;
  plan1PriceSuffix?: string;
  plan1Price?: string;
  plan2Title?: string;
  plan2Subtitle?: string;
  plan2Desc?: string;
  plan2PriceSuffix?: string;
  plan2Price?: string;
}

export interface ProfessionalProfile {
  name: string;
  email: string;
  registerNumber: string;
  phone?: string;
  profilePhoto?: { name: string; size: number; previewUrl?: string };
  idDocument?: { name: string; size: number };
  professionalDocument?: { name: string; size: number };
  documents: Array<{ name: string; size: number }>;
  acceptedTerms?: boolean;
  acceptedTermsDate?: string;
  approvalStatus?: 'Pendente' | 'Aprovado' | 'Rejeitado';
}
