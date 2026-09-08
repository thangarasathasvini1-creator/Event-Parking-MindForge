using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Models.Enums;

namespace Event_And_Parking_Manage_system.Repositories.Interfaces
{
    public interface IParkingRepository
    {
        Task<IEnumerable<ParkingSlot>> GetSlotsByEventIdAsync(
            int eventId);

        Task<IEnumerable<ParkingSlot>>
            GetAvailableSlotsByEventAndVehicleTypeAsync(
                int eventId,
                VehicleType vehicleType);

        Task<ParkingSlot?> GetByIdAsync(
            int parkingSlotId);

        Task<IEnumerable<ParkingSlot>> GetByIdsAsync(
            IEnumerable<int> parkingSlotIds);

        Task<bool> ExistsAsync(
            int parkingSlotId);

        Task<bool> ExistsBySlotNumberAsync(
            int eventId,
            string slotNumber);

        Task AddAsync(
            ParkingSlot parkingSlot);

        Task UpdateAsync(
            ParkingSlot parkingSlot);

        Task DeleteAsync(
            ParkingSlot parkingSlot);

        Task SaveChangesAsync();
    }
}