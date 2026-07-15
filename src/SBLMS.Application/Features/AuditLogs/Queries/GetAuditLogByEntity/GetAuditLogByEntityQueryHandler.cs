using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.AuditLogs.DTOs;

namespace SBLMS.Application.Features.AuditLogs.Queries.GetAuditLogByEntity;

public class GetAuditLogByEntityQueryHandler : IRequestHandler<GetAuditLogByEntityQuery, Result<List<AuditLogDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetAuditLogByEntityQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<AuditLogDto>>> Handle(GetAuditLogByEntityQuery request, CancellationToken cancellationToken)
    {
        var logs = await _context.AuditLogs
            .Include(a => a.User)
            .Where(a => a.EntityName == request.EntityName && a.EntityId == request.EntityId)
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
