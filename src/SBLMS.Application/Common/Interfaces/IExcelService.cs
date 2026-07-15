using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Common.Interfaces;

public interface IExcelService
{
    byte[] ExportLeadsToExcel(List<LeadExportDto> leads);
    byte[] ExportPerformanceToExcel(List<UserPerformanceDto> users);
    byte[] ExportConversionToExcel(ConversionReportDto report);
    byte[] ExportFollowUpsToExcel(List<FollowUpReportDto> followUps);
    byte[] ExportMeetingsToExcel(List<MeetingReportDto> meetings);
    byte[] ExportAttendanceToExcel(List<AttendanceReportDto> attendances);
    byte[] ExportClientsToExcel(List<ClientReportDto> clients);
    byte[] ExportUsersToExcel(List<UserEntryReportDto> users);
}
