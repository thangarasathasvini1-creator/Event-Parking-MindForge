using Event_And_Parking_Manage_system.DTOs.Seats;

namespace Event_And_Parking_Manage_system.Services.Interfaces
{
    public interface ISeatService
    {
        Task<IEnumerable<SeatDto>> GetSeatsByEventIdAsync(int eventId);
        Task<SeatDto?> GetByIdAsync(int seatId);
        Task<SeatDto> CreateAsync(int eventId,CreateSeatDto dto);
        Task<SeatDto?> UpdateAsync(int eventId,int seatId,UpdateSeatDto dto);
        Task<bool> DeleteAsync(int eventId,int seatId);
        Task<bool> AssignSeatsAsync(int bookingId,AssignSeatDto dto);
    }
}