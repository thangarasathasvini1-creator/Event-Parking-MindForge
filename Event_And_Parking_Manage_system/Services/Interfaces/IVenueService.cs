using Event_And_Parking_Manage_system.DTOs.Venues;

namespace Event_And_Parking_Manage_system.Services.Interfaces
{
    public interface IVenueService
    {
        Task<IEnumerable<VenueDto>> GetAllAsync();

        Task<VenueDto?> GetByIdAsync(int id);

        Task<IEnumerable<VenueDto>> GetAvailableAsync(
            DateTime eventDate,
            TimeSpan startTime,
            TimeSpan endTime);

        Task<VenueDto> CreateAsync(CreateVenueDto dto);

        Task<bool> UpdateAsync(int id, UpdateVenueDto dto);

        Task<bool> DeleteAsync(int id);
    }
}