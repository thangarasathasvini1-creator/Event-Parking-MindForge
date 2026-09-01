using Event_And_Parking_Manage_system.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Event_And_Parking_Manage_system.Data.Configurations
{
    public class EventConfiguration : IEntityTypeConfiguration<Event>
    {
        public void Configure(EntityTypeBuilder<Event> builder)
        {
            builder.HasKey(x => x.EventId);

            builder.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(x => x.TicketPrice)
                .HasPrecision(10, 2);

            builder.Property(x => x.ParkingFee)
                .HasPrecision(10, 2);

            builder.Property(x => x.Capacity)
                .IsRequired();

            builder.HasIndex(x => x.VenueId);

            builder.HasIndex(x => x.CategoryId);

            builder.HasIndex(x => x.EventDate);

            builder.HasOne(x => x.Venue)
                .WithMany(x => x.Events)
                .HasForeignKey(x => x.VenueId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.Category)
                .WithMany(x => x.Events)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}