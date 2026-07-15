using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.Reports.Queries.GetDashboardStats;

public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, Result<DashboardStatsDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILeadRepository _leadRepository;

    public GetDashboardStatsQueryHandler(IApplicationDbContext context, ILeadRepository leadRepository)
    {
        _context = context;
        _leadRepository = leadRepository;
    }

    public async Task<Result<DashboardStatsDto>> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var totalLeads = await _leadRepository.CountAsync();
        var newLeads = await _leadRepository.GetLeadCountByStatusAsync(LeadStatus.New);
        var followUpLeads = await _leadRepository.GetLeadCountByStatusAsync(LeadStatus.FollowUp);
        var convertedLeads = await _leadRepository.GetLeadCountByStatusAsync(LeadStatus.Converted);
        var lostLeads = await _leadRepository.GetLeadCountByStatusAsync(LeadStatus.Lost);
        var todayFollowUps = await _leadRepository.GetTodayFollowUpsCountAsync();
        var upcomingMeetings = await _leadRepository.GetUpcomingMeetingsCountAsync();

        var totalUsers = await _context.Users.CountAsync(u => u.IsActive, cancellationToken);
        var activeUsers = await _context.Users.CountAsync(u => u.IsActive && u.LastLoginAt != null && u.LastLoginAt > DateTime.UtcNow.AddDays(-30), cancellationToken);

        var allLeads = await _context.Leads.ToListAsync(cancellationToken);
        var totalValue = allLeads.Sum(l => l.Value ?? 0);
        var conversionRate = totalLeads > 0 ? (decimal)convertedLeads / totalLeads * 100 : 0;

        var monthlyRevenue = allLeads
            .Where(l => l.Status == LeadStatus.Converted && l.CreatedAt >= DateTime.UtcNow.AddMonths(-1))
            .Sum(l => l.Value ?? 0);

        var leadsByStatus = Enum.GetValues<LeadStatus>()
            .Select(s => new LeadByStatusDto
            {
                Status = s.ToString(),
                Count = allLeads.Count(l => l.Status == s),
                Percentage = totalLeads > 0 ? (decimal)allLeads.Count(l => l.Status == s) / totalLeads * 100 : 0
            })
            .Where(s => s.Count > 0)
            .ToList();

        var leadsBySource = Enum.GetValues<LeadSource>()
            .Select(s => new LeadBySourceDto
            {
                Source = s.ToString(),
                Count = allLeads.Count(l => l.Source == s),
                Percentage = totalLeads > 0 ? (decimal)allLeads.Count(l => l.Source == s) / totalLeads * 100 : 0
            })
            .Where(s => s.Count > 0)
            .ToList();

        var monthlyLeads = Enumerable.Range(0, 6)
            .Select(i => DateTime.UtcNow.AddMonths(-i))
            .Reverse()
            .Select(d => new MonthlyLeadDto
            {
                Month = d.ToString("MMM yyyy"),
                Created = allLeads.Count(l => l.CreatedAt.Month == d.Month && l.CreatedAt.Year == d.Year),
                Converted = allLeads.Count(l => l.Status == LeadStatus.Converted && l.UpdatedAt.Month == d.Month && l.UpdatedAt.Year == d.Year),
                Lost = allLeads.Count(l => l.Status == LeadStatus.Lost && l.UpdatedAt.Month == d.Month && l.UpdatedAt.Year == d.Year)
            })
            .ToList();

        var recentActivities = await _context.Activities
            .Include(a => a.User)
            .OrderByDescending(a => a.CreatedAt)
            .Take(10)
            .Select(a => new RecentActivityDto
            {
                Description = a.Description,
                UserName = a.User!.FirstName + " " + a.User.LastName,
                TypeName = a.Type.ToString(),
                CreatedAt = a.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var stats = new DashboardStatsDto
        {
            TotalLeads = totalLeads,
            NewLeads = newLeads,
            FollowUpLeads = followUpLeads,
            ConvertedLeads = convertedLeads,
            LostLeads = lostLeads,
            TodayFollowUps = todayFollowUps,
            UpcomingMeetings = upcomingMeetings,
            TotalUsers = totalUsers,
            ActiveUsers = activeUsers,
            TotalValue = totalValue,
            ConversionRate = Math.Round(conversionRate, 2),
            MonthlyRevenue = monthlyRevenue,
            LeadsByStatus = leadsByStatus,
            LeadsBySource = leadsBySource,
            MonthlyLeads = monthlyLeads,
            RecentActivities = recentActivities
        };

        return Result<DashboardStatsDto>.Success(stats);
    }
}
