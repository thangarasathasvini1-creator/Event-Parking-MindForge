using Event_And_Parking_Manage_system.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Event_And_Parking_Manage_system.Data.Configurations
{
    public class BookingSeatConfiguration : IEntityTypeConfiguration<BookingSeat>
    {
        public void Configure(EntityTypeBuilder<BookingSeat> builder)
        {
            builder.HasKey(x => x.BookingSeatId);

            builder.HasIndex(x => new { x.BookingId, x.SeatId })
                .IsUnique();

            builder.HasIndex(x => x.SeatId);

            builder.HasOne(x => x.Booking)
                .WithMany(x => x.BookingSeats)
                .HasForeignKey(x => x.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Seat)
                .WithMany(x => x.BookingSeats)
                .HasForeignKey(x => x.SeatId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}