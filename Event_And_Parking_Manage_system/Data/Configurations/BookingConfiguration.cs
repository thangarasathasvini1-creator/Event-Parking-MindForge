using Event_And_Parking_Manage_system.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Event_And_Parking_Manage_system.Data.Configurations
{
    public class BookingConfiguration : IEntityTypeConfiguration<Booking>
    {
        public void Configure(EntityTypeBuilder<Booking> builder)
        {
            builder.HasKey(x => x.BookingId);

            builder.Property(x => x.BookingNumber)
                .IsRequired()
                .HasMaxLength(50);

            builder.HasIndex(x => x.BookingNumber)
                .IsUnique();

            builder.Property(x => x.TotalAmount)
                .HasPrecision(10, 2);

            builder.HasIndex(x => x.CustomerId);

            builder.HasIndex(x => x.EventId);

            builder.HasOne(x => x.Customer)
                .WithMany(x => x.Bookings)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.Event)
                .WithMany(x => x.Bookings)
                .HasForeignKey(x => x.EventId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}