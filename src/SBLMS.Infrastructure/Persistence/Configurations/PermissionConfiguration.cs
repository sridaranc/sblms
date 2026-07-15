using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SBLMS.Domain.Entities;

namespace SBLMS.Infrastructure.Persistence.Configurations;

public class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Name).IsRequired().HasMaxLength(100);
        builder.Property(p => p.Resource).IsRequired().HasMaxLength(50);
        builder.Property(p => p.Action).IsRequired().HasMaxLength(50);
        builder.Property(p => p.Description).HasMaxLength(500);

        builder.HasIndex(p => new { p.Resource, p.Action }).IsUnique();
    }
}
