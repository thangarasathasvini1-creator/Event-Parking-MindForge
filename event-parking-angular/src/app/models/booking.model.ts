export interface CreateBookingRequest {
  eventId: number;
  seatIds: number[];
  parkingSlotId: number | null;
}

export interface Booking {
  bookingId: number;
  bookingNumber: string;
  customerId?: number;
  eventId: number;
  eventName?: string;
  status: string;
  totalAmount: number;
  holdExpiresAt?: string | null;
  createdAt: string;
  seatCount?: number;
  seatIds?: number[];
  parkingSlotId?: number | null;
  paymentStatus?: string | null;
}
