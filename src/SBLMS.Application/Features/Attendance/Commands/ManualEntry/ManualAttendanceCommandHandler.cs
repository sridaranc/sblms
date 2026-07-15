using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Attendance.Commands.ManualEntry;

public class ManualAttendanceCommandHandler : IRequestHandler<ManualAttendanceCommand, Result<ManualAttendanceResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditService _auditService;

    public ManualAttendanceCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IAuditService auditService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _auditService = auditService;
    }

    public async Task<Result<ManualAttendanceResponse>> Handle(ManualAttendanceCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId == null)
            return Result<ManualAttendanceResponse>.Failure("User not authenticated.");

        // Determine target user (admin may specify another user's id)
        var targetUserId = request.TargetUserId ?? currentUserId.Value;

        var dateUtc = DateTime.SpecifyKind(request.Date.Date, DateTimeKind.Utc);
        // Times entered by admin are in IST (UTC+5:30); convert to UTC for storage
        var istOffset = TimeSpan.FromHours(5.5);
        DateTime? checkInUtc = request.CheckInTime.HasValue
            ? dateUtc.Add(request.CheckInTime.Value).Subtract(istOffset)
            : null;
        DateTime? checkOutUtc = request.CheckOutTime.HasValue
            ? dateUtc.Add(request.CheckOutTime.Value).Subtract(istOffset)
            : null;

        // Validate times
        if (checkInUtc.HasValue && checkOutUtc.HasValue && checkOutUtc <= checkInUtc)
            return Result<ManualAttendanceResponse>.Failure("Check-out time must be after check-in time.");

        // Parse status
        if (!Enum.TryParse<AttendanceStatus>(request.Status, ignoreCase: true, out var statusEnum))
            statusEnum = AttendanceStatus.Present;

        // Upsert: update existing record for the day or create new
        var existing = await _context.Attendances
            .Where(a => a.UserId == targetUserId && a.Date.Date == dateUtc.Date)
            .OrderByDescending(a => a.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (existing != null)
        {
            if (checkInUtc.HasValue) existing.CheckInTime = checkInUtc;
            if (checkOutUtc.HasValue) existing.CheckOutTime = checkOutUtc;
            if (!string.IsNullOrEmpty(request.Location))
            {
                if (checkInUtc.HasValue) existing.CheckInLocation = request.Location;
                if (checkOutUtc.HasValue) existing.CheckOutLocation = request.Location;
            }
            existing.Status = statusEnum;
            existing.Notes = request.Notes;
            existing.UpdatedAt = DateTime.UtcNow;

            _context.Attendances.Update(existing);
            await _context.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync("ManualUpdate", "Attendance", existing.Id.ToString(),
                newValues: new { targetUserId, dateUtc, checkInUtc, checkOutUtc, statusEnum });

            return Result<ManualAttendanceResponse>.Success(MapToResponse(existing), "Attendance updated successfully.");
        }

        var attendance = new Domain.Entities.Attendance
        {
            UserId = targetUserId,
            Date = dateUtc,
            CheckInTime = checkInUtc,
            CheckOutTime = checkOutUtc,
            CheckInLocation = checkInUtc.HasValue ? request.Location : null,
            CheckOutLocation = checkOutUtc.HasValue ? request.Location : null,
            FaceVerifiedCheckIn = false,
            FaceVerifiedCheckOut = false,
            Status = statusEnum,
            Notes = request.Notes,
        };

        _context.Attendances.Add(attendance);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("ManualCreate", "Attendance", attendance.Id.ToString(),
            newValues: new { targetUserId, dateUtc, checkInUtc, checkOutUtc, statusEnum });

        return Result<ManualAttendanceResponse>.Success(MapToResponse(attendance), "Attendance recorded successfully.");
    }

    private static ManualAttendanceResponse MapToResponse(Domain.Entities.Attendance a) => new()
    {
        Id = a.Id,
        Date = a.Date,
        CheckInTime = a.CheckInTime,
        CheckOutTime = a.CheckOutTime,
        Status = a.Status.ToString(),
        Notes = a.Notes,
    };
}
