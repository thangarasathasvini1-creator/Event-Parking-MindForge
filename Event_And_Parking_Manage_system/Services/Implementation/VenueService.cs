using Event_And_Parking_Manage_system.DTOs.Venues;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Event_And_Parking_Manage_system.Validators;

namespace Event_And_Parking_Manage_system.Services.Implementation
{
    public class VenueService : IVenueService
    {
        private readonly IVenueRepository _venueRepository;
        private readonly IEventRepository _eventRepository;

        public VenueService(
            IVenueRepository venueRepository,
            IEventRepository eventRepository)
        {
            _venueRepository = venueRepository;
            _eventRepository = eventRepository;
        }

        public async Task<IEnumerable<VenueDto>> GetAllAsync()
        {
            var venues = await _venueRepository.GetAllAsync();

            return venues.Select(v => new VenueDto
            {
                VenueId = v.VenueId,
                Name = v.Name,
                Address = v.Address,
                TotalCapacity = v.TotalCapacity,
                TotalParkingSlots = v.TotalParkingSlots > 0 ? v.TotalParkingSlots : (v.CarCapacity + v.BikeCapacity + v.BusCapacity + v.VanCapacity),
                CarCapacity = v.CarCapacity,
                BikeCapacity = v.BikeCapacity,
                BusCapacity = v.BusCapacity,
                VanCapacity = v.VanCapacity
            });
        }

        public async Task<VenueDto?> GetByIdAsync(int id)
        {
            var venue = await _venueRepository.GetByIdAsync(id);

            if (venue == null)
                return null;

            return new VenueDto
            {
                VenueId = venue.VenueId,
                Name = venue.Name,
                Address = venue.Address,
                TotalCapacity = venue.TotalCapacity,
                TotalParkingSlots = venue.TotalParkingSlots > 0 ? venue.TotalParkingSlots : (venue.CarCapacity + venue.BikeCapacity + venue.BusCapacity + venue.VanCapacity),
                CarCapacity = venue.CarCapacity,
                BikeCapacity = venue.BikeCapacity,
                BusCapacity = venue.BusCapacity,
                VanCapacity = venue.VanCapacity
            };
        }

        public async Task<IEnumerable<VenueDto>> GetAvailableAsync(
            DateTime eventDate,
            TimeSpan startTime,
            TimeSpan endTime)
        {
            var venues = await _venueRepository.GetAvailableAsync(
                eventDate,
                startTime,
                endTime);

            return venues.Select(v => new VenueDto
            {
                VenueId = v.VenueId,
                Name = v.Name,
                Address = v.Address,
                TotalCapacity = v.TotalCapacity,
                TotalParkingSlots = v.TotalParkingSlots > 0 ? v.TotalParkingSlots : (v.CarCapacity + v.BikeCapacity + v.BusCapacity + v.VanCapacity),
                CarCapacity = v.CarCapacity,
                BikeCapacity = v.BikeCapacity,
                BusCapacity = v.BusCapacity,
                VanCapacity = v.VanCapacity
            });
        }

        public async Task<VenueDto> CreateAsync(CreateVenueDto dto)
        {
            var validationError = VenueValidator.Validate(dto);

            if (validationError != null)
                throw new ArgumentException(validationError);

            var totalParking = (dto.CarCapacity + dto.BikeCapacity + dto.BusCapacity + dto.VanCapacity);
            if (totalParking == 0 && dto.TotalParkingSlots > 0)
            {
                totalParking = dto.TotalParkingSlots;
            }

            var venue = new Venue
            {
                Name = dto.Name,
                Address = dto.Address,
                TotalCapacity = dto.TotalCapacity,
                TotalParkingSlots = totalParking,
                CarCapacity = dto.CarCapacity,
                BikeCapacity = dto.BikeCapacity,
                BusCapacity = dto.BusCapacity,
                VanCapacity = dto.VanCapacity,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _venueRepository.AddAsync(venue);
            await _venueRepository.SaveChangesAsync();

            return new VenueDto
            {
                VenueId = venue.VenueId,
                Name = venue.Name,
                Address = venue.Address,
                TotalCapacity = venue.TotalCapacity,
                TotalParkingSlots = venue.TotalParkingSlots,
                CarCapacity = venue.CarCapacity,
                BikeCapacity = venue.BikeCapacity,
                BusCapacity = venue.BusCapacity,
                VanCapacity = venue.VanCapacity
            };
        }

        public async Task<bool> UpdateAsync(int id, UpdateVenueDto dto)
        {
            var validationError = VenueValidator.Validate(dto);

            if (validationError != null)
                throw new ArgumentException(validationError);

            var venue = await _venueRepository.GetByIdAsync(id);

            if (venue == null)
                return false;

            var scheduledEvents = await _eventRepository.SearchAsync(null, null, id, null);
            if (scheduledEvents.Any())
            {
                var maxEventCapacity = scheduledEvents.Max(e => e.Capacity);
                if (dto.TotalCapacity < maxEventCapacity)
                {
                    throw new InvalidOperationException(
                        $"Venue capacity cannot be set lower than the capacity of scheduled events ({maxEventCapacity}).");
                }
            }

            var totalParking = (dto.CarCapacity + dto.BikeCapacity + dto.BusCapacity + dto.VanCapacity);
            if (totalParking == 0 && dto.TotalParkingSlots > 0)
            {
                totalParking = dto.TotalParkingSlots;
            }

            venue.Name = dto.Name;
            venue.Address = dto.Address;
            venue.TotalCapacity = dto.TotalCapacity;
            venue.TotalParkingSlots = totalParking;
            venue.CarCapacity = dto.CarCapacity;
            venue.BikeCapacity = dto.BikeCapacity;
            venue.BusCapacity = dto.BusCapacity;
            venue.VanCapacity = dto.VanCapacity;
            venue.UpdatedAt = DateTime.UtcNow;

            _venueRepository.Update(venue);

            return await _venueRepository.SaveChangesAsync();
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var venue = await _venueRepository.GetByIdAsync(id);

            if (venue == null)
                return false;

            var scheduledEvents = await _eventRepository.SearchAsync(null, null, id, null);
            var now = DateTime.UtcNow;
            var upcomingEvents = scheduledEvents.Where(e =>
                e.EventDate.Date.Add(e.StartTime) >= now).ToList();

            if (upcomingEvents.Any())
            {
                throw new InvalidOperationException(
                    "Venue cannot be deleted because upcoming events exist for this venue.");
            }

            _venueRepository.Delete(venue);

            return await _venueRepository.SaveChangesAsync();
        }
    }
}