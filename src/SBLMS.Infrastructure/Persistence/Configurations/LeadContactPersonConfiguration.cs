using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SBLMS.Domain.Entities;

namespace SBLMS.Infrastructure.Persistence.Configurations;

public class LeadContactPersonConfiguration : IEntityTypeConfiguration<LeadContactPerson>
{
    public void Configure(EntityTypeBuilder<LeadContactPerson> builder)
    {
        builder.HasKey(cp => cp.Id);
        builder.Property(cp => cp.LeadId).IsRequired();
        builder.Property(cp => cp.Name).HasMaxLength(200);
        builder.Property(cp => cp.Designation).HasMaxLength(100);
        builder.Property(cp => cp.Phone).HasMaxLength(20);
        builder.Property(cp => cp.Mobile).HasMaxLength(20);
        builder.Property(cp => cp.Email).HasMaxLength(256);

        builder.HasIndex(cp => new { cp.LeadId, cp.SortOrder }).IsUnique();

        builder.HasOne(cp => cp.Lead)
            .WithMany(l => l.ContactPersons)
            .HasForeignKey(cp => cp.LeadId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
