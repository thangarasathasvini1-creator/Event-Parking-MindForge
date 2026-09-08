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
        private readonly IBookingRepository _bookingRepository;
        private readonly ISeatRepository _seatRepository;
        private readonly INotificationService _notificationService;
        private readonly ILogger<EventService> _logger;

        public EventService(
            IEventRepository eventRepository,
            IVenueRepository venueRepository,
            ICategoryRepository categoryRepository,
            IBookingRepository bookingRepository,
            ISeatRepository seatRepository,
            INotificationService notificationService,
            ILogger<EventService> logger)
        {
            _eventRepository = eventRepository;
            _venueRepository = venueRepository;
            _categoryRepository = categoryRepository;
            _bookingRepository = bookingRepository;
            _seatRepository = seatRepository;
            _notificationService = notificationService;
            _logger = logger;
        }

        // =========================================================
        // GET ALL EVENTS
        // =========================================================

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

        // =========================================================
        // GET EVENT BY ID
        // =========================================================

        public async Task<EventDetailsDto?> GetByIdAsync(int id)
        {
            var eventEntity =
                await _eventRepository.GetByIdAsync(id);

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

        // =========================================================
        // SEARCH EVENTS
        // =========================================================

        public async Task<IEnumerable<EventDto>> SearchAsync(
            string? name,
            int? categoryId,
            int? venueId,
            DateTime? eventDate)
        {
            var events =
                await _eventRepository.SearchAsync(
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

        // =========================================================
        // CREATE EVENT
        // =========================================================

        public async Task<EventDetailsDto> CreateAsync(
            CreateEventDto dto)
        {
            var validationError =
                EventValidator.Validate(dto);

            if (validationError != null)
                throw new ArgumentException(validationError);

            // -----------------------------------------
            // Check Venue
            // -----------------------------------------

            var venue =
                await _venueRepository.GetByIdAsync(
                    dto.VenueId);

            if (venue == null)
                throw new InvalidOperationException(
                    "Venue not found.");

            // -----------------------------------------
            // Check Category
            // -----------------------------------------

            var category =
                await _categoryRepository.GetByIdAsync(
                    dto.CategoryId);

            if (category == null)
                throw new InvalidOperationException(
                    "Category not found.");

            // -----------------------------------------
            // Validate Capacity
            // -----------------------------------------

            if (dto.Capacity > venue.TotalCapacity)
            {
                throw new InvalidOperationException(
                    "Event capacity cannot exceed venue capacity.");
            }

            // -----------------------------------------
            // Check Venue Schedule Overlap
            // -----------------------------------------

            var hasOverlap =
                await _eventRepository.HasOverlapAsync(
                    dto.VenueId,
                    dto.EventDate,
                    dto.StartTime,
                    dto.EndTime);

            if (hasOverlap)
            {
                throw new InvalidOperationException(
                    "Another event is already scheduled at this venue for the selected time.");
            }

            // -----------------------------------------
            // Create Event
            // -----------------------------------------

            var now = DateTime.UtcNow;

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
                CreatedAt = now,
                UpdatedAt = now
            };

            await _eventRepository.AddAsync(eventEntity);

            await _eventRepository.SaveChangesAsync();

            // -----------------------------------------
            // Return Created Event
            // -----------------------------------------

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

        // =========================================================
        // UPDATE EVENT
        // =========================================================

        public async Task<bool> UpdateAsync(
            int id,
            UpdateEventDto dto)
        {
            var validationError =
                EventValidator.Validate(dto);

            if (validationError != null)
                throw new ArgumentException(validationError);

            // -----------------------------------------
            // Get Existing Event
            // -----------------------------------------

            var eventEntity =
                await _eventRepository.GetByIdAsync(id);

            if (eventEntity == null)
                return false;

            // -----------------------------------------
            // Check Venue
            // -----------------------------------------

            var venue =
                await _venueRepository.GetByIdAsync(
                    dto.VenueId);

            if (venue == null)
            {
                throw new InvalidOperationException(
                    "Venue not found.");
            }

            // -----------------------------------------
            // Check Category
            // -----------------------------------------

            var category =
                await _categoryRepository.GetByIdAsync(
                    dto.CategoryId);

            if (category == null)
            {
                throw new InvalidOperationException(
                    "Category not found.");
            }

            // -----------------------------------------
            // Validate Capacity
            // -----------------------------------------

            if (dto.Capacity > venue.TotalCapacity)
            {
                throw new InvalidOperationException(
                    "Event capacity cannot exceed venue capacity.");
            }

            var existingSeats = await _seatRepository.GetSeatsByEventIdAsync(id);
            var existingSeatsCount = existingSeats.Count();
            if (dto.Capacity < existingSeatsCount)
            {
                throw new InvalidOperationException(
                    $"Event capacity cannot be lower than existing seats count ({existingSeatsCount}).");
            }

            var existingBookings = await _bookingRepository.GetByEventIdAsync(id);
            var activeBookings = existingBookings.Where(b => b.Status == Models.Enums.BookingStatus.Confirmed || b.Status == Models.Enums.BookingStatus.Pending).ToList();
            if (dto.Capacity < activeBookings.Count)
            {
                throw new InvalidOperationException(
                    $"Event capacity cannot be lower than active bookings count ({activeBookings.Count}).");
            }

            // -----------------------------------------
            // Check Venue Schedule Overlap
            // -----------------------------------------

            var hasOverlap =
                await _eventRepository.HasOverlapAsync(
                    dto.VenueId,
                    dto.EventDate,
                    dto.StartTime,
                    dto.EndTime,
                    id);

            if (hasOverlap)
            {
                throw new InvalidOperationException(
                    "Another event is already scheduled at this venue for the selected time.");
            }

            // -----------------------------------------
            // Update Event
            // -----------------------------------------

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

            var updated =
                await _eventRepository.SaveChangesAsync();

            if (!updated)
                return false;

            // =====================================================
            // EVENT UPDATED NOTIFICATIONS
            // =====================================================

            var customerIds =
                await _bookingRepository
                    .GetCustomerIdsByEventIdAsync(id);

            foreach (var customerId in customerIds)
            {
                try
                {
                    await _notificationService
                        .CreateNotificationAsync(
                            customerId,
                            "EventUpdated",
                            $"The event '{eventEntity.Name}' has been updated. Please check the latest event details.");
                }
                catch (Exception ex)
                {
                    // Event update already succeeded.
                    // Notification failure must not undo
                    // the successful event update.
                    _logger.LogError(
                        ex,
                        "Event {EventId} was updated successfully, but notification could not be created for customer {CustomerId}.",
                        id,
                        customerId);
                }
            }

            return true;
        }

        // =========================================================
        // DELETE EVENT
        // =========================================================

        public async Task<bool> DeleteAsync(int id)
        {
            var eventEntity =
                await _eventRepository.GetByIdAsync(id);

            if (eventEntity == null)
                return false;

            _eventRepository.Delete(eventEntity);

            return await _eventRepository.SaveChangesAsync();
        }
    }
}