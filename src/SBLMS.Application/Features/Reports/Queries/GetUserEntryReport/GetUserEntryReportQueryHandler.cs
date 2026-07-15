using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Features.Reports.Queries.GetUserEntryReport;

public class GetUserEntryReportQueryHandler : IRequestHandler<GetUserEntryReportQuery, Result<List<UserEntryReportDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetUserEntryReportQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<UserEntryReportDto>>> Handle(GetUserEntryReportQuery request, CancellationToken cancellationToken)
    {
        var users = await _context.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Include(u => u.AssignedLeads)
            .Include(u => u.FollowUps)
            .Include(u => u.Meetings)
            .OrderBy(u => u.LastName)
            .Select(u => new UserEntryReportDto
            {
                UserId = u.Id,
                UserName = u.FullName,
                Email = u.Email,
                Role = u.UserRoles.FirstOrDefault() != null ? u.UserRoles.First().Role.Name : null,
                LastLoginAt = u.LastLoginAt,
                TotalLeadsAssigned = u.AssignedLeads.Count(a => a.IsActive),
                TotalFollowUps = u.FollowUps.Count,
                TotalMeetings = u.Meetings.Count,
                IsActive = u.IsActive
            })
            .ToListAsync(cancellationToken);

        return Result<List<UserEntryReportDto>>.Success(users);
    }
}
