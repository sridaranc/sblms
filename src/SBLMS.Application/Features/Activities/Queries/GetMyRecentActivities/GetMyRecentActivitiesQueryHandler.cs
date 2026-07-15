using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Activities.DTOs;

namespace SBLMS.Application.Features.Activities.Queries.GetMyRecentActivities;

public class GetMyRecentActivitiesQueryHandler : IRequestHandler<GetMyRecentActivitiesQuery, Result<List<ActivityDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyRecentActivitiesQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<ActivityDto>>> Handle(GetMyRecentActivitiesQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.UserId.HasValue)
            return Result<List<ActivityDto>>.Failure("User not authenticated.");

        var activities = await _context.Activities
            .Include(a => a.User)
            .Include(a => a.Lead)
            .Where(a => a.UserId == _currentUserService.UserId.Value)
            .OrderByDescending(a => a.CreatedAt)
            .Take(request.Limit)
            .ToListAsync(cancellationToken);

        var dtos = activities.Select(a => new ActivityDto
        {
            Id = a.Id,
            LeadId = a.LeadId,
            LeadNumber = a.Lead?.LeadNumber,
            CustomerName = a.Lead?.CustomerName,
            UserId = a.UserId,
            UserName = a.User?.FullName ?? string.Empty,
            Type = a.Type,
            Description = a.Description,
            Metadata = a.Metadata,
            CreatedAt = a.CreatedAt
        }).ToList();

        return Result<List<ActivityDto>>.Success(dtos);
    }
}
