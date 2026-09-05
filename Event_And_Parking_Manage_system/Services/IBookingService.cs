using Event_And_Parking_Manage_system.DTOs.Bookings;

namespace Event_And_Parking_Manage_system.Services.Interfaces
{
    public interface IBookingService
    {
        Task<BookingDto> CreateBookingAsync(
            int customerId,
            CreateBookingDto dto);

        Task<BookingDetailsDto?> GetBookingByIdAsync(
            int bookingId);

        Task<List<BookingHistoryDto>> GetCustomerBookingHistoryAsync(
            int customerId);

        Task<bool> CancelBookingAsync(
            int bookingId,
            int customerId,
            CancelBookingDto? dto);

        Task<List<BookingDto>> GetBookingsByEventAsync(
            int eventId);

        Task<int?> GetBookingCustomerIdAsync(
            int bookingId);
    }
}