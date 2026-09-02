using Event_And_Parking_Manage_system.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Event_And_Parking_Manage_system.Data.Configurations
{
    public class ParkingSlotConfiguration
        : IEntityTypeConfiguration<ParkingSlot>
    {
        public void Configure(EntityTypeBuilder<ParkingSlot> builder)
        {
            // Primary Key
            builder.HasKey(x => x.ParkingSlotId);

            // Slot Number
            builder.Property(x => x.SlotNumber)
                .IsRequired()
                .HasMaxLength(20);

            // Zone
            builder.Property(x => x.Zone)
                .HasMaxLength(50);

            // Parking Fee
            builder.Property(x => x.Fee)
                .HasPrecision(10, 2);

            // Status
            builder.Property(x => x.Status)
                .IsRequired();

            // Prevent duplicate slot numbers inside same Event
            builder.HasIndex(x => new
            {
                x.EventId,
                x.SlotNumber
            })
            .IsUnique();

            // Event -> ParkingSlots relationship
            builder.HasOne(x => x.Event)
                .WithMany(x => x.ParkingSlots)
                .HasForeignKey(x => x.EventId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}