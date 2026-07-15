using System.Text.Json;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Domain.Entities;
using SBLMS.Infrastructure.Persistence;

namespace SBLMS.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly SBLMSDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AuditService(SBLMSDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task LogAsync(string action, string entityName, string? entityId = null,
        object? oldValues = null, object? newValues = null)
    {
        var auditLog = new AuditLog
        {
            UserId = _currentUserService.UserId,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues) : null,
            NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : null,
            IpAddress = _currentUserService.IpAddress,
            UserAgent = _currentUserService.UserAgent
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();
    }
}
