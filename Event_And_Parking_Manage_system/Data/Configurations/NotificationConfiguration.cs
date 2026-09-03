using Event_And_Parking_Manage_system.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Event_And_Parking_Manage_system.Data.Configurations
{
    public class NotificationConfiguration
        : IEntityTypeConfiguration<Notification>
    {
        public void Configure(EntityTypeBuilder<Notification> builder)
        {
            builder.HasKey(x => x.NotificationId);

            builder.Property(x => x.Type)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(x => x.Message)
                .IsRequired()
                .HasMaxLength(500);

            builder.HasIndex(x => x.CustomerId);

            builder.HasIndex(x => new { x.CustomerId, x.IsRead });

            builder.HasOne(x => x.Customer)
                .WithMany(x => x.Notifications)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}