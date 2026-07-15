using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.AuditLogs.DTOs;

namespace SBLMS.Application.Features.AuditLogs.Queries.GetAuditLogByUser;

public class GetAuditLogByUserQuery : IRequest<Result<List<AuditLogDto>>>
{
    public Guid UserId { get; set; }
    public int Limit { get; set; } = 50;
}
