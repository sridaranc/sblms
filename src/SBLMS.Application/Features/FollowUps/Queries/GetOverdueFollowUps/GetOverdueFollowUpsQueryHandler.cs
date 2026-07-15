using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.FollowUps.DTOs;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.FollowUps.Queries.GetOverdueFollowUps;

public class GetOverdueFollowUpsQueryHandler : IRequestHandler<GetOverdueFollowUpsQuery, Result<List<FollowUpDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetOverdueFollowUpsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<FollowUpDto>>> Handle(GetOverdueFollowUpsQuery request, CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;

        var followUps = await _context.FollowUps
            .Include(f => f.Lead)
            .Include(f => f.User)
            .Where(f => f.Status == FollowUpStatus.Pending && f.ScheduledDate.Date < today)
            .OrderBy(f => f.ScheduledDate)
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
            CreatedAt = f.CreatedAt
        }).ToList();

        return Result<List<FollowUpDto>>.Success(dtos);
    }
}
