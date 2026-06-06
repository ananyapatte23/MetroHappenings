/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Event {
  id: string;
  title: string;
  description: string;
  category: 'Music' | 'Food' | 'Art' | 'Tech' | 'Sports' | 'Comedy';
  date: string;
  time: string;
  locationName: string;
  city: 'Bengaluru' | 'Mumbai' | 'Delhi NCR' | 'Hyderabad';
  coordinates: { x: number; y: number }; // Percentage coordinate for the map canvas (0-100)
  price: number;
  capacity?: number;
  tags: string[];
  image: string;
  organizer: string;
  popularity: number; // 1-10 rating for ranking
  hasSeats?: boolean;
}

export interface UserPreferences {
  categories: string[];
  vibes: string[];
  maxPrice: number;
  distance: number; // in miles/kms
}

export interface TicketPurchase {
  id: string;
  eventId: string;
  seats: string[];
  quantity: number;
  totalPrice: number;
  purchaseDate: string;
  status: 'active' | 'cancelled';
  qrCode: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'alert' | 'ticket';
  timestamp: string;
  read: boolean;
  eventId?: string;
}
