using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.Reports.Queries.GetLeadsByStatusReport;

public class GetLeadsByStatusReportQueryHandler : IRequestHandler<GetLeadsByStatusReportQuery, Result<LeadsByStatusReportDto>>
{
    private readonly IApplicationDbContext _context;

    public GetLeadsByStatusReportQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<LeadsByStatusReportDto>> Handle(GetLeadsByStatusReportQuery request, CancellationToken cancellationToken)
    {
        var leads = await _context.Leads.ToListAsync(cancellationToken);
        var totalLeads = leads.Count;

        var statuses = Enum.GetValues<LeadStatus>()
            .Select(s => new LeadByStatusDto
            {
                Status = s.ToString(),
                Count = leads.Count(l => l.Status == s),
                Percentage = totalLeads > 0 ? (decimal)leads.Count(l => l.Status == s) / totalLeads * 100 : 0
            })
            .Where(s => s.Count > 0)
            .ToList();

        var convertedLeads = leads.Count(l => l.Status == LeadStatus.Converted);
        var conversionRate = totalLeads > 0 ? (decimal)convertedLeads / totalLeads * 100 : 0;

        var report = new LeadsByStatusReportDto
        {
            Statuses = statuses,
            TotalLeads = totalLeads,
            ConversionRate = Math.Round(conversionRate, 2)
        };

        return Result<LeadsByStatusReportDto>.Success(report);
    }
}
