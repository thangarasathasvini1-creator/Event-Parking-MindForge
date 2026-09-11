export interface Event {
  eventId: number;
  name: string;

  venueId: number;
  categoryId: number;

  eventDate: string;
  startTime: string;
  endTime: string;

  ticketPrice: number;
  parkingFee: number;
  capacity: number;
}