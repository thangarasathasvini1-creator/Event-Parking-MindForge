using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.DTOs.Parking;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Models.Enums;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace Event_And_Parking_Manage_system.Services.Implementation
{
    public class ParkingService : IParkingService
    {
        private readonly IParkingRepository _parkingRepository;
        private readonly IBookingRepository _bookingRepository;
        private readonly ApplicationDbContext _context;

        public ParkingService(
            IParkingRepository parkingRepository,
            IBookingRepository bookingRepository,
            ApplicationDbContext context)
        {
            _parkingRepository = parkingRepository;
            _bookingRepository = bookingRepository;
            _context = context;
        }

        // ==========================================
        // Get all parking slots for an event
        // ==========================================

        public async Task<IEnumerable<ParkingSlotDto>>
            GetSlotsByEventIdAsync(int eventId)
        {
            var slots = await _parkingRepository
                .GetSlotsByEventIdAsync(eventId);

            return slots.Select(MapToDto);
        }

        // ==========================================
        // Get available parking slots by vehicle type
        // ==========================================

        public async Task<IEnumerable<ParkingSlotDto>>
            GetAvailableSlotsByEventAndVehicleTypeAsync(
                int eventId,
                VehicleType vehicleType)
        {
            if (!Enum.IsDefined(typeof(VehicleType), vehicleType))
            {
                throw new ArgumentException(
                    "Invalid vehicle type.");
            }

            var slots = await _parkingRepository
                .GetAvailableSlotsByEventAndVehicleTypeAsync(
                    eventId,
                    vehicleType);

            return slots.Select(MapToDto);
        }

        // ==========================================
        // Get a single parking slot
        // ==========================================

        public async Task<ParkingSlotDto?> GetByIdAsync(
            int parkingSlotId)
        {
            var slot = await _parkingRepository
                .GetByIdAsync(parkingSlotId);

            if (slot == null)
                return null;

            return MapToDto(slot);
        }

        // ==========================================
        // Create parking slot
        // ==========================================

        public async Task<ParkingSlotDto> CreateAsync(
            int eventId,
            CreateParkingSlotDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.SlotNumber))
            {
                throw new ArgumentException(
                    "Parking slot number is required.");
            }

            if (!Enum.IsDefined(
                    typeof(VehicleType),
                    dto.VehicleType))
            {
                throw new ArgumentException(
                    "Invalid vehicle type.");
            }

            if (dto.Fee < 0)
            {
                throw new ArgumentException(
                    "Parking fee cannot be negative.");
            }

            var slotNumber = dto.SlotNumber.Trim();

            var exists = await _parkingRepository
                .ExistsBySlotNumberAsync(
                    eventId,
                    slotNumber);

            if (exists)
            {
                throw new InvalidOperationException(
                    "Parking slot number already exists for this event.");
            }

            var slot = new ParkingSlot
            {
                EventId = eventId,
                SlotNumber = slotNumber,
                Zone = dto.Zone?.Trim(),

                // Vehicle type
                VehicleType = dto.VehicleType,

                // Parking fee
                Fee = dto.Fee,

                Status = ParkingSlotStatus.Available,
                CreatedAt = DateTime.UtcNow
            };

            await _parkingRepository.AddAsync(slot);
            await _parkingRepository.SaveChangesAsync();

            return MapToDto(slot);
        }

        // ==========================================
        // Update parking slot
        // ==========================================

        public async Task<ParkingSlotDto?> UpdateAsync(
            int eventId,
            int parkingSlotId,
            UpdateParkingSlotDto dto)
        {
            var slot = await _parkingRepository
                .GetByIdAsync(parkingSlotId);

            if (slot == null || slot.EventId != eventId)
                return null;

            if (string.IsNullOrWhiteSpace(dto.SlotNumber))
            {
                throw new ArgumentException(
                    "Parking slot number is required.");
            }

            if (!Enum.IsDefined(
                    typeof(VehicleType),
                    dto.VehicleType))
            {
                throw new ArgumentException(
                    "Invalid vehicle type.");
            }

            if (!Enum.IsDefined(
                    typeof(ParkingSlotStatus),
                    dto.Status))
            {
                throw new ArgumentException(
                    "Invalid parking slot status.");
            }

            if (dto.Fee < 0)
            {
                throw new ArgumentException(
                    "Parking fee cannot be negative.");
            }

            var slotNumber = dto.SlotNumber.Trim();

            var duplicate = await _parkingRepository
                .ExistsBySlotNumberAsync(
                    eventId,
                    slotNumber);

            if (duplicate &&
                !string.Equals(
                    slot.SlotNumber,
                    slotNumber,
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Parking slot number already exists for this event.");
            }

            // ------------------------------------------
            // Occupied slot protection
            // ------------------------------------------

            if (slot.Status == ParkingSlotStatus.Occupied &&
                dto.Status != ParkingSlotStatus.Occupied)
            {
                throw new InvalidOperationException(
                    "An occupied parking slot cannot be changed.");
            }

            // ------------------------------------------
            // Held/Occupied vehicle type protection
            // ------------------------------------------

            if ((slot.Status == ParkingSlotStatus.Held ||
                 slot.Status == ParkingSlotStatus.Occupied) &&
                slot.VehicleType != dto.VehicleType)
            {
                throw new InvalidOperationException(
                    "Vehicle type cannot be changed for a held or occupied parking slot.");
            }

            slot.SlotNumber = slotNumber;
            slot.Zone = dto.Zone?.Trim();

            // Vehicle type
            slot.VehicleType = dto.VehicleType;

            // Parking fee
            slot.Fee = dto.Fee;

            slot.Status = dto.Status;
            slot.UpdatedAt = DateTime.UtcNow;

            await _parkingRepository.UpdateAsync(slot);

            try
            {
                await _parkingRepository.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new InvalidOperationException(
                    "The parking slot was modified by another user. Please refresh and try again.");
            }

            return MapToDto(slot);
        }

        // ==========================================
        // Delete parking slot
        // ==========================================

        public async Task<bool> DeleteAsync(
            int eventId,
            int parkingSlotId)
        {
            var slot = await _parkingRepository
                .GetByIdAsync(parkingSlotId);

            if (slot == null || slot.EventId != eventId)
                return false;

            if (slot.Status == ParkingSlotStatus.Occupied ||
                slot.Status == ParkingSlotStatus.Held)
            {
                throw new InvalidOperationException(
                    "Held or occupied parking slots cannot be deleted.");
            }

            await _parkingRepository.DeleteAsync(slot);

            try
            {
                await _parkingRepository.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new InvalidOperationException(
                    "The parking slot was modified by another user. Please refresh and try again.");
            }

            return true;
        }

        // ==========================================
        // Assign parking slot to booking
        // ==========================================

        public async Task<bool> AssignParkingAsync(
            int bookingId,
            int customerId,
            AssignParkingDto dto)
        {
            if (dto == null ||
                dto.ParkingSlotId <= 0)
            {
                throw new ArgumentException(
                    "A valid parking slot is required.");
            }

            await using var transaction =
                await _context.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable);

            try
            {
                // -----------------------------------------
                // Check Booking
                // -----------------------------------------

                var booking = await _bookingRepository
                    .GetByIdAsync(bookingId);

                if (booking == null)
                {
                    throw new KeyNotFoundException(
                        "Booking not found.");
                }

                // -----------------------------------------
                // Check Booking Ownership
                // -----------------------------------------

                if (booking.CustomerId != customerId)
                {
                    throw new UnauthorizedAccessException(
                        "You are not authorized to modify this booking.");
                }

                // -----------------------------------------
                // Booking must be Pending
                // -----------------------------------------

                if (booking.Status != BookingStatus.Pending)
                {
                    throw new InvalidOperationException(
                        "Parking can only be assigned to a pending booking.");
                }

                // -----------------------------------------
                // One Booking = One Parking Reservation
                // -----------------------------------------

                if (booking.ParkingReservation != null)
                {
                    throw new InvalidOperationException(
                        "This booking already has a parking reservation.");
                }

                // -----------------------------------------
                // Get Parking Slot
                // -----------------------------------------

                var parkingSlot = await _parkingRepository
                    .GetByIdAsync(dto.ParkingSlotId);

                if (parkingSlot == null)
                {
                    throw new KeyNotFoundException(
                        "Parking slot not found.");
                }

                // -----------------------------------------
                // Validate Event Ownership
                // -----------------------------------------

                if (parkingSlot.EventId != booking.EventId)
                {
                    throw new InvalidOperationException(
                        "Parking slot does not belong to the booking event.");
                }

                // -----------------------------------------
                // Check Availability
                // -----------------------------------------

                if (parkingSlot.Status != ParkingSlotStatus.Available)
                {
                    throw new InvalidOperationException(
                        $"Parking slot {parkingSlot.SlotNumber} is not available.");
                }

                // -----------------------------------------
                // Create Parking Reservation
                // -----------------------------------------

                var parkingReservation = new ParkingReservation
                {
                    BookingId = booking.BookingId,
                    ParkingSlotId = parkingSlot.ParkingSlotId,

                    // Store parking fee at reservation time
                    ReservedFee = parkingSlot.Fee,

                    CreatedAt = DateTime.UtcNow
                };

                booking.ParkingReservation =
                    parkingReservation;

                // -----------------------------------------
                // Update Booking Total Amount
                // -----------------------------------------

                booking.TotalAmount += parkingSlot.Fee;
                booking.UpdatedAt = DateTime.UtcNow;

                // -----------------------------------------
                // Hold Parking Slot
                // -----------------------------------------

                parkingSlot.Status =
                    ParkingSlotStatus.Held;

                parkingSlot.UpdatedAt =
                    DateTime.UtcNow;

                // -----------------------------------------
                // Save Changes
                // -----------------------------------------

                await _parkingRepository
                    .UpdateAsync(parkingSlot);

                await _bookingRepository
                    .UpdateAsync(booking);

                await _context.SaveChangesAsync();

                // -----------------------------------------
                // Commit
                // -----------------------------------------

                await transaction.CommitAsync();

                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync();

                throw new InvalidOperationException(
                    "The parking slot was modified by another user. Please refresh the parking list and try again.");
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // ==========================================
        // Remove parking from booking
        // ==========================================

        public async Task<bool> RemoveParkingAsync(
            int bookingId,
            int customerId)
        {
            await using var transaction =
                await _context.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable);

            try
            {
                // -----------------------------------------
                // Get Booking
                // -----------------------------------------

                var booking = await _bookingRepository
                    .GetByIdAsync(bookingId);

                if (booking == null)
                {
                    throw new KeyNotFoundException(
                        "Booking not found.");
                }

                // -----------------------------------------
                // Check Booking Ownership
                // -----------------------------------------

                if (booking.CustomerId != customerId)
                {
                    throw new UnauthorizedAccessException(
                        "You are not authorized to modify this booking.");
                }

                // -----------------------------------------
                // Check Existing Reservation
                // -----------------------------------------

                if (booking.ParkingReservation == null)
                {
                    throw new InvalidOperationException(
                        "This booking does not have a parking reservation.");
                }

                // -----------------------------------------
                // Booking must be Pending
                // -----------------------------------------

                if (booking.Status != BookingStatus.Pending)
                {
                    throw new InvalidOperationException(
                        "Parking can only be removed from a pending booking.");
                }

                var parkingReservation =
                    booking.ParkingReservation;

                // -----------------------------------------
                // Get Parking Slot
                // -----------------------------------------

                var parkingSlot = await _parkingRepository
                    .GetByIdAsync(
                        parkingReservation.ParkingSlotId);

                if (parkingSlot != null)
                {
                    // -----------------------------------------
                    // Release Parking Slot
                    // -----------------------------------------

                    if (parkingSlot.Status ==
                        ParkingSlotStatus.Held)
                    {
                        parkingSlot.Status =
                            ParkingSlotStatus.Available;

                        parkingSlot.UpdatedAt =
                            DateTime.UtcNow;

                        await _parkingRepository
                            .UpdateAsync(parkingSlot);
                    }
                }

                // -----------------------------------------
                // Remove Reserved Parking Fee
                // -----------------------------------------

                booking.TotalAmount -=
                    parkingReservation.ReservedFee;

                if (booking.TotalAmount < 0)
                {
                    booking.TotalAmount = 0;
                }

                // -----------------------------------------
                // Remove Reservation
                // -----------------------------------------

                booking.ParkingReservation = null;
                booking.UpdatedAt = DateTime.UtcNow;

                await _bookingRepository
                    .UpdateAsync(booking);

                // -----------------------------------------
                // Save Changes
                // -----------------------------------------

                await _context.SaveChangesAsync();

                // -----------------------------------------
                // Commit
                // -----------------------------------------

                await transaction.CommitAsync();

                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync();

                throw new InvalidOperationException(
                    "The parking slot or booking was modified by another user. Please refresh and try again.");
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // ==========================================
        // Entity -> DTO mapping
        // ==========================================

        private static ParkingSlotDto MapToDto(
            ParkingSlot slot)
        {
            return new ParkingSlotDto
            {
                ParkingSlotId = slot.ParkingSlotId,
                EventId = slot.EventId,
                SlotNumber = slot.SlotNumber,
                Zone = slot.Zone,

                // Vehicle type
                VehicleType = slot.VehicleType,

                Fee = slot.Fee,
                Status = slot.Status
            };
        }
    }
}