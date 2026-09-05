using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Event_And_Parking_Manage_system.Repositories.Implementation
{
    public class PaymentRepository : IPaymentRepository
    {
        private readonly ApplicationDbContext _context;

        public PaymentRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Payment?> GetByIdAsync(int paymentId)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .FirstOrDefaultAsync(p => p.PaymentId == paymentId);
        }

        public async Task<Payment?> GetByBookingIdAsync(int bookingId)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .FirstOrDefaultAsync(p => p.BookingId == bookingId);
        }

        public async Task<List<Payment>> GetByCustomerIdAsync(int customerId)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .Where(p => p.Booking.CustomerId == customerId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task AddAsync(Payment payment)
        {
            await _context.Payments.AddAsync(payment);
        }

        public async Task UpdateAsync(Payment payment)
        {
            _context.Payments.Update(payment);
            await Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}