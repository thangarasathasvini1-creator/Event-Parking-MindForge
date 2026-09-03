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

        public VenueService(IVenueRepository venueRepository)
        {
            _venueRepository = venueRepository;
        }

        public async Task<IEnumerable<VenueDto>> GetAllAsync()
        {
            var venues = await _venueRepository.GetAllAsync();

            return venues.Select(v => new VenueDto
            {
                VenueId = v.VenueId,
                Name = v.Name,
                Address = v.Address,
                TotalCapacity = v.TotalCapacity
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
                TotalCapacity = venue.TotalCapacity
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
                TotalCapacity = v.TotalCapacity
            });
        }

        public async Task<VenueDto> CreateAsync(CreateVenueDto dto)
        {
            var validationError = VenueValidator.Validate(dto);

            if (validationError != null)
                throw new ArgumentException(validationError);

            var venue = new Venue
            {
                Name = dto.Name,
                Address = dto.Address,
                TotalCapacity = dto.TotalCapacity,
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
                TotalCapacity = venue.TotalCapacity
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

            venue.Name = dto.Name;
            venue.Address = dto.Address;
            venue.TotalCapacity = dto.TotalCapacity;
            venue.UpdatedAt = DateTime.UtcNow;

            _venueRepository.Update(venue);

            return await _venueRepository.SaveChangesAsync();
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var venue = await _venueRepository.GetByIdAsync(id);

            if (venue == null)
                return false;

            _venueRepository.Delete(venue);

            return await _venueRepository.SaveChangesAsync();
        }
    }
}