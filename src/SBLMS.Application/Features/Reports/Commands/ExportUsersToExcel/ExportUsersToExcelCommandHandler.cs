using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Features.Reports.Commands.ExportUsersToExcel;

public class ExportUsersToExcelCommandHandler : IRequestHandler<ExportUsersToExcelCommand, Result<byte[]>>
{
    private readonly IApplicationDbContext _context;
    private readonly IExcelService _excelService;

    public ExportUsersToExcelCommandHandler(IApplicationDbContext context, IExcelService excelService)
    {
        _context = context;
        _excelService = excelService;
    }

    public async Task<Result<byte[]>> Handle(ExportUsersToExcelCommand request, CancellationToken cancellationToken)
    {
        var users = await _context.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Include(u => u.AssignedLeads)
            .Include(u => u.FollowUps)
            .Include(u => u.Meetings)
            .OrderBy(u => u.LastName)
            .Select(u => new UserEntryReportDto
            {
                UserId = u.Id,
                UserName = u.FullName,
                Email = u.Email,
                Role = u.UserRoles.FirstOrDefault() != null ? u.UserRoles.First().Role.Name : null,
                LastLoginAt = u.LastLoginAt,
                TotalLeadsAssigned = u.AssignedLeads.Count(a => a.IsActive),
                TotalFollowUps = u.FollowUps.Count,
                TotalMeetings = u.Meetings.Count,
                IsActive = u.IsActive
            })
            .ToListAsync(cancellationToken);

        var excelBytes = _excelService.ExportUsersToExcel(users);
        return Result<byte[]>.Success(excelBytes);
    }
}
