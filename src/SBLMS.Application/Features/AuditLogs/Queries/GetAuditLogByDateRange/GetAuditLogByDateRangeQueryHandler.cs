using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.AuditLogs.DTOs;

namespace SBLMS.Application.Features.AuditLogs.Queries.GetAuditLogByDateRange;

public class GetAuditLogByDateRangeQueryHandler : IRequestHandler<GetAuditLogByDateRangeQuery, Result<List<AuditLogDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetAuditLogByDateRangeQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<AuditLogDto>>> Handle(GetAuditLogByDateRangeQuery request, CancellationToken cancellationToken)
    {
        var query = _context.AuditLogs
            .Include(a => a.User)
            .Where(a => a.CreatedAt >= request.StartDate && a.CreatedAt <= request.EndDate);

        if (!string.IsNullOrEmpty(request.EntityName))
            query = query.Where(a => a.EntityName == request.EntityName);

        var logs = await query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                EntityName = a.EntityName,
                EntityId = a.EntityId,
                Action = a.Action,
                OldValues = a.OldValues,
                NewValues = a.NewValues,
                UserId = a.UserId,
                UserName = a.User!.FirstName + " " + a.User.LastName,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Result<List<AuditLogDto>>.Success(logs);
    }
}
