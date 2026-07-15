using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Common.Interfaces;

public interface IPdfService
{
    byte[] GenerateLeadsPdf(List<LeadExportDto> leads);
    byte[] GeneratePerformancePdf(List<UserPerformanceDto> users);
    byte[] GenerateFollowUpsPdf(List<FollowUpReportDto> followUps);
    byte[] GenerateMeetingsPdf(List<MeetingReportDto> meetings);
    byte[] GenerateAttendancePdf(List<AttendanceReportDto> attendances);
    byte[] GenerateClientsPdf(List<ClientReportDto> clients);
    byte[] GenerateUsersPdf(List<UserEntryReportDto> users);
}
