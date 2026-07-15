using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Activities.DTOs;

namespace SBLMS.Application.Features.Activities.Queries.GetLeadActivities;

public class GetLeadActivitiesQueryHandler : IRequestHandler<GetLeadActivitiesQuery, Result<List<ActivityDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetLeadActivitiesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<ActivityDto>>> Handle(GetLeadActivitiesQuery request, CancellationToken cancellationToken)
    {
        var activities = await _context.Activities
            .Include(a => a.User)
            .Include(a => a.Lead)
            .Where(a => a.LeadId == request.LeadId)
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
