using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Leads.DTOs;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.Leads.Queries.GetLeadStatistics;

public class GetLeadStatisticsQueryHandler : IRequestHandler<GetLeadStatisticsQuery, Result<LeadStatisticsDto>>
{
    private readonly ILeadRepository _leadRepository;

    public GetLeadStatisticsQueryHandler(ILeadRepository leadRepository)
    {
        _leadRepository = leadRepository;
    }

    public async Task<Result<LeadStatisticsDto>> Handle(GetLeadStatisticsQuery request, CancellationToken cancellationToken)
    {
        var totalLeads = await _leadRepository.CountAsync();
        var newLeads = await _leadRepository.GetLeadCountByStatusAsync(LeadStatus.New);
        var contactedLeads = await _leadRepository.GetLeadCountByStatusAsync(LeadStatus.Contacted);
        var followUpLeads = await _leadRepository.GetLeadCountByStatusAsync(LeadStatus.FollowUp);
        var meetingScheduledLeads = await _leadRepository.GetLeadCountByStatusAsync(LeadStatus.MeetingScheduled);
        var convertedLeads = await _leadRepository.GetLeadCountByStatusAsync(LeadStatus.Converted);
        var lostLeads = await _leadRepository.GetLeadCountByStatusAsync(LeadStatus.Lost);
        var closedLeads = await _leadRepository.GetLeadCountByStatusAsync(LeadStatus.Closed);

        var allLeads = await _leadRepository.GetAllAsync();
        var totalValue = allLeads.Sum(l => l.Value ?? 0);
        var conversionRate = totalLeads > 0 ? (decimal)convertedLeads / totalLeads * 100 : 0;

        var todayFollowUps = await _leadRepository.GetTodayFollowUpsCountAsync();
        var upcomingMeetings = await _leadRepository.GetUpcomingMeetingsCountAsync();

        var stats = new LeadStatisticsDto
        {
            TotalLeads = totalLeads,
            NewLeads = newLeads,
            ContactedLeads = contactedLeads,
            FollowUpLeads = followUpLeads,
            MeetingScheduledLeads = meetingScheduledLeads,
            ConvertedLeads = convertedLeads,
            LostLeads = lostLeads,
            ClosedLeads = closedLeads,
            TotalValue = totalValue,
            ConversionRate = Math.Round(conversionRate, 2),
            TodayFollowUps = todayFollowUps,
            UpcomingMeetings = upcomingMeetings
        };

        return Result<LeadStatisticsDto>.Success(stats);
    }
}
