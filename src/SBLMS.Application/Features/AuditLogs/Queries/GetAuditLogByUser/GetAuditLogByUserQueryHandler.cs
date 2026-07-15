using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.AuditLogs.DTOs;

namespace SBLMS.Application.Features.AuditLogs.Queries.GetAuditLogByUser;

public class GetAuditLogByUserQueryHandler : IRequestHandler<GetAuditLogByUserQuery, Result<List<AuditLogDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetAuditLogByUserQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<AuditLogDto>>> Handle(GetAuditLogByUserQuery request, CancellationToken cancellationToken)
    {
        var logs = await _context.AuditLogs
            .Include(a => a.User)
            .Where(a => a.UserId == request.UserId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(request.Limit)
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
