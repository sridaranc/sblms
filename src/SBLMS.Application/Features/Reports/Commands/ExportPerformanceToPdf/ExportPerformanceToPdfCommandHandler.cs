using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.Reports.Commands.ExportPerformanceToPdf;

public class ExportPerformanceToPdfCommandHandler : IRequestHandler<ExportPerformanceToPdfCommand, Result<byte[]>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPdfService _pdfService;

    public ExportPerformanceToPdfCommandHandler(IApplicationDbContext context, IPdfService pdfService)
    {
        _context = context;
        _pdfService = pdfService;
    }

    public async Task<Result<byte[]>> Handle(ExportPerformanceToPdfCommand request, CancellationToken cancellationToken)
    {
        var users = await _context.Users.Where(u => u.IsActive).ToListAsync(cancellationToken);
        var userPerformances = new List<UserPerformanceDto>();

        foreach (var user in users)
        {
            var assignedLeads = await _context.LeadAssignments
                .Where(a => a.UserId == user.Id && a.IsActive)
                .CountAsync(cancellationToken);

            var convertedLeads = await _context.LeadAssignments
                .Where(a => a.UserId == user.Id && a.Lead.Status == LeadStatus.Converted)
                .CountAsync(cancellationToken);

            var followUpsCompleted = await _context.FollowUps
                .Where(f => f.UserId == user.Id && f.Status == FollowUpStatus.Completed)
                .CountAsync(cancellationToken);

            var meetingsHeld = await _context.Meetings
                .Where(m => m.UserId == user.Id && m.Status == MeetingStatus.Completed)
                .CountAsync(cancellationToken);

            var totalValue = await _context.LeadAssignments
                .Where(a => a.UserId == user.Id && a.Lead.Status == LeadStatus.Converted)
                .SumAsync(a => a.Lead.Value ?? 0, cancellationToken);

            var conversionRate = assignedLeads > 0 ? (decimal)convertedLeads / assignedLeads * 100 : 0;

            userPerformances.Add(new UserPerformanceDto
            {
                UserId = user.Id,
                UserName = user.FullName,
                TotalLeads = assignedLeads,
                ConvertedLeads = convertedLeads,
                FollowUpsCompleted = followUpsCompleted,
                MeetingsHeld = meetingsHeld,
                ConversionRate = Math.Round(conversionRate, 2),
                TotalValue = totalValue
            });
        }

        var pdfBytes = _pdfService.GeneratePerformancePdf(userPerformances);
        return Result<byte[]>.Success(pdfBytes);
    }
}
