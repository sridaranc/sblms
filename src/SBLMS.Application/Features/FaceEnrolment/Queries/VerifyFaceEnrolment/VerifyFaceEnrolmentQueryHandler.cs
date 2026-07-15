using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.FaceEnrolment.Queries.VerifyFaceEnrolment;

public class VerifyFaceEnrolmentQueryHandler : IRequestHandler<VerifyFaceEnrolmentQuery, Result<FaceEnrolmentVerificationResponse>>
{
    private readonly IApplicationDbContext _context;

    public VerifyFaceEnrolmentQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<FaceEnrolmentVerificationResponse>> Handle(VerifyFaceEnrolmentQuery request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(request.UserId, cancellationToken);
        if (user == null)
            return Result<FaceEnrolmentVerificationResponse>.Failure("User not found.");

        float[]? faceDescriptor = null;
        if (!string.IsNullOrEmpty(user.FaceDescriptor))
        {
            faceDescriptor = JsonSerializer.Deserialize<float[]>(user.FaceDescriptor);
        }

        return Result<FaceEnrolmentVerificationResponse>.Success(new FaceEnrolmentVerificationResponse
        {
            IsEnrolled = user.HasFaceDescriptor,
            IsActive = user.HasFaceDescriptor,
            EnrolledAt = user.FaceEnrolledAt,
            FaceDescriptor = faceDescriptor
        });
    }
}
