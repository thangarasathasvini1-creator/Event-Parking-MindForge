using Event_And_Parking_Manage_system.Models.Entities;

namespace Event_And_Parking_Manage_system.Repositories.Interfaces
{
    public interface IBookingRepository
    {
        Task<Booking?> GetByIdAsync(int bookingId);

        Task<Booking?> GetByBookingNumberAsync(string bookingNumber);

        Task<List<Booking>> GetByCustomerIdAsync(int customerId);

        Task<List<Booking>> GetByEventIdAsync(int eventId);

        Task AddAsync(Booking booking);

        Task UpdateAsync(Booking booking);

        Task<bool> HasActiveSeatBookingAsync(int seatId, int eventId);

        Task<bool> HasActiveParkingReservationAsync(int parkingSlotId, int eventId);

        Task SaveChangesAsync();
    }
}