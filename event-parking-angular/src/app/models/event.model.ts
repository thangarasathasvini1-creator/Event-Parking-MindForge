export interface Event {
  eventId: number;
  eventName: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;

  venueId: number;
  venueName: string;

  categoryId: number;
  categoryName: string;

  capacity: number;
  ticketPrice: number;

  parkingAvailable: boolean;
}