using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SBLMS.Domain.Entities;

namespace SBLMS.Infrastructure.Persistence.Configurations;

public class AttendanceConfiguration : IEntityTypeConfiguration<Attendance>
{
    public void Configure(EntityTypeBuilder<Attendance> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Date).IsRequired();
        builder.Property(a => a.CheckInLocation).HasMaxLength(500);
        builder.Property(a => a.CheckOutLocation).HasMaxLength(500);
        builder.Property(a => a.CheckInLatitude).HasPrecision(10, 8);
        builder.Property(a => a.CheckInLongitude).HasPrecision(11, 8);
        builder.Property(a => a.CheckOutLatitude).HasPrecision(10, 8);
        builder.Property(a => a.CheckOutLongitude).HasPrecision(11, 8);
        builder.Property(a => a.HoursWorked).HasPrecision(5, 2);
        builder.Property(a => a.FaceDistanceCheckIn).HasPrecision(10, 8);
        builder.Property(a => a.FaceDistanceCheckOut).HasPrecision(10, 8);
        builder.Property(a => a.Notes).HasMaxLength(1000);

        builder.HasOne(a => a.User)
            .WithMany(u => u.Attendances)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(a => new { a.UserId, a.Date });
    }
}
