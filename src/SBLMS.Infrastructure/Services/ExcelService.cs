using OfficeOpenXml;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Infrastructure.Services;

public class ExcelService : IExcelService
{
    public ExcelService()
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public byte[] ExportLeadsToExcel(List<LeadExportDto> leads)
    {
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Leads");

        worksheet.Cells[1, 1].Value = "Lead Number";
        worksheet.Cells[1, 2].Value = "Customer Name";
        worksheet.Cells[1, 3].Value = "Company";
        worksheet.Cells[1, 4].Value = "Email";
        worksheet.Cells[1, 5].Value = "Phone";
        worksheet.Cells[1, 6].Value = "Status";
        worksheet.Cells[1, 7].Value = "Source";
        worksheet.Cells[1, 8].Value = "Value";
        worksheet.Cells[1, 9].Value = "Created At";

        for (int i = 0; i < leads.Count; i++)
        {
            worksheet.Cells[i + 2, 1].Value = leads[i].LeadNumber;
            worksheet.Cells[i + 2, 2].Value = leads[i].CustomerName;
            worksheet.Cells[i + 2, 3].Value = leads[i].CompanyName;
            worksheet.Cells[i + 2, 4].Value = leads[i].EmailAddress;
            worksheet.Cells[i + 2, 5].Value = leads[i].MobileNumber;
            worksheet.Cells[i + 2, 6].Value = leads[i].Status;
            worksheet.Cells[i + 2, 7].Value = leads[i].Source;
            worksheet.Cells[i + 2, 8].Value = leads[i].Value;
            worksheet.Cells[i + 2, 9].Value = leads[i].CreatedAt.ToString("yyyy-MM-dd");
        }

        worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

        return package.GetAsByteArray();
    }

    public byte[] ExportPerformanceToExcel(List<UserPerformanceDto> users)
    {
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Performance");

        worksheet.Cells[1, 1].Value = "User";
        worksheet.Cells[1, 2].Value = "Total Leads";
        worksheet.Cells[1, 3].Value = "Converted";
        worksheet.Cells[1, 4].Value = "Follow-Ups";
        worksheet.Cells[1, 5].Value = "Meetings";
        worksheet.Cells[1, 6].Value = "Conversion Rate";
        worksheet.Cells[1, 7].Value = "Total Value";

        for (int i = 0; i < users.Count; i++)
        {
            worksheet.Cells[i + 2, 1].Value = users[i].UserName;
            worksheet.Cells[i + 2, 2].Value = users[i].TotalLeads;
            worksheet.Cells[i + 2, 3].Value = users[i].ConvertedLeads;
            worksheet.Cells[i + 2, 4].Value = users[i].FollowUpsCompleted;
            worksheet.Cells[i + 2, 5].Value = users[i].MeetingsHeld;
            worksheet.Cells[i + 2, 6].Value = $"{users[i].ConversionRate}%";
            worksheet.Cells[i + 2, 7].Value = users[i].TotalValue;
        }

        worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

        return package.GetAsByteArray();
    }

    public byte[] ExportConversionToExcel(ConversionReportDto report)
    {
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Conversion");

        worksheet.Cells[1, 1].Value = "Month";
        worksheet.Cells[1, 2].Value = "Converted";
        worksheet.Cells[1, 3].Value = "Lost";
        worksheet.Cells[1, 4].Value = "Value";

        for (int i = 0; i < report.MonthlyConversions.Count; i++)
        {
            worksheet.Cells[i + 2, 1].Value = report.MonthlyConversions[i].Month;
            worksheet.Cells[i + 2, 2].Value = report.MonthlyConversions[i].Converted;
            worksheet.Cells[i + 2, 3].Value = report.MonthlyConversions[i].Lost;
            worksheet.Cells[i + 2, 4].Value = report.MonthlyConversions[i].Value;
        }

        worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

        return package.GetAsByteArray();
    }

    public byte[] ExportFollowUpsToExcel(List<FollowUpReportDto> followUps)
    {
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Follow-Ups");

        worksheet.Cells[1, 1].Value = "Lead Name";
        worksheet.Cells[1, 2].Value = "Company";
        worksheet.Cells[1, 3].Value = "Scheduled Date";
        worksheet.Cells[1, 4].Value = "Time";
        worksheet.Cells[1, 5].Value = "Status";
        worksheet.Cells[1, 6].Value = "Notes";
        worksheet.Cells[1, 7].Value = "Assigned To";

        for (int i = 0; i < followUps.Count; i++)
        {
            worksheet.Cells[i + 2, 1].Value = followUps[i].LeadName;
            worksheet.Cells[i + 2, 2].Value = followUps[i].CompanyName ?? "-";
            worksheet.Cells[i + 2, 3].Value = followUps[i].ScheduledDate.ToString("yyyy-MM-dd");
            worksheet.Cells[i + 2, 4].Value = followUps[i].ScheduledTime ?? "-";
            worksheet.Cells[i + 2, 5].Value = followUps[i].Status;
            worksheet.Cells[i + 2, 6].Value = followUps[i].Notes ?? "-";
            worksheet.Cells[i + 2, 7].Value = followUps[i].UserName ?? "-";
        }

        worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

        return package.GetAsByteArray();
    }

    public byte[] ExportMeetingsToExcel(List<MeetingReportDto> meetings)
    {
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Meetings");

        worksheet.Cells[1, 1].Value = "Lead Name";
        worksheet.Cells[1, 2].Value = "Company";
        worksheet.Cells[1, 3].Value = "Title";
        worksheet.Cells[1, 4].Value = "Type";
        worksheet.Cells[1, 5].Value = "Scheduled Date";
        worksheet.Cells[1, 6].Value = "Duration (min)";
        worksheet.Cells[1, 7].Value = "Setup Status";
        worksheet.Cells[1, 8].Value = "Client Response";

        for (int i = 0; i < meetings.Count; i++)
        {
            worksheet.Cells[i + 2, 1].Value = meetings[i].LeadName;
            worksheet.Cells[i + 2, 2].Value = meetings[i].CompanyName ?? "-";
            worksheet.Cells[i + 2, 3].Value = meetings[i].Title;
            worksheet.Cells[i + 2, 4].Value = meetings[i].MeetingType;
            worksheet.Cells[i + 2, 5].Value = meetings[i].ScheduledDate.ToString("yyyy-MM-dd HH:mm");
            worksheet.Cells[i + 2, 6].Value = meetings[i].Duration?.ToString() ?? "-";
            worksheet.Cells[i + 2, 7].Value = meetings[i].SetupStatus;
            worksheet.Cells[i + 2, 8].Value = meetings[i].ClientResponse;
        }

        worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

        return package.GetAsByteArray();
    }

    public byte[] ExportAttendanceToExcel(List<AttendanceReportDto> attendances)
    {
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Attendance");

        worksheet.Cells[1, 1].Value = "User";
        worksheet.Cells[1, 2].Value = "Email";
        worksheet.Cells[1, 3].Value = "Date";
        worksheet.Cells[1, 4].Value = "Check In";
        worksheet.Cells[1, 5].Value = "Check Out";
        worksheet.Cells[1, 6].Value = "Hours Worked";
        worksheet.Cells[1, 7].Value = "Status";
        worksheet.Cells[1, 8].Value = "Face Verified (In)";
        worksheet.Cells[1, 9].Value = "Face Verified (Out)";

        for (int i = 0; i < attendances.Count; i++)
        {
            worksheet.Cells[i + 2, 1].Value = attendances[i].UserName;
            worksheet.Cells[i + 2, 2].Value = attendances[i].Email ?? "-";
            worksheet.Cells[i + 2, 3].Value = attendances[i].Date.ToString("yyyy-MM-dd");
            worksheet.Cells[i + 2, 4].Value = attendances[i].CheckInTime?.ToString("HH:mm") ?? "-";
            worksheet.Cells[i + 2, 5].Value = attendances[i].CheckOutTime?.ToString("HH:mm") ?? "-";
            worksheet.Cells[i + 2, 6].Value = attendances[i].HoursWorked?.ToString("F2") ?? "-";
            worksheet.Cells[i + 2, 7].Value = attendances[i].Status;
            worksheet.Cells[i + 2, 8].Value = attendances[i].FaceVerifiedCheckIn ? "Yes" : "No";
            worksheet.Cells[i + 2, 9].Value = attendances[i].FaceVerifiedCheckOut ? "Yes" : "No";
        }

        worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

        return package.GetAsByteArray();
    }

    public byte[] ExportClientsToExcel(List<ClientReportDto> clients)
    {
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Clients");

        worksheet.Cells[1, 1].Value = "Company Name";
        worksheet.Cells[1, 2].Value = "Contact Name";
        worksheet.Cells[1, 3].Value = "Email";
        worksheet.Cells[1, 4].Value = "Phone";
        worksheet.Cells[1, 5].Value = "Industry";
        worksheet.Cells[1, 6].Value = "Projects";
        worksheet.Cells[1, 7].Value = "Total Revenue";
        worksheet.Cells[1, 8].Value = "Created At";

        for (int i = 0; i < clients.Count; i++)
        {
            worksheet.Cells[i + 2, 1].Value = clients[i].CompanyName;
            worksheet.Cells[i + 2, 2].Value = clients[i].ContactName;
            worksheet.Cells[i + 2, 3].Value = clients[i].Email ?? "-";
            worksheet.Cells[i + 2, 4].Value = clients[i].Phone ?? "-";
            worksheet.Cells[i + 2, 5].Value = clients[i].Industry ?? "-";
            worksheet.Cells[i + 2, 6].Value = clients[i].ProjectCount;
            worksheet.Cells[i + 2, 7].Value = clients[i].TotalRevenue;
            worksheet.Cells[i + 2, 8].Value = clients[i].CreatedAt.ToString("yyyy-MM-dd");
        }

        worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

        return package.GetAsByteArray();
    }

    public byte[] ExportUsersToExcel(List<UserEntryReportDto> users)
    {
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Users");

        worksheet.Cells[1, 1].Value = "User Name";
        worksheet.Cells[1, 2].Value = "Email";
        worksheet.Cells[1, 3].Value = "Role";
        worksheet.Cells[1, 4].Value = "Last Login";
        worksheet.Cells[1, 5].Value = "Leads Assigned";
        worksheet.Cells[1, 6].Value = "Follow-Ups";
        worksheet.Cells[1, 7].Value = "Meetings";
        worksheet.Cells[1, 8].Value = "Active";

        for (int i = 0; i < users.Count; i++)
        {
            worksheet.Cells[i + 2, 1].Value = users[i].UserName;
            worksheet.Cells[i + 2, 2].Value = users[i].Email;
            worksheet.Cells[i + 2, 3].Value = users[i].Role ?? "-";
            worksheet.Cells[i + 2, 4].Value = users[i].LastLoginAt?.ToString("yyyy-MM-dd HH:mm") ?? "Never";
            worksheet.Cells[i + 2, 5].Value = users[i].TotalLeadsAssigned;
            worksheet.Cells[i + 2, 6].Value = users[i].TotalFollowUps;
            worksheet.Cells[i + 2, 7].Value = users[i].TotalMeetings;
            worksheet.Cells[i + 2, 8].Value = users[i].IsActive ? "Yes" : "No";
        }

        worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

        return package.GetAsByteArray();
    }
}
