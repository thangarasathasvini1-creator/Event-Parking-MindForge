using Event_And_Parking_Manage_system.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Event_And_Parking_Manage_system.Data.Configurations
{
    public class ParkingReservationConfiguration
        : IEntityTypeConfiguration<ParkingReservation>
    {
        public void Configure(EntityTypeBuilder<ParkingReservation> builder)
        {
            builder.HasKey(x => x.ParkingReservationId);

            builder.HasIndex(x => x.BookingId)
                .IsUnique();

            builder.HasIndex(x => x.ParkingSlotId);

            builder.Property(x => x.ReservedFee)
                .HasPrecision(10, 2);

            builder.HasOne(x => x.Booking)
                .WithOne(x => x.ParkingReservation)
                .HasForeignKey<ParkingReservation>(x => x.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.ParkingSlot)
                .WithMany(x => x.ParkingReservations)
                .HasForeignKey(x => x.ParkingSlotId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}