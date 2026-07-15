using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.FaceEnrolment.Queries.GetFaceEnrolmentByUserId;

public class GetFaceEnrolmentByUserIdQueryHandler : IRequestHandler<GetFaceEnrolmentByUserIdQuery, Result<FaceEnrolmentByUserIdResponse>>
{
    private readonly IApplicationDbContext _context;

    public GetFaceEnrolmentByUserIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<FaceEnrolmentByUserIdResponse>> Handle(GetFaceEnrolmentByUserIdQuery request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
            return Result<FaceEnrolmentByUserIdResponse>.Failure("User not found.");

        float[]? faceDescriptor = null;
        if (!string.IsNullOrEmpty(user.FaceDescriptor))
        {
            faceDescriptor = JsonSerializer.Deserialize<float[]>(user.FaceDescriptor);
        }

        return Result<FaceEnrolmentByUserIdResponse>.Success(new FaceEnrolmentByUserIdResponse
        {
            Id = user.Id,
            UserId = user.Id,
            UserFullName = user.FullName,
            UserEmail = user.Email,
            IsActive = user.HasFaceDescriptor,
            EnrolledAt = user.FaceEnrolledAt,
            HasFaceDescriptor = user.HasFaceDescriptor,
            FaceDescriptor = faceDescriptor
        });
    }
}
