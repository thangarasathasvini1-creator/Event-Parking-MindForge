using Event_And_Parking_Manage_system.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Event_And_Parking_Manage_system.Data.Configurations
{
    public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
    {
        public void Configure(EntityTypeBuilder<Payment> builder)
        {
            builder.HasKey(x => x.PaymentId);

            builder.Property(x => x.Amount)
                .HasPrecision(10, 2);

            builder.Property(x => x.PaymentMethod)
                .HasMaxLength(50);

            builder.Property(x => x.TransactionReference)
                .HasMaxLength(100);

            builder.HasIndex(x => x.BookingId)
                .IsUnique();

            builder.HasIndex(x => x.TransactionReference)
                .IsUnique();

            builder.HasOne(x => x.Booking)
                .WithOne(x => x.Payment)
                .HasForeignKey<Payment>(x => x.BookingId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}