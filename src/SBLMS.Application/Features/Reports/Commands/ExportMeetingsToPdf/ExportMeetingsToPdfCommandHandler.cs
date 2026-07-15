using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Features.Reports.Commands.ExportMeetingsToPdf;

public class ExportMeetingsToPdfCommandHandler : IRequestHandler<ExportMeetingsToPdfCommand, Result<byte[]>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPdfService _pdfService;

    public ExportMeetingsToPdfCommandHandler(IApplicationDbContext context, IPdfService pdfService)
    {
        _context = context;
        _pdfService = pdfService;
    }

    public async Task<Result<byte[]>> Handle(ExportMeetingsToPdfCommand request, CancellationToken cancellationToken)
    {
        var query = _context.Meetings
            .Include(m => m.Lead)
            .Include(m => m.User)
            .Include(m => m.SetupByUser)
            .AsQueryable();

        if (request.StartDate.HasValue)
            query = query.Where(m => m.ScheduledDate >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(m => m.ScheduledDate <= request.EndDate.Value.AddDays(1).AddTicks(-1));

        var meetings = await query
            .OrderByDescending(m => m.ScheduledDate)
            .Select(m => new MeetingReportDto
            {
                Id = m.Id,
                LeadName = m.Lead.CustomerName,
                CompanyName = m.Lead.CompanyName,
                Title = m.Title,
                MeetingType = m.MeetingType.ToString(),
                ScheduledDate = m.ScheduledDate,
                Duration = m.Duration.HasValue ? (int)m.Duration.Value.TotalMinutes : null,
                SetupStatus = m.SetupStatus.ToString(),
                ClientResponse = m.ClientResponse.ToString(),
                SetupByName = m.SetupByUser != null ? m.SetupByUser.FullName : null
            })
            .ToListAsync(cancellationToken);

        var pdfBytes = _pdfService.GenerateMeetingsPdf(meetings);
        return Result<byte[]>.Success(pdfBytes);
    }
}
