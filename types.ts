
import type { Timestamp, GeoPoint } from 'firebase/firestore';

export type ActiveTab = 'home' | 'map' | 'notifications' | 'settings';

export type Theme = 'dark' | 'light' | 'pink' | 'green' | 'navy' | 'purple';

export interface Reservation {
  id: string;
  userId: string;
  parkingLotId: string;
  parkingLotName: string;
  slotId: string;
  startTime: Timestamp;
  endTime: Timestamp;
  durationHours: number;
  amountPaid: number;
  status: 'active' | 'completed' | 'expired';
}

export interface User {
  uid: string; // Changed from id to uid to match Firebase Auth
  username: string;
  email: string;
  carPlate: string;
  ecocashNumber: string;
}

// This represents the user object combined with their reservations for use in components
export interface UserWithReservations extends User {
    reservations: Reservation[];
}

export interface ParkingSlot {
  id: string;
  isOccupied: boolean;
  reservedUntil?: Timestamp;
  coords?: {
    lat: number;
    lng: number;
  };
}

export interface ParkingLot {
  id: string;
  name: string;
  address: string;
  location: GeoPoint; // Changed to Firestore GeoPoint
  slots: ParkingSlot[];
  hourlyRate: number;
}

export interface Notification {
  id:string;
  userId: string;
  type: 'RESERVED' | 'TIME_EXPIRED' | 'PAYMENT_CONFIRMED' | 'GENERIC';
  message: string;
  isRead: boolean;
  timestamp: Timestamp; // Changed to Firestore Timestamp
  data?: {
    carPlate?: string;
    amountPaid?: number;
    hoursLeft?: number;
  };
}

export interface WeeklyReservations {
  day: string;
  reservations: number;
}

export interface RevenueData {
  [period: string]: {
    usd: number;
    zwl: number;
  };
}
