using Event_And_Parking_Manage_system.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Event_And_Parking_Manage_system.Data.Configurations
{
    public class SeatConfiguration : IEntityTypeConfiguration<Seat>
    {
        public void Configure(EntityTypeBuilder<Seat> builder)
        {
            // Primary Key
            builder.HasKey(x => x.SeatId);

            // Seat Number
            builder.Property(x => x.SeatNumber)
                .IsRequired()
                .HasMaxLength(20);

            // Row
            builder.Property(x => x.Row)
                .HasMaxLength(10);

            // Column
            builder.Property(x => x.Column)
                .HasMaxLength(10);

            // Status
            builder.Property(x => x.Status)
                .IsRequired();

            // Prevent duplicate seat numbers inside same Event
            builder.HasIndex(x => new
            {
                x.EventId,
                x.SeatNumber
            })
            .IsUnique();

            // Event -> Seats relationship
            builder.HasOne(x => x.Event)
                .WithMany(x => x.Seats)
                .HasForeignKey(x => x.EventId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}