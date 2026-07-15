using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.AuditLogs.DTOs;

namespace SBLMS.Application.Features.AuditLogs.Queries.GetAuditLogByDateRange;

public class GetAuditLogByDateRangeQuery : IRequest<Result<List<AuditLogDto>>>
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? EntityName { get; set; }
}
