export interface ParkingSlot {
  parkingSlotId: number;
  eventId: number;
  slotNumber: string;
  zone?: string | null;
  vehicleType: string;
  fee: number;
  status: string;
}

export interface CreateParkingSlotDto {
  slotNumber: string;
  zone?: string | null;
  vehicleType: string;
  fee: number;
}

export interface UpdateParkingSlotDto {
  slotNumber: string;
  zone?: string | null;
  vehicleType: string;
  fee: number;
  status: string;
}

