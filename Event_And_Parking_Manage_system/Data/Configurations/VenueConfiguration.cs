using Event_And_Parking_Manage_system.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Event_And_Parking_Manage_system.Data.Configurations
{
    public class VenueConfiguration : IEntityTypeConfiguration<Venue>
    {
        public void Configure(EntityTypeBuilder<Venue> builder)
        {
            builder.HasKey(x => x.VenueId);

            builder.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(150);

            builder.Property(x => x.Address)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(x => x.TotalCapacity)
                .IsRequired();

            builder.Property(x => x.TotalParkingSlots)
                .IsRequired()
                .HasDefaultValue(0);

            builder.Property(x => x.CarCapacity)
                .IsRequired()
                .HasDefaultValue(0);

            builder.Property(x => x.BikeCapacity)
                .IsRequired()
                .HasDefaultValue(0);

            builder.Property(x => x.BusCapacity)
                .IsRequired()
                .HasDefaultValue(0);

            builder.Property(x => x.VanCapacity)
                .IsRequired()
                .HasDefaultValue(0);

            builder.HasMany(x => x.Events)
                .WithOne(x => x.Venue)
                .HasForeignKey(x => x.VenueId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}