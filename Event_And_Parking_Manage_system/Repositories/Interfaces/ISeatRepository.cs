using Event_And_Parking_Manage_system.Models.Entities;

namespace Event_And_Parking_Manage_system.Repositories.Interfaces
{
    public interface ISeatRepository
    {
        Task<IEnumerable<Seat>> GetSeatsByEventIdAsync(int eventId);
        Task<Seat?> GetByIdAsync(int seatId);
        Task<IEnumerable<Seat>> GetByIdsAsync(IEnumerable<int> seatIds);
        Task<bool> ExistsAsync(int seatId);
        Task<bool> ExistsBySeatNumberAsync(int eventId,string seatNumber);
        Task AddAsync(Seat seat);
        Task UpdateAsync(Seat seat);
        Task DeleteAsync(Seat seat);
        Task SaveChangesAsync();
    }
}