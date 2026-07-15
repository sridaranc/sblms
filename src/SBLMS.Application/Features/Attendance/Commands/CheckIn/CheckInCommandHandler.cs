using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Attendance.Commands.CheckIn;

public class CheckInCommandHandler : IRequestHandler<CheckInCommand, Result<CheckInResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFaceRecognitionService _faceRecognitionService;

    public CheckInCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IFaceRecognitionService faceRecognitionService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _faceRecognitionService = faceRecognitionService;
    }

    public async Task<Result<CheckInResponse>> Handle(CheckInCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == null)
            return Result<CheckInResponse>.Failure("User not authenticated.");

        // Server-side face verification
        var user = await _context.Users.FindAsync(userId.Value, cancellationToken);
        if (user == null)
            return Result<CheckInResponse>.Failure("User not found.");

        float[]? capturedDescriptor = request.FaceDescriptor;
        if (!string.IsNullOrEmpty(request.ImageBase64))
        {
            try
            {
                capturedDescriptor = await _faceRecognitionService.ExtractDescriptorAsync(request.ImageBase64, cancellationToken);
            }
            catch (Exception ex)
            {
                return Result<CheckInResponse>.Failure($"Face detection failed: {ex.Message}");
            }
        }

        if (capturedDescriptor == null || capturedDescriptor.Length == 0)
            return Result<CheckInResponse>.Failure("No face detected. Please position your face in the camera and try again.");

        bool faceVerified = false;
        double? faceDistance = null;

        if (capturedDescriptor != null && capturedDescriptor.Length > 0)
        {
            if (!user.HasFaceDescriptor || string.IsNullOrEmpty(user.FaceDescriptor))
                return Result<CheckInResponse>.Failure("Face not enrolled. Please enrol your face first.");

            try
            {
                var enrolledDescriptor = JsonSerializer.Deserialize<float[]>(user.FaceDescriptor);
                if (enrolledDescriptor != null && enrolledDescriptor.Length == capturedDescriptor.Length)
                {
                    faceDistance = ComputeEuclideanDistance(capturedDescriptor, enrolledDescriptor);
                    faceVerified = faceDistance.Value <= 0.6;
                }
            }
            catch
            {
                return Result<CheckInResponse>.Failure("Invalid face data. Please re-enrol your face.");
            }
        }

        if (!faceVerified)
            return Result<CheckInResponse>.Failure(
                faceDistance.HasValue
                    ? $"Face verification failed. Distance: {faceDistance.Value:F3} (threshold: 0.6). Please try again."
                    : "Face verification required. Please position your face in the camera.");

        var today = DateTime.UtcNow.Date;

        var existingAttendance = await _context.Attendances
            .Where(a => a.UserId == userId.Value && a.Date.Date == today)
            .OrderByDescending(a => a.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (existingAttendance != null && existingAttendance.CheckInTime != null && existingAttendance.CheckOutTime == null)
            return Result<CheckInResponse>.Failure("Already checked in. Please check out first.");

        var status = DetermineStatus(DateTime.UtcNow);

        if (existingAttendance != null && existingAttendance.CheckInTime == null)
        {
            existingAttendance.CheckInTime = DateTime.UtcNow;
            existingAttendance.CheckInLocation = request.Location;
            existingAttendance.CheckInLatitude = request.Latitude;
            existingAttendance.CheckInLongitude = request.Longitude;
            existingAttendance.FaceVerifiedCheckIn = true;
            existingAttendance.FaceDistanceCheckIn = faceDistance;
            existingAttendance.Status = status;
            existingAttendance.UpdatedAt = DateTime.UtcNow;

            _context.Attendances.Update(existingAttendance);
            await _context.SaveChangesAsync(cancellationToken);

            return Result<CheckInResponse>.Success(new CheckInResponse
            {
                Id = existingAttendance.Id,
                CheckInTime = existingAttendance.CheckInTime.Value,
                Location = request.Location,
                FaceVerified = true,
                Status = status.ToString()
            }, "Check-in successful.");
        }

        var attendance = new Domain.Entities.Attendance
        {
            UserId = userId.Value,
            Date = today,
            CheckInTime = DateTime.UtcNow,
            CheckInLocation = request.Location,
            CheckInLatitude = request.Latitude,
            CheckInLongitude = request.Longitude,
            FaceVerifiedCheckIn = true,
            FaceDistanceCheckIn = faceDistance,
            Status = status
        };

        _context.Attendances.Add(attendance);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<CheckInResponse>.Success(new CheckInResponse
        {
            Id = attendance.Id,
            CheckInTime = attendance.CheckInTime.Value,
            Location = request.Location,
            FaceVerified = true,
            Status = status.ToString()
        }, "Check-in successful.");
    }

    private static double ComputeEuclideanDistance(float[] a, float[] b)
    {
        double sum = 0;
        for (int i = 0; i < a.Length; i++)
        {
            double diff = (double)a[i] - (double)b[i];
            sum += diff * diff;
        }
        return Math.Sqrt(sum);
    }

    private AttendanceStatus DetermineStatus(DateTime checkInTimeUtc)
    {
        // Convert UTC to IST (UTC+5:30) for late determination
        var istOffset = TimeSpan.FromHours(5.5);
        var checkInIst = checkInTimeUtc.Add(istOffset);

        var hour = checkInIst.Hour;
        var minute = checkInIst.Minute;

        if (hour > 9 || (hour == 9 && minute > 15))
            return AttendanceStatus.Late;

        return AttendanceStatus.Present;
    }
}
