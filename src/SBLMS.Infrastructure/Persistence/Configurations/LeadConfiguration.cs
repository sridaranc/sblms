using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SBLMS.Domain.Entities;

namespace SBLMS.Infrastructure.Persistence.Configurations;

public class LeadConfiguration : IEntityTypeConfiguration<Lead>
{
    public void Configure(EntityTypeBuilder<Lead> builder)
    {
        builder.HasKey(l => l.Id);
        builder.Property(l => l.LeadNumber).IsRequired().HasMaxLength(50);
        builder.Property(l => l.CompanyName).HasMaxLength(200);
        builder.Property(l => l.CustomerName).IsRequired().HasMaxLength(200);
        builder.Property(l => l.MobileNumber).HasMaxLength(20);
        builder.Property(l => l.AlternativeNumber).HasMaxLength(20);
        builder.Property(l => l.EmailAddress).HasMaxLength(256);
        builder.Property(l => l.Address).HasMaxLength(500);
        builder.Property(l => l.City).HasMaxLength(100);
        builder.Property(l => l.State).HasMaxLength(100);
        builder.Property(l => l.Country).HasMaxLength(100);
        builder.Property(l => l.PostalCode).HasMaxLength(20);
        builder.Property(l => l.IndustryType).HasMaxLength(100);
        builder.Property(l => l.BusinessCategory).HasMaxLength(100);
        builder.Property(l => l.CompanySize).HasMaxLength(50);
        builder.Property(l => l.Website).HasMaxLength(500);
        builder.Property(l => l.ExpectedBudget).HasPrecision(18, 2);
        builder.Property(l => l.Notes).HasMaxLength(2000);
        builder.Property(l => l.CustomerPriority).HasMaxLength(50);
        builder.Property(l => l.Value).HasPrecision(18, 2);

        builder.Property(l => l.TaxId).HasMaxLength(50);
        builder.Property(l => l.AnnualRevenue).HasPrecision(18, 2);
        builder.Property(l => l.Fax).HasMaxLength(20);
        builder.Property(l => l.LinkedInUrl).HasMaxLength(500);
        builder.Property(l => l.SkypeId).HasMaxLength(100);
        builder.Property(l => l.CampaignSource).HasMaxLength(200);
        builder.Property(l => l.LeadSourceDetails).HasMaxLength(500);

        builder.HasIndex(l => l.LeadNumber).IsUnique();
        builder.HasIndex(l => l.CompanyName).IsUnique().HasFilter("\"CompanyName\" IS NOT NULL");

        builder.HasMany(l => l.Addresses)
            .WithOne(a => a.Lead)
            .HasForeignKey(a => a.LeadId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(l => l.ContactPersons)
            .WithOne(cp => cp.Lead)
            .HasForeignKey(cp => cp.LeadId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(l => l.Assignments)
            .WithOne(a => a.Lead)
            .HasForeignKey(a => a.LeadId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(l => l.FollowUps)
            .WithOne(f => f.Lead)
            .HasForeignKey(f => f.LeadId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(l => l.Meetings)
            .WithOne(m => m.Lead)
            .HasForeignKey(m => m.LeadId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(l => l.Activities)
            .WithOne(a => a.Lead)
            .HasForeignKey(a => a.LeadId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
