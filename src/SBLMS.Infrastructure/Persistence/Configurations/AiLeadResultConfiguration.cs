using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SBLMS.Domain.Entities;

namespace SBLMS.Infrastructure.Persistence.Configurations;

public class AiLeadResultConfiguration : IEntityTypeConfiguration<AiLeadResult>
{
    public void Configure(EntityTypeBuilder<AiLeadResult> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.CompanyName).IsRequired().HasMaxLength(200);
        builder.Property(r => r.ContactPerson).HasMaxLength(200);
        builder.Property(r => r.EmailAddress).HasMaxLength(256);
        builder.Property(r => r.ContactPersonEmail).HasMaxLength(256);
        builder.Property(r => r.Phone).HasMaxLength(20);
        builder.Property(r => r.Mobile).HasMaxLength(20);
        builder.Property(r => r.Address).HasMaxLength(500);
        builder.Property(r => r.City).HasMaxLength(100);
        builder.Property(r => r.State).HasMaxLength(100);
        builder.Property(r => r.Country).HasMaxLength(100);
        builder.Property(r => r.PostalCode).HasMaxLength(20);
        builder.Property(r => r.Website).HasMaxLength(500);
        builder.Property(r => r.NatureOfBusiness).HasMaxLength(200);
        builder.Property(r => r.Industry).HasMaxLength(100);
        builder.Property(r => r.CompanySize).HasMaxLength(50);
        builder.Property(r => r.LinkedInUrl).HasMaxLength(500);
        builder.Property(r => r.RevenueRange).HasMaxLength(50);

        builder.HasOne(r => r.Request)
            .WithMany(req => req.Results)
            .HasForeignKey(r => r.RequestId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
