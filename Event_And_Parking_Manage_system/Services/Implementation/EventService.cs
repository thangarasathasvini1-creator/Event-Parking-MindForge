using Event_And_Parking_Manage_system.DTOs.Events;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Event_And_Parking_Manage_system.Validators;

namespace Event_And_Parking_Manage_system.Services.Implementation
{
    public class EventService : IEventService
    {
        private readonly IEventRepository _eventRepository;
        private readonly IVenueRepository _venueRepository;
        private readonly ICategoryRepository _categoryRepository;

        public EventService(
            IEventRepository eventRepository,
            IVenueRepository venueRepository,
            ICategoryRepository categoryRepository)
        {
            _eventRepository = eventRepository;
            _venueRepository = venueRepository;
            _categoryRepository = categoryRepository;
        }

        public async Task<IEnumerable<EventDto>> GetAllAsync()
        {
            var events = await _eventRepository.GetAllAsync();

            return events.Select(e => new EventDto
            {
                EventId = e.EventId,
                Name = e.Name,
                VenueId = e.VenueId,
                CategoryId = e.CategoryId,
                EventDate = e.EventDate,
                StartTime = e.StartTime,
                EndTime = e.EndTime,
                TicketPrice = e.TicketPrice,
                ParkingFee = e.ParkingFee,
                Capacity = e.Capacity
            });
        }

        public async Task<EventDetailsDto?> GetByIdAsync(int id)
        {
            var eventEntity = await _eventRepository.GetByIdAsync(id);

            if (eventEntity == null)
                return null;

            return new EventDetailsDto
            {
                EventId = eventEntity.EventId,
                Name = eventEntity.Name,
                VenueId = eventEntity.VenueId,
                VenueName = eventEntity.Venue?.Name ?? string.Empty,
                CategoryId = eventEntity.CategoryId,
                CategoryName = eventEntity.Category?.Name ?? string.Empty,
                EventDate = eventEntity.EventDate,
                StartTime = eventEntity.StartTime,
                EndTime = eventEntity.EndTime,
                TicketPrice = eventEntity.TicketPrice,
                ParkingFee = eventEntity.ParkingFee,
                Capacity = eventEntity.Capacity
            };
        }

        public async Task<IEnumerable<EventDto>> SearchAsync(
            string? name,
            int? categoryId,
            int? venueId,
            DateTime? eventDate)
        {
            var events = await _eventRepository.SearchAsync(
                name,
                categoryId,
                venueId,
                eventDate);

            return events.Select(e => new EventDto
            {
                EventId = e.EventId,
                Name = e.Name,
                VenueId = e.VenueId,
                CategoryId = e.CategoryId,
                EventDate = e.EventDate,
                StartTime = e.StartTime,
                EndTime = e.EndTime,
                TicketPrice = e.TicketPrice,
                ParkingFee = e.ParkingFee,
                Capacity = e.Capacity
            });
        }

        public async Task<EventDetailsDto> CreateAsync(CreateEventDto dto)
        {
            var validationError = EventValidator.Validate(dto);

            if (validationError != null)
                throw new ArgumentException(validationError);

            var venue = await _venueRepository.GetByIdAsync(dto.VenueId);

            if (venue == null)
                throw new InvalidOperationException("Venue not found.");

            var category =
                await _categoryRepository.GetByIdAsync(dto.CategoryId);

            if (category == null)
                throw new InvalidOperationException("Category not found.");

            if (dto.Capacity > venue.TotalCapacity)
                throw new InvalidOperationException(
                    "Event capacity cannot exceed venue capacity.");

            var hasOverlap = await _eventRepository.HasOverlapAsync(
                dto.VenueId,
                dto.EventDate,
                dto.StartTime,
                dto.EndTime);

            if (hasOverlap)
                throw new InvalidOperationException(
                    "Another event is already scheduled at this venue for the selected time.");

            var eventEntity = new Event
            {
                Name = dto.Name,
                VenueId = dto.VenueId,
                CategoryId = dto.CategoryId,
                EventDate = dto.EventDate,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                TicketPrice = dto.TicketPrice,
                ParkingFee = dto.ParkingFee,
                Capacity = dto.Capacity,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _eventRepository.AddAsync(eventEntity);
            await _eventRepository.SaveChangesAsync();

            return new EventDetailsDto
            {
                EventId = eventEntity.EventId,
                Name = eventEntity.Name,
                VenueId = eventEntity.VenueId,
                VenueName = venue.Name,
                CategoryId = eventEntity.CategoryId,
                CategoryName = category.Name,
                EventDate = eventEntity.EventDate,
                StartTime = eventEntity.StartTime,
                EndTime = eventEntity.EndTime,
                TicketPrice = eventEntity.TicketPrice,
                ParkingFee = eventEntity.ParkingFee,
                Capacity = eventEntity.Capacity
            };
        }

        public async Task<bool> UpdateAsync(
            int id,
            UpdateEventDto dto)
        {
            var validationError = EventValidator.Validate(dto);

            if (validationError != null)
                throw new ArgumentException(validationError);

            var eventEntity = await _eventRepository.GetByIdAsync(id);

            if (eventEntity == null)
                return false;

            var venue = await _venueRepository.GetByIdAsync(dto.VenueId);

            if (venue == null)
                throw new InvalidOperationException("Venue not found.");

            var category =
                await _categoryRepository.GetByIdAsync(dto.CategoryId);

            if (category == null)
                throw new InvalidOperationException("Category not found.");

            if (dto.Capacity > venue.TotalCapacity)
                throw new InvalidOperationException(
                    "Event capacity cannot exceed venue capacity.");

            var hasOverlap = await _eventRepository.HasOverlapAsync(
                dto.VenueId,
                dto.EventDate,
                dto.StartTime,
                dto.EndTime,
                id);

            if (hasOverlap)
                throw new InvalidOperationException(
                    "Another event is already scheduled at this venue for the selected time.");

            eventEntity.Name = dto.Name;
            eventEntity.VenueId = dto.VenueId;
            eventEntity.CategoryId = dto.CategoryId;
            eventEntity.EventDate = dto.EventDate;
            eventEntity.StartTime = dto.StartTime;
            eventEntity.EndTime = dto.EndTime;
            eventEntity.TicketPrice = dto.TicketPrice;
            eventEntity.ParkingFee = dto.ParkingFee;
            eventEntity.Capacity = dto.Capacity;
            eventEntity.UpdatedAt = DateTime.UtcNow;

            _eventRepository.Update(eventEntity);

            return await _eventRepository.SaveChangesAsync();
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var eventEntity = await _eventRepository.GetByIdAsync(id);

            if (eventEntity == null)
                return false;

            _eventRepository.Delete(eventEntity);

            return await _eventRepository.SaveChangesAsync();
        }
    }
}