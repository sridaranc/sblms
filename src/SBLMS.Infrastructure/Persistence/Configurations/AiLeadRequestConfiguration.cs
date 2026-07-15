using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SBLMS.Domain.Entities;

namespace SBLMS.Infrastructure.Persistence.Configurations;

public class AiLeadRequestConfiguration : IEntityTypeConfiguration<AiLeadRequest>
{
    public void Configure(EntityTypeBuilder<AiLeadRequest> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Keywords).IsRequired().HasMaxLength(500);
        builder.Property(r => r.Country).IsRequired().HasMaxLength(100);
        builder.Property(r => r.Industry).HasMaxLength(100);
        builder.Property(r => r.Prompt).HasMaxLength(2000);
        builder.Property(r => r.AiProvider).IsRequired().HasMaxLength(50);
        builder.Property(r => r.Status).IsRequired().HasMaxLength(50);

        builder.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(r => r.Results)
            .WithOne(res => res.Request)
            .HasForeignKey(res => res.RequestId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
