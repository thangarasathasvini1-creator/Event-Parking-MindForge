using Event_And_Parking_Manage_system.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Event_And_Parking_Manage_system.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // DbSets
        public DbSet<Customer> Customers => Set<Customer>();

        public DbSet<Venue> Venues => Set<Venue>();

        public DbSet<EventCategory> EventCategories => Set<EventCategory>();

        public DbSet<Event> Events => Set<Event>();

        public DbSet<Seat> Seats => Set<Seat>();

        public DbSet<ParkingSlot> ParkingSlots => Set<ParkingSlot>();

        public DbSet<Booking> Bookings => Set<Booking>();

        public DbSet<BookingSeat> BookingSeats => Set<BookingSeat>();

        public DbSet<ParkingReservation> ParkingReservations
            => Set<ParkingReservation>();

        public DbSet<Payment> Payments => Set<Payment>();

        public DbSet<Notification> Notifications => Set<Notification>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Apply all entity configurations automatically
            modelBuilder.ApplyConfigurationsFromAssembly(
                typeof(ApplicationDbContext).Assembly);
        }
    }
}