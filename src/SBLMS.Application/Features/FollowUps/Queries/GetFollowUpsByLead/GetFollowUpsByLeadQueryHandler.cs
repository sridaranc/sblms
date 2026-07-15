using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.FollowUps.DTOs;

namespace SBLMS.Application.Features.FollowUps.Queries.GetFollowUpsByLead;

public class GetFollowUpsByLeadQueryHandler : IRequestHandler<GetFollowUpsByLeadQuery, Result<List<FollowUpDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetFollowUpsByLeadQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<FollowUpDto>>> Handle(GetFollowUpsByLeadQuery request, CancellationToken cancellationToken)
    {
        var followUps = await _context.FollowUps
            .Include(f => f.Lead)
            .Include(f => f.User)
            .Where(f => f.LeadId == request.LeadId)
            .OrderByDescending(f => f.ScheduledDate)
            .ToListAsync(cancellationToken);

        var dtos = followUps.Select(f => new FollowUpDto
        {
            Id = f.Id,
            LeadId = f.LeadId,
            LeadNumber = f.Lead?.LeadNumber ?? string.Empty,
            CustomerName = f.Lead?.CustomerName ?? string.Empty,
            UserId = f.UserId,
            UserName = f.User?.FullName ?? string.Empty,
            ScheduledDate = f.ScheduledDate,
            ScheduledTime = f.ScheduledTime,
            Status = f.Status,
            Notes = f.Notes,
            Outcome = f.Outcome,
            CompletedAt = f.CompletedAt,
            CreatedAt = f.CreatedAt
        }).ToList();

        return Result<List<FollowUpDto>>.Success(dtos);
    }
}
