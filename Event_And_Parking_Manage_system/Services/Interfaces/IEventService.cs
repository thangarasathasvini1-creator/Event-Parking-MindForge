using Event_And_Parking_Manage_system.DTOs.Events;

namespace Event_And_Parking_Manage_system.Services.Interfaces
{
    public interface IEventService
    {
        Task<IEnumerable<EventDto>> GetAllAsync();

        Task<EventDetailsDto?> GetByIdAsync(int id);

        Task<IEnumerable<EventDto>> SearchAsync(
            string? name,
            int? categoryId,
            int? venueId,
            DateTime? eventDate);

        Task<EventDetailsDto> CreateAsync(CreateEventDto dto);

        Task<bool> UpdateAsync(int id, UpdateEventDto dto);

        Task<bool> DeleteAsync(int id);
    }
}