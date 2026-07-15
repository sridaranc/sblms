using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Attendance.Commands.CheckOut;

public class CheckOutCommandHandler : IRequestHandler<CheckOutCommand, Result<CheckOutResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFaceRecognitionService _faceRecognitionService;

    public CheckOutCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IFaceRecognitionService faceRecognitionService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _faceRecognitionService = faceRecognitionService;
    }

    public async Task<Result<CheckOutResponse>> Handle(CheckOutCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == null)
            return Result<CheckOutResponse>.Failure("User not authenticated.");

        // Server-side face verification
        var user = await _context.Users.FindAsync(userId.Value, cancellationToken);
        if (user == null)
            return Result<CheckOutResponse>.Failure("User not found.");

        float[]? capturedDescriptor = request.FaceDescriptor;
        if (!string.IsNullOrEmpty(request.ImageBase64))
        {
            try
            {
                capturedDescriptor = await _faceRecognitionService.ExtractDescriptorAsync(request.ImageBase64, cancellationToken);
            }
            catch (Exception ex)
            {
                return Result<CheckOutResponse>.Failure($"Face detection failed: {ex.Message}");
            }
        }

        if (capturedDescriptor == null || capturedDescriptor.Length == 0)
            return Result<CheckOutResponse>.Failure("No face detected. Please position your face in the camera and try again.");

        bool faceVerified = false;
        double? faceDistance = null;

        if (capturedDescriptor != null && capturedDescriptor.Length > 0)
        {
            if (!user.HasFaceDescriptor || string.IsNullOrEmpty(user.FaceDescriptor))
                return Result<CheckOutResponse>.Failure("Face not enrolled. Please enrol your face first.");

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
                return Result<CheckOutResponse>.Failure("Invalid face data. Please re-enrol your face.");
            }
        }

        if (!faceVerified)
            return Result<CheckOutResponse>.Failure(
                faceDistance.HasValue
                    ? $"Face verification failed. Distance: {faceDistance.Value:F3} (threshold: 0.6). Please try again."
                    : "Face verification required. Please position your face in the camera.");

        var today = DateTime.UtcNow.Date;

        var attendance = await _context.Attendances
            .Where(a => a.UserId == userId.Value && a.Date.Date == today)
            .OrderByDescending(a => a.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (attendance == null || attendance.CheckInTime == null)
            return Result<CheckOutResponse>.Failure("No check-in found for today. Please check in first.");

        if (attendance.CheckOutTime != null)
            return Result<CheckOutResponse>.Failure("Already checked out for the current session. Please check in again.");

        attendance.CheckOutTime = DateTime.UtcNow;
        attendance.CheckOutLocation = request.Location;
        attendance.CheckOutLatitude = request.Latitude;
        attendance.CheckOutLongitude = request.Longitude;
        attendance.FaceVerifiedCheckOut = true;
        attendance.FaceDistanceCheckOut = faceDistance;
        attendance.UpdatedAt = DateTime.UtcNow;

        if (attendance.CheckInTime.HasValue)
        {
            var hoursWorked = (attendance.CheckOutTime.Value - attendance.CheckInTime.Value).TotalHours;
            attendance.HoursWorked = (decimal)hoursWorked;
        }

        _context.Attendances.Update(attendance);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<CheckOutResponse>.Success(new CheckOutResponse
        {
            Id = attendance.Id,
            CheckInTime = attendance.CheckInTime ?? DateTime.MinValue,
            CheckOutTime = attendance.CheckOutTime.Value,
            Location = request.Location,
            FaceVerified = true,
            HoursWorked = attendance.HoursWorked
        }, "Check-out successful.");
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
}
