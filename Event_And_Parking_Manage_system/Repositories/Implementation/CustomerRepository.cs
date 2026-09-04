using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Models.Enums;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Event_And_Parking_Manage_system.Repositories
{
    public class CustomerRepository : ICustomerRepository
    {
        private readonly ApplicationDbContext _context;

        public CustomerRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Customer?> GetByIdAsync(int customerId)
        {
            return await _context.Customers
                .FirstOrDefaultAsync(c => c.CustomerId == customerId);
        }

        public async Task<Customer?> GetByEmailAsync(string email)
        {
            return await _context.Customers
                .FirstOrDefaultAsync(c => c.Email == email);
        }

        public async Task<IEnumerable<Customer>> GetAllAsync(string? search = null)
        {
            var query = _context.Customers.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(c =>
                    c.Name.Contains(search) ||
                    c.Email.Contains(search) ||
                    c.Phone.Contains(search));
            }

            return await query
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task AddAsync(Customer customer)
        {
            await _context.Customers.AddAsync(customer);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Customer customer)
        {
            _context.Customers.Update(customer);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Customer customer)
        {
            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ExistsByEmailAsync(string email)
        {
            return await _context.Customers
                .AnyAsync(c => c.Email == email);
        }

        public async Task<bool> HasActiveFutureBookingsAsync(int customerId)
        {
            return await _context.Bookings
                .Include(b => b.Event)
                .AnyAsync(b =>
                    b.CustomerId == customerId &&
                    (b.Status == BookingStatus.Pending ||
                     b.Status == BookingStatus.Confirmed) &&
                    b.Event.EventDate >= DateTime.UtcNow.Date);
        }

        public async Task<int> GetUpcomingBookingsCountAsync(int customerId)
        {
            return await _context.Bookings
                .Include(b => b.Event)
                .CountAsync(b =>
                    b.CustomerId == customerId &&
                    (b.Status == BookingStatus.Pending ||
                     b.Status == BookingStatus.Confirmed) &&
                    b.Event.EventDate >= DateTime.UtcNow.Date);
        }

        public async Task<int> GetReservedParkingCountAsync(int customerId)
        {
            return await _context.ParkingReservations
                .Include(p => p.Booking)
                .CountAsync(p =>
                    p.Booking.CustomerId == customerId);
        }

        public async Task<int> GetRecentPaymentsCountAsync(int customerId)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .CountAsync(p =>
                    p.Booking.CustomerId == customerId);
        }

        public async Task<int> GetUnreadNotificationsCountAsync(int customerId)
        {
            return await _context.Notifications
                .CountAsync(n =>
                    n.CustomerId == customerId &&
                    !n.IsRead);
        }
    }
}