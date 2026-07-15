namespace SBLMS.Application.Features.Reports.DTOs;

public class DashboardStatsDto
{
    public int TotalLeads { get; set; }
    public int NewLeads { get; set; }
    public int FollowUpLeads { get; set; }
    public int ConvertedLeads { get; set; }
    public int LostLeads { get; set; }
    public int TodayFollowUps { get; set; }
    public int UpcomingMeetings { get; set; }
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public decimal TotalValue { get; set; }
    public decimal ConversionRate { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public List<LeadByStatusDto> LeadsByStatus { get; set; } = new();
    public List<LeadBySourceDto> LeadsBySource { get; set; } = new();
    public List<MonthlyLeadDto> MonthlyLeads { get; set; } = new();
    public List<RecentActivityDto> RecentActivities { get; set; } = new();
}

public class LeadByStatusDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class LeadBySourceDto
{
    public string Source { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class MonthlyLeadDto
{
    public string Month { get; set; } = string.Empty;
    public int Created { get; set; }
    public int Converted { get; set; }
    public int Lost { get; set; }
}

public class RecentActivityDto
{
    public string Description { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string TypeName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class LeadsByStatusReportDto
{
    public List<LeadByStatusDto> Statuses { get; set; } = new();
    public int TotalLeads { get; set; }
    public decimal ConversionRate { get; set; }
}

public class ConversionReportDto
{
    public int TotalLeads { get; set; }
    public int ConvertedLeads { get; set; }
    public int LostLeads { get; set; }
    public decimal ConversionRate { get; set; }
    public decimal LossRate { get; set; }
    public decimal TotalValue { get; set; }
    public decimal AverageDealSize { get; set; }
    public List<ConversionByMonthDto> MonthlyConversions { get; set; } = new();
}

public class ConversionByMonthDto
{
    public string Month { get; set; } = string.Empty;
    public int Converted { get; set; }
    public int Lost { get; set; }
    public decimal Value { get; set; }
}

public class PerformanceReportDto
{
    public List<UserPerformanceDto> Users { get; set; } = new();
}

public class UserPerformanceDto
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int TotalLeads { get; set; }
    public int ConvertedLeads { get; set; }
    public int FollowUpsCompleted { get; set; }
    public int MeetingsHeld { get; set; }
    public decimal ConversionRate { get; set; }
    public decimal TotalValue { get; set; }
}

public class FollowUpReportDto
{
    public Guid Id { get; set; }
    public string LeadName { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public DateTime ScheduledDate { get; set; }
    public string? ScheduledTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? UserName { get; set; }
    public string? CreatedByName { get; set; }
}

public class MeetingReportDto
{
    public Guid Id { get; set; }
    public string LeadName { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string MeetingType { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public int? Duration { get; set; }
    public string SetupStatus { get; set; } = string.Empty;
    public string ClientResponse { get; set; } = string.Empty;
    public string? SetupByName { get; set; }
}

public class AttendanceReportDto
{
    public Guid Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public DateTime Date { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public decimal? HoursWorked { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool FaceVerifiedCheckIn { get; set; }
    public bool FaceVerifiedCheckOut { get; set; }
}

public class ClientReportDto
{
    public Guid Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Industry { get; set; }
    public int ProjectCount { get; set; }
    public decimal TotalRevenue { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UserEntryReportDto
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Role { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int TotalLeadsAssigned { get; set; }
    public int TotalFollowUps { get; set; }
    public int TotalMeetings { get; set; }
    public bool IsActive { get; set; }
}
