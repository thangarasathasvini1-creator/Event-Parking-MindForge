using Event_And_Parking_Manage_system.DTOs.Parking;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Models.Enums;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services.Interfaces;

namespace Event_And_Parking_Manage_system.Services.Implementation
{
    public class ParkingService : IParkingService
    {
        private readonly IParkingRepository _parkingRepository;

        public ParkingService(IParkingRepository parkingRepository)
        {
            _parkingRepository = parkingRepository;
        }

        // Get all parking slots for an event
        public async Task<IEnumerable<ParkingSlotDto>>
            GetSlotsByEventIdAsync(int eventId)
        {
            var slots = await _parkingRepository
                .GetSlotsByEventIdAsync(eventId);

            return slots.Select(MapToDto);
        }

        // Get a single parking slot
        public async Task<ParkingSlotDto?> GetByIdAsync(
            int parkingSlotId)
        {
            var slot = await _parkingRepository
                .GetByIdAsync(parkingSlotId);

            if (slot == null)
                return null;

            return MapToDto(slot);
        }

        // Create parking slot
        public async Task<ParkingSlotDto> CreateAsync(
            int eventId,
            CreateParkingSlotDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.SlotNumber))
            {
                throw new ArgumentException(
                    "Parking slot number is required.");
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
                Zone = dto.Zone,
                Fee = dto.Fee,
                Status = ParkingSlotStatus.Available,
                CreatedAt = DateTime.UtcNow
            };

            await _parkingRepository.AddAsync(slot);
            await _parkingRepository.SaveChangesAsync();

            return MapToDto(slot);
        }

        // Update parking slot
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

            // Do not modify an occupied slot
            // into another state.
            if (slot.Status == ParkingSlotStatus.Occupied &&
                dto.Status != ParkingSlotStatus.Occupied)
            {
                throw new InvalidOperationException(
                    "An occupied parking slot cannot be changed.");
            }

            slot.SlotNumber = slotNumber;
            slot.Zone = dto.Zone;
            slot.Fee = dto.Fee;
            slot.Status = dto.Status;
            slot.UpdatedAt = DateTime.UtcNow;

            await _parkingRepository.UpdateAsync(slot);
            await _parkingRepository.SaveChangesAsync();

            return MapToDto(slot);
        }

        // Delete parking slot
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
            await _parkingRepository.SaveChangesAsync();

            return true;
        }

        // Booking parking assignment will be integrated
        // with Member 4's Booking module.
        public Task<bool> AssignParkingAsync(
            int bookingId,
            AssignParkingDto dto)
        {
            throw new NotImplementedException(
                "Parking assignment will be implemented during Booking integration.");
        }

        // Parking removal will be integrated
        // with Member 4's Booking module.
        public Task<bool> RemoveParkingAsync(int bookingId)
        {
            throw new NotImplementedException(
                "Parking removal will be implemented during Booking integration.");
        }

        // Entity -> DTO mapping
        private static ParkingSlotDto MapToDto(
            ParkingSlot slot)
        {
            return new ParkingSlotDto
            {
                ParkingSlotId = slot.ParkingSlotId,
                EventId = slot.EventId,
                SlotNumber = slot.SlotNumber,
                Zone = slot.Zone,
                Fee = slot.Fee,
                Status = slot.Status
            };
        }
    }
}