export interface Seat {
  seatId: number;
  eventId: number;
  seatNumber: string;
  row?: string | number | null;
  column?: string | number | null;
  status: string;
}

export interface CreateSeatDto {
  seatNumber: string;
  row?: string | null;
  column?: string | null;
}

export interface UpdateSeatDto {
  seatNumber: string;
  row?: string | null;
  column?: string | null;
  status: string;
}