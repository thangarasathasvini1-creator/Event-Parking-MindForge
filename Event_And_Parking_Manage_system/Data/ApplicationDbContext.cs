using Event_And_Parking_Manage_system.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Event_And_Parking_Manage_system.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        { 

        }

        //dbset for Customer entity
        public DbSet<Customer> Customers => Set<Customer>();

        public DbSet<Venue> Venues => Set<Venue>();
        public DbSet<EventCategory> EventCategories => Set<EventCategory>();
        public DbSet<Event> Events => Set<Event>();
        public DbSet<Seat> Seats => Set<Seat>();
        public DbSet<ParkingSlot> ParkingSlots => Set<ParkingSlot>();


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Apply all configurations from the current assembly
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        }

        

    }
}
