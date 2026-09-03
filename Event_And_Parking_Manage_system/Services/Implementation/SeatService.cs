using Event_And_Parking_Manage_system.DTOs.Seats;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Models.Enums;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services.Interfaces;

namespace Event_And_Parking_Manage_system.Services.Implementation
{
    public class SeatService : ISeatService
    {
        private readonly ISeatRepository _seatRepository;

        public SeatService(ISeatRepository seatRepository)
        {
            _seatRepository = seatRepository;
        }

        // Get all seats for an event
        public async Task<IEnumerable<SeatDto>> GetSeatsByEventIdAsync(
            int eventId)
        {
            var seats = await _seatRepository
                .GetSeatsByEventIdAsync(eventId);

            return seats.Select(MapToDto);
        }

        // Get a single seat
        public async Task<SeatDto?> GetByIdAsync(int seatId)
        {
            var seat = await _seatRepository
                .GetByIdAsync(seatId);

            if (seat == null)
                return null;

            return MapToDto(seat);
        }

        // Create a new seat
        public async Task<SeatDto> CreateAsync(
            int eventId,
            CreateSeatDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.SeatNumber))
            {
                throw new ArgumentException(
                    "Seat number is required.");
            }

            var seatNumber = dto.SeatNumber.Trim();

            var exists = await _seatRepository
                .ExistsBySeatNumberAsync(
                    eventId,
                    seatNumber);

            if (exists)
            {
                throw new InvalidOperationException(
                    "Seat number already exists for this event.");
            }

            var seat = new Seat
            {
                EventId = eventId,
                SeatNumber = seatNumber,
                Row = dto.Row,
                Column = dto.Column,
                Status = SeatStatus.Available,
                CreatedAt = DateTime.UtcNow
            };

            await _seatRepository.AddAsync(seat);
            await _seatRepository.SaveChangesAsync();

            return MapToDto(seat);
        }

        // Update an existing seat
        public async Task<SeatDto?> UpdateAsync(
            int eventId,
            int seatId,
            UpdateSeatDto dto)
        {
            var seat = await _seatRepository
                .GetByIdAsync(seatId);

            if (seat == null || seat.EventId != eventId)
                return null;

            if (string.IsNullOrWhiteSpace(dto.SeatNumber))
            {
                throw new ArgumentException(
                    "Seat number is required.");
            }

            var seatNumber = dto.SeatNumber.Trim();

            var duplicate = await _seatRepository
                .ExistsBySeatNumberAsync(
                    eventId,
                    seatNumber);

            if (duplicate &&
                !string.Equals(
                    seat.SeatNumber,
                    seatNumber,
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Seat number already exists for this event.");
            }

            // Do not modify a confirmed/booked seat
            // into another state.
            if (seat.Status == SeatStatus.Booked &&
                dto.Status != SeatStatus.Booked)
            {
                throw new InvalidOperationException(
                    "A booked seat cannot be changed.");
            }

            seat.SeatNumber = seatNumber;
            seat.Row = dto.Row;
            seat.Column = dto.Column;
            seat.Status = dto.Status;
            seat.UpdatedAt = DateTime.UtcNow;

            await _seatRepository.UpdateAsync(seat);
            await _seatRepository.SaveChangesAsync();

            return MapToDto(seat);
        }

        // Delete a seat
        public async Task<bool> DeleteAsync(
            int eventId,
            int seatId)
        {
            var seat = await _seatRepository
                .GetByIdAsync(seatId);

            if (seat == null || seat.EventId != eventId)
                return false;

            if (seat.Status == SeatStatus.Booked ||
                seat.Status == SeatStatus.Held)
            {
                throw new InvalidOperationException(
                    "Held or booked seats cannot be deleted.");
            }

            await _seatRepository.DeleteAsync(seat);
            await _seatRepository.SaveChangesAsync();

            return true;
        }

        // Booking seat assignment will be integrated
        // with Member 4's Booking module.
        public Task<bool> AssignSeatsAsync(
            int bookingId,
            AssignSeatDto dto)
        {
            throw new NotImplementedException(
                "Seat assignment will be implemented during Booking integration.");
        }

        // Entity -> DTO mapping
        private static SeatDto MapToDto(Seat seat)
        {
            return new SeatDto
            {
                SeatId = seat.SeatId,
                EventId = seat.EventId,
                SeatNumber = seat.SeatNumber,
                Row = seat.Row,
                Column = seat.Column,
                Status = seat.Status
            };
        }
    }
}