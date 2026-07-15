using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.AuditLogs.DTOs;

namespace SBLMS.Application.Features.AuditLogs.Queries.GetAllAuditLogs;

public class GetAllAuditLogsQueryHandler : IRequestHandler<GetAllAuditLogsQuery, Result<PaginatedResult<AuditLogDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetAllAuditLogsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PaginatedResult<AuditLogDto>>> Handle(GetAllAuditLogsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.AuditLogs
            .Include(a => a.User)
            .AsQueryable();

        if (!string.IsNullOrEmpty(request.SearchTerm))
            query = query.Where(a => a.EntityName.Contains(request.SearchTerm) ||
                                     a.EntityId.Contains(request.SearchTerm) ||
                                     a.Action.Contains(request.SearchTerm));

        if (!string.IsNullOrEmpty(request.EntityName))
            query = query.Where(a => a.EntityName == request.EntityName);

        if (!string.IsNullOrEmpty(request.Action))
            query = query.Where(a => a.Action == request.Action);

        if (request.StartDate.HasValue)
            query = query.Where(a => a.CreatedAt >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(a => a.CreatedAt <= request.EndDate.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
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

        var result = new PaginatedResult<AuditLogDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize)
        };

        return Result<PaginatedResult<AuditLogDto>>.Success(result);
    }
}
