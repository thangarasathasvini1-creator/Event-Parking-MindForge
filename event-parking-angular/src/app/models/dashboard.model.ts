export interface Dashboard {
  upcomingBookings: number;
  reservedParking: number;
  recentPayments: number;
  unreadNotifications: number;
}

export interface EventBookingSummary {
  eventId: number;
  eventName: string;
  bookingCount: number;
  seatsBooked: number;
  totalSeats: number;
  revenue: number;
  occupancyPercentage: number;
  parkingReservations: number;
  totalParkingSlots: number;
  parkingUtilizationPercentage: number;
}

export interface AdminDashboard {
  totalBookings: number;
  totalRevenue: number;
  totalSeatsBooked: number;
  totalParkingReservations: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  expiredBookings: number;
  eventSummaries: EventBookingSummary[];
  totalAvailableSeats: number;
  overallSeatOccupancyPercentage: number;
  totalAvailableParkingSlots: number;
  overallParkingUtilizationPercentage: number;
}