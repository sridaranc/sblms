using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.AuditLogs.DTOs;

namespace SBLMS.Application.Features.AuditLogs.Queries.GetAuditLogByEntity;

public class GetAuditLogByEntityQuery : IRequest<Result<List<AuditLogDto>>>
{
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
}
