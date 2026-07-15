using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.FaceEnrolment.Queries.GetFaceEnrolments;

public class GetFaceEnrolmentsQueryHandler : IRequestHandler<GetFaceEnrolmentsQuery, Result<List<FaceEnrolmentResponse>>>
{
    private readonly IApplicationDbContext _context;

    public GetFaceEnrolmentsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<FaceEnrolmentResponse>>> Handle(GetFaceEnrolmentsQuery request, CancellationToken cancellationToken)
    {
        var users = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Where(u => u.HasFaceDescriptor)
            .ToListAsync(cancellationToken);

        var response = users.Select(user => new FaceEnrolmentResponse
        {
            Id = user.Id,
            UserId = user.Id,
            UserFullName = user.FullName,
            UserEmail = user.Email,
            Department = user.Department,
            Role = user.UserRoles.FirstOrDefault()?.Role?.Name,
            IsActive = user.HasFaceDescriptor,
            EnrolledAt = user.FaceEnrolledAt,
            HasFaceDescriptor = user.HasFaceDescriptor,
        }).ToList();

        return Result<List<FaceEnrolmentResponse>>.Success(response);
    }
}
