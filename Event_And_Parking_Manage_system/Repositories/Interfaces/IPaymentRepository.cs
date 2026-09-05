using Event_And_Parking_Manage_system.Models.Entities;

namespace Event_And_Parking_Manage_system.Repositories.Interfaces
{
    public interface IPaymentRepository
    {
        Task<Payment?> GetByIdAsync(int paymentId);

        Task<Payment?> GetByBookingIdAsync(int bookingId);

        Task<List<Payment>> GetByCustomerIdAsync(int customerId);

        Task AddAsync(Payment payment);

        Task UpdateAsync(Payment payment);

        Task SaveChangesAsync();
    }
}