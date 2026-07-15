using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.FollowUps.DTOs;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.FollowUps.Queries.GetMyFollowUps;

public class GetMyFollowUpsQueryHandler : IRequestHandler<GetMyFollowUpsQuery, Result<List<FollowUpDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyFollowUpsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<FollowUpDto>>> Handle(GetMyFollowUpsQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.UserId.HasValue)
            return Result<List<FollowUpDto>>.Failure("User not authenticated.");

        var query = _context.FollowUps
            .Include(f => f.Lead)
            .Include(f => f.User)
            .Where(f => f.UserId == _currentUserService.UserId.Value)
            .AsQueryable();

        if (request.IncludeCompleted != true)
            query = query.Where(f => f.Status == FollowUpStatus.Pending || f.Status == FollowUpStatus.Rescheduled);

        var followUps = await query
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
            Outcome = f.Outcome,
            CompletedAt = f.CompletedAt,
            CreatedAt = f.CreatedAt
        }).ToList();

        return Result<List<FollowUpDto>>.Success(dtos);
    }
}
