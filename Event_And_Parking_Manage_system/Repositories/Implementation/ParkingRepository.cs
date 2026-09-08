using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Models.Enums;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Event_And_Parking_Manage_system.Repositories
{
    public class ParkingRepository : IParkingRepository
    {
        private readonly ApplicationDbContext _context;

        public ParkingRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ParkingSlot>> GetSlotsByEventIdAsync(
            int eventId)
        {
            return await _context.ParkingSlots
                .Where(x => x.EventId == eventId)
                .OrderBy(x => x.SlotNumber)
                .ToListAsync();
        }

        public async Task<IEnumerable<ParkingSlot>>
            GetAvailableSlotsByEventAndVehicleTypeAsync(
                int eventId,
                VehicleType vehicleType)
        {
            return await _context.ParkingSlots
                .Where(x =>
                    x.EventId == eventId &&
                    x.VehicleType == vehicleType &&
                    x.Status == ParkingSlotStatus.Available)
                .OrderBy(x => x.SlotNumber)
                .ToListAsync();
        }

        public async Task<ParkingSlot?> GetByIdAsync(int parkingSlotId)
        {
            return await _context.ParkingSlots
                .FirstOrDefaultAsync(x => x.ParkingSlotId == parkingSlotId);
        }

        public async Task<IEnumerable<ParkingSlot>> GetByIdsAsync(
            IEnumerable<int> parkingSlotIds)
        {
            return await _context.ParkingSlots
                .Where(x => parkingSlotIds.Contains(x.ParkingSlotId))
                .ToListAsync();
        }

        public async Task<bool> ExistsAsync(int parkingSlotId)
        {
            return await _context.ParkingSlots
                .AnyAsync(x => x.ParkingSlotId == parkingSlotId);
        }

        public async Task<bool> ExistsBySlotNumberAsync(
            int eventId,
            string slotNumber)
        {
            return await _context.ParkingSlots
                .AnyAsync(x =>
                    x.EventId == eventId &&
                    x.SlotNumber == slotNumber);
        }

        public async Task AddAsync(ParkingSlot parkingSlot)
        {
            await _context.ParkingSlots.AddAsync(parkingSlot);
        }

        public async Task UpdateAsync(ParkingSlot parkingSlot)
        {
            _context.ParkingSlots.Update(parkingSlot);

            await Task.CompletedTask;
        }

        public async Task DeleteAsync(ParkingSlot parkingSlot)
        {
            _context.ParkingSlots.Remove(parkingSlot);

            await Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}