using Event_And_Parking_Manage_system.DTOs.Parking;

namespace Event_And_Parking_Manage_system.Services.Interfaces
{
    public interface IParkingService
    {
        Task<IEnumerable<ParkingSlotDto>> GetSlotsByEventIdAsync(int eventId);
        Task<ParkingSlotDto?> GetByIdAsync(int parkingSlotId);
        Task<ParkingSlotDto> CreateAsync(int eventId,CreateParkingSlotDto dto);
        Task<ParkingSlotDto?> UpdateAsync(int eventId,int parkingSlotId,UpdateParkingSlotDto dto);
        Task<bool> DeleteAsync(int eventId,int parkingSlotId);
        Task<bool> AssignParkingAsync(int bookingId,AssignParkingDto dto);
        Task<bool> RemoveParkingAsync(int bookingId);
    }
}