using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SBLMS.Domain.Entities;

namespace SBLMS.Infrastructure.Persistence.Configurations;

public class LeadAssignmentConfiguration : IEntityTypeConfiguration<LeadAssignment>
{
    public void Configure(EntityTypeBuilder<LeadAssignment> builder)
    {
        builder.HasKey(a => a.Id);

        builder.HasOne(a => a.Lead)
            .WithMany(l => l.Assignments)
            .HasForeignKey(a => a.LeadId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.User)
            .WithMany(u => u.AssignedLeads)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
