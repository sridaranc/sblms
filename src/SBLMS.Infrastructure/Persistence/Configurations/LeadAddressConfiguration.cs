using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SBLMS.Domain.Entities;

namespace SBLMS.Infrastructure.Persistence.Configurations;

public class LeadAddressConfiguration : IEntityTypeConfiguration<LeadAddress>
{
    public void Configure(EntityTypeBuilder<LeadAddress> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.LeadId).IsRequired();
        builder.Property(a => a.Label).IsRequired();
        builder.Property(a => a.AddressLine1).HasMaxLength(500);
        builder.Property(a => a.AddressLine2).HasMaxLength(500);
        builder.Property(a => a.City).HasMaxLength(100);
        builder.Property(a => a.State).HasMaxLength(100);
        builder.Property(a => a.PostalCode).HasMaxLength(20);
        builder.Property(a => a.Country).HasMaxLength(100);

        builder.HasIndex(a => new { a.LeadId, a.Label }).IsUnique();

        builder.HasOne(a => a.Lead)
            .WithMany(l => l.Addresses)
            .HasForeignKey(a => a.LeadId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
