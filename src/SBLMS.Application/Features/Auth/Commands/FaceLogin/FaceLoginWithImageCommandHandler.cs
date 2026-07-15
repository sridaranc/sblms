using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Auth.Commands.Login;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Auth.Commands.FaceLogin;

public class FaceLoginWithImageCommandHandler : IRequestHandler<FaceLoginWithImageCommand, Result<LoginResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditService _auditService;
    private readonly IFaceRecognitionService _faceRecognitionService;

    public FaceLoginWithImageCommandHandler(
        IApplicationDbContext context,
        IJwtService jwtService,
        ICurrentUserService currentUserService,
        IAuditService auditService,
        IFaceRecognitionService faceRecognitionService)
    {
        _context = context;
        _jwtService = jwtService;
        _currentUserService = currentUserService;
        _auditService = auditService;
        _faceRecognitionService = faceRecognitionService;
    }

    public async Task<Result<LoginResponse>> Handle(FaceLoginWithImageCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(request.ImageBase64))
            return Result<LoginResponse>.Failure("Image is required.");

        // Extract face descriptor from base64 image
        float[] capturedDescriptor;
        try
        {
            capturedDescriptor = await _faceRecognitionService.ExtractDescriptorAsync(request.ImageBase64, cancellationToken);
        }
        catch (Exception ex)
        {
            return Result<LoginResponse>.Failure($"Face detection failed: {ex.Message}");
        }

        if (capturedDescriptor == null || capturedDescriptor.Length == 0)
            return Result<LoginResponse>.Failure("No face detected in the image. Please try again.");

        var usersWithFaces = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Where(u => u.HasFaceDescriptor && u.IsActive && !string.IsNullOrEmpty(u.FaceDescriptor))
            .ToListAsync(cancellationToken);

        if (!usersWithFaces.Any())
            return Result<LoginResponse>.Failure("No enrolled faces found. Please contact administrator.");

        Guid? bestMatchUserId = null;
        double bestDistance = double.MaxValue;
        double threshold = request.Threshold ?? 0.6;

        foreach (var user in usersWithFaces)
        {
            try
            {
                var enrolledDescriptor = JsonSerializer.Deserialize<float[]>(user.FaceDescriptor);
                if (enrolledDescriptor == null || enrolledDescriptor.Length != capturedDescriptor.Length)
                    continue;

                var distance = ComputeEuclideanDistance(capturedDescriptor, enrolledDescriptor);

                if (distance < bestDistance)
                {
                    bestDistance = distance;
                    bestMatchUserId = user.Id;
                }
            }
            catch
            {
                continue;
            }
        }

        if (bestMatchUserId == null || bestDistance > threshold)
            return Result<LoginResponse>.Failure($"Face not recognized. Distance: {bestDistance:F3} (threshold: {threshold}). Please try again.");

        var matchedUser = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == bestMatchUserId.Value, cancellationToken);

        if (matchedUser == null)
            return Result<LoginResponse>.Failure("User not found.");

        // Automatically check-in for attendance if they haven't already today
        var today = DateTime.UtcNow.Date;
        var existingAttendance = await _context.Attendances
            .FirstOrDefaultAsync(a => a.UserId == matchedUser.Id && a.Date.Date == today, cancellationToken);

        if (existingAttendance == null || existingAttendance.CheckInTime == null)
        {
            var status = DetermineStatus(DateTime.UtcNow);
            if (existingAttendance == null)
            {
                var attendance = new Domain.Entities.Attendance
                {
                    UserId = matchedUser.Id,
                    Date = today,
                    CheckInTime = DateTime.UtcNow,
                    CheckInLocation = "Face Login (Auto)",
                    FaceVerifiedCheckIn = true,
                    FaceDistanceCheckIn = bestDistance,
                    Status = status
                };
                _context.Attendances.Add(attendance);
            }
            else
            {
                existingAttendance.CheckInTime = DateTime.UtcNow;
                existingAttendance.CheckInLocation = "Face Login (Auto)";
                existingAttendance.FaceVerifiedCheckIn = true;
                existingAttendance.FaceDistanceCheckIn = bestDistance;
                existingAttendance.Status = status;
                existingAttendance.UpdatedAt = DateTime.UtcNow;
                _context.Attendances.Update(existingAttendance);
            }
        }

        var roles = matchedUser.UserRoles.Select(ur => ur.Role.Name).ToList();

        var (accessToken, accessTokenExpiration) = await _jwtService.GenerateAccessTokenAsync(matchedUser.Id, roles);
        var refreshToken = _jwtService.GenerateRefreshToken();

        var refreshTokenEntity = new Domain.Entities.RefreshToken
        {
            UserId = matchedUser.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedByIp = _currentUserService.IpAddress
        };

        _context.RefreshTokens.Add(refreshTokenEntity);

        matchedUser.LastLoginAt = DateTime.UtcNow;
        matchedUser.LastLoginIp = _currentUserService.IpAddress;
        _context.Users.Update(matchedUser);

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("FaceLogin", "User", matchedUser.Id.ToString());

        var response = new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            AccessTokenExpiration = accessTokenExpiration,
            User = new UserResponse
            {
                Id = matchedUser.Id,
                Email = matchedUser.Email,
                FirstName = matchedUser.FirstName,
                LastName = matchedUser.LastName,
                FullName = matchedUser.FullName,
                PhoneNumber = matchedUser.PhoneNumber,
                ProfileImageUrl = matchedUser.ProfileImageUrl,
                Roles = roles
            }
        };

        return Result<LoginResponse>.Success(response, "Face login successful.");
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

    private static AttendanceStatus DetermineStatus(DateTime checkInTime)
    {
        var hour = checkInTime.Hour;
        var minute = checkInTime.Minute;

        if (hour > 9 || (hour == 9 && minute > 15))
            return AttendanceStatus.Late;

        return AttendanceStatus.Present;
    }
}
