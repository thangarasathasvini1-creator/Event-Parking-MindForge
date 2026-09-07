using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.DTOs.Seats;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Models.Enums;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace Event_And_Parking_Manage_system.Services.Implementation
{
    public class SeatService : ISeatService
    {
        private readonly ISeatRepository _seatRepository;
        private readonly IBookingRepository _bookingRepository;
        private readonly IEventRepository _eventRepository;
        private readonly ApplicationDbContext _context;

        public SeatService(
            ISeatRepository seatRepository,
            IBookingRepository bookingRepository,
            IEventRepository eventRepository,
            ApplicationDbContext context)
        {
            _seatRepository = seatRepository;
            _bookingRepository = bookingRepository;
            _eventRepository = eventRepository;
            _context = context;
        }

        // Get all seats for an event
        public async Task<IEnumerable<SeatDto>> GetSeatsByEventIdAsync(
            int eventId)
        {
            var eventEntity = await _eventRepository
                .GetByIdAsync(eventId);

            if (eventEntity == null)
            {
                throw new KeyNotFoundException(
                    "Event not found.");
            }

            var seats = await _seatRepository
                .GetSeatsByEventIdAsync(eventId);

            return seats.Select(MapToDto);
        }

        // Get a single seat
        public async Task<SeatDto?> GetByIdAsync(
            int seatId)
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
            var eventEntity = await _eventRepository
                .GetByIdAsync(eventId);

            if (eventEntity == null)
            {
                throw new KeyNotFoundException(
                    "Event not found.");
            }

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
            var eventEntity = await _eventRepository
                .GetByIdAsync(eventId);

            if (eventEntity == null)
            {
                throw new KeyNotFoundException(
                    "Event not found.");
            }

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

            try
            {
                await _seatRepository.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new InvalidOperationException(
                    "The seat was modified by another user. Please refresh and try again.");
            }

            return MapToDto(seat);
        }

        // Delete a seat
        public async Task<bool> DeleteAsync(
            int eventId,
            int seatId)
        {
            var eventEntity = await _eventRepository
                .GetByIdAsync(eventId);

            if (eventEntity == null)
            {
                throw new KeyNotFoundException(
                    "Event not found.");
            }

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

            try
            {
                await _seatRepository.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new InvalidOperationException(
                    "The seat was modified by another user. Please refresh and try again.");
            }

            return true;
        }

        // Booking seat assignment
        public async Task<bool> AssignSeatsAsync(
            int bookingId,
            int customerId,
            AssignSeatDto dto)
        {
            if (dto == null ||
                dto.SeatIds == null ||
                dto.SeatIds.Count == 0)
            {
                throw new ArgumentException(
                    "At least one seat must be selected.");
            }

            var booking = await _bookingRepository
                .GetByIdAsync(bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException(
                    "Booking not found.");
            }

            // Customer can only assign seats to their own booking.
            if (booking.CustomerId != customerId)
            {
                throw new UnauthorizedAccessException(
                    "You are not authorized to modify this booking.");
            }

            if (booking.Status != BookingStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Seats can only be assigned to a pending booking.");
            }

            var seatIds = dto.SeatIds
                .Distinct()
                .ToList();

            if (seatIds.Count != dto.SeatIds.Count)
            {
                throw new InvalidOperationException(
                    "Duplicate seat IDs are not allowed.");
            }

            await using var transaction =
                await _context.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable);

            try
            {
                var seats = (await _seatRepository
                    .GetByIdsAsync(seatIds))
                    .ToList();

                if (seats.Count != seatIds.Count)
                {
                    throw new KeyNotFoundException(
                        "One or more seats were not found.");
                }

                foreach (var seat in seats)
                {
                    if (seat.EventId != booking.EventId)
                    {
                        throw new InvalidOperationException(
                            $"Seat {seat.SeatNumber} does not belong to the booking event.");
                    }

                    if (seat.Status != SeatStatus.Available)
                    {
                        throw new InvalidOperationException(
                            $"Seat {seat.SeatNumber} is not available.");
                    }
                }

                var now = DateTime.UtcNow;

                foreach (var seat in seats)
                {
                    seat.Status = SeatStatus.Held;
                    seat.UpdatedAt = now;

                    await _seatRepository.UpdateAsync(seat);
                }

                await _seatRepository.SaveChangesAsync();

                await transaction.CommitAsync();

                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync();

                throw new InvalidOperationException(
                    "One or more selected seats were modified by another user. Please refresh the seat list and try again.");
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
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