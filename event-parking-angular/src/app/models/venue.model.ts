export interface Venue {
  venueId: number;
  name: string;
  address: string;
  totalCapacity: number;
  totalParkingSlots?: number;
  carCapacity?: number;
  bikeCapacity?: number;
  busCapacity?: number;
  vanCapacity?: number;
}