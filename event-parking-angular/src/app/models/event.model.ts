export interface Event {
  eventId: number;
  name: string;
  eventName?: string;

  venueId: number;
  venueName?: string;
  categoryId: number;
  categoryName?: string;

  description?: string;
  parkingAvailable?: boolean;

  eventDate: string;
  startTime: string;
  endTime: string;

  ticketPrice: number;
  parkingFee: number;
  capacity: number;
}