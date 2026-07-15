using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.FollowUps.DTOs;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.FollowUps.Queries.GetAllFollowUps;

public class GetAllFollowUpsQueryHandler : IRequestHandler<GetAllFollowUpsQuery, Result<List<FollowUpDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetAllFollowUpsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<FollowUpDto>>> Handle(GetAllFollowUpsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.FollowUps
            .Include(fu => fu.Lead)
            .Include(fu => fu.User)
            .AsQueryable();

        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<FollowUpStatus>(request.Status, true, out var status))
            query = query.Where(fu => fu.Status == status);

        if (request.LeadId.HasValue)
            query = query.Where(fu => fu.LeadId == request.LeadId.Value);

        if (request.UserId.HasValue)
            query = query.Where(fu => fu.UserId == request.UserId.Value);

        var followUps = await query
            .OrderByDescending(fu => fu.ScheduledDate)
            .Select(fu => new FollowUpDto
            {
                Id = fu.Id,
                LeadId = fu.LeadId,
                LeadNumber = fu.Lead.LeadNumber,
                CustomerName = fu.Lead.CustomerName,
                UserId = fu.UserId,
                UserName = $"{fu.User.FirstName} {fu.User.LastName}",
                ScheduledDate = fu.ScheduledDate,
                ScheduledTime = fu.ScheduledTime,
                Status = fu.Status,
                Notes = fu.Notes,
                Outcome = fu.Outcome,
                CompletedAt = fu.CompletedAt,
                CreatedAt = fu.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Result<List<FollowUpDto>>.Success(followUps);
    }
}
