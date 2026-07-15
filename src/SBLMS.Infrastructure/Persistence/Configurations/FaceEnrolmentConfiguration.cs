using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SBLMS.Domain.Entities;

namespace SBLMS.Infrastructure.Persistence.Configurations;

public class FaceEnrolmentConfiguration : IEntityTypeConfiguration<FaceEnrolment>
{
    public void Configure(EntityTypeBuilder<FaceEnrolment> builder)
    {
        builder.HasKey(fe => fe.Id);
        builder.Property(fe => fe.FaceDescriptor).IsRequired();
        builder.Property(fe => fe.Notes).HasMaxLength(500);

        builder.HasOne(fe => fe.User)
            .WithMany(u => u.FaceEnrolments)
            .HasForeignKey(fe => fe.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(fe => new { fe.UserId, fe.IsActive });
    }
}
