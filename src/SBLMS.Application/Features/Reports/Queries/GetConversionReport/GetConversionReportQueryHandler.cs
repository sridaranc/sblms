using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.Reports.Queries.GetConversionReport;

public class GetConversionReportQueryHandler : IRequestHandler<GetConversionReportQuery, Result<ConversionReportDto>>
{
    private readonly IApplicationDbContext _context;

    public GetConversionReportQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<ConversionReportDto>> Handle(GetConversionReportQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Leads.AsQueryable();

        if (request.StartDate.HasValue)
            query = query.Where(l => l.CreatedAt >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(l => l.CreatedAt <= request.EndDate.Value);

        var leads = await query.ToListAsync(cancellationToken);

        var totalLeads = leads.Count;
        var convertedLeads = leads.Count(l => l.Status == LeadStatus.Converted);
        var lostLeads = leads.Count(l => l.Status == LeadStatus.Lost);
        var totalValue = leads.Where(l => l.Status == LeadStatus.Converted).Sum(l => l.Value ?? 0);
        var conversionRate = totalLeads > 0 ? (decimal)convertedLeads / totalLeads * 100 : 0;
        var lossRate = totalLeads > 0 ? (decimal)lostLeads / totalLeads * 100 : 0;
        var averageDealSize = convertedLeads > 0 ? totalValue / convertedLeads : 0;

        var monthlyConversions = Enumerable.Range(0, 6)
            .Select(i => DateTime.UtcNow.AddMonths(-i))
            .Reverse()
            .Select(d => new ConversionByMonthDto
            {
                Month = d.ToString("MMM yyyy"),
                Converted = leads.Count(l => l.Status == LeadStatus.Converted && l.UpdatedAt.Month == d.Month && l.UpdatedAt.Year == d.Year),
                Lost = leads.Count(l => l.Status == LeadStatus.Lost && l.UpdatedAt.Month == d.Month && l.UpdatedAt.Year == d.Year),
                Value = leads.Where(l => l.Status == LeadStatus.Converted && l.UpdatedAt.Month == d.Month && l.UpdatedAt.Year == d.Year).Sum(l => l.Value ?? 0)
            })
            .ToList();

        var report = new ConversionReportDto
        {
            TotalLeads = totalLeads,
            ConvertedLeads = convertedLeads,
            LostLeads = lostLeads,
            ConversionRate = Math.Round(conversionRate, 2),
            LossRate = Math.Round(lossRate, 2),
            TotalValue = totalValue,
            AverageDealSize = Math.Round(averageDealSize, 2),
            MonthlyConversions = monthlyConversions
        };

        return Result<ConversionReportDto>.Success(report);
    }
}
