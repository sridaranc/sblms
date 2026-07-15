using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Infrastructure.Services;

public class PdfService : IPdfService
{
    public byte[] GenerateLeadsPdf(List<LeadExportDto> leads)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);

                page.Header().Text("Leads Report")
                    .FontSize(20)
                    .Bold()
                    .AlignCenter();

                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        header.Cell().Text("Lead #").Bold();
                        header.Cell().Text("Customer").Bold();
                        header.Cell().Text("Company").Bold();
                        header.Cell().Text("Status").Bold();
                        header.Cell().Text("Value").Bold();
                    });

                    foreach (var lead in leads)
                    {
                        table.Cell().Text(lead.LeadNumber);
                        table.Cell().Text(lead.CustomerName);
                        table.Cell().Text(lead.CompanyName ?? "-");
                        table.Cell().Text(lead.Status);
                        table.Cell().Text(lead.Value?.ToString("C") ?? "-");
                    }
                });

                page.Footer().Text($"Generated on {DateTime.UtcNow:yyyy-MM-dd HH:mm}")
                    .FontSize(10)
                    .AlignCenter();
            });
        });

        return document.GeneratePdf();
    }

    public byte[] GeneratePerformancePdf(List<UserPerformanceDto> users)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);

                page.Header().Text("Performance Report")
                    .FontSize(20)
                    .Bold()
                    .AlignCenter();

                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        header.Cell().Text("User").Bold();
                        header.Cell().Text("Leads").Bold();
                        header.Cell().Text("Converted").Bold();
                        header.Cell().Text("Rate").Bold();
                        header.Cell().Text("Value").Bold();
                    });

                    foreach (var user in users)
                    {
                        table.Cell().Text(user.UserName);
                        table.Cell().Text(user.TotalLeads.ToString());
                        table.Cell().Text(user.ConvertedLeads.ToString());
                        table.Cell().Text($"{user.ConversionRate}%");
                        table.Cell().Text(user.TotalValue.ToString("C"));
                    }
                });

                page.Footer().Text($"Generated on {DateTime.UtcNow:yyyy-MM-dd HH:mm}")
                    .FontSize(10)
                    .AlignCenter();
            });
        });

        return document.GeneratePdf();
    }

    public byte[] GenerateFollowUpsPdf(List<FollowUpReportDto> followUps)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);

                page.Header().Text("Follow-Up Report")
                    .FontSize(20)
                    .Bold()
                    .AlignCenter();

                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        header.Cell().Text("Lead").Bold();
                        header.Cell().Text("Date").Bold();
                        header.Cell().Text("Time").Bold();
                        header.Cell().Text("Status").Bold();
                        header.Cell().Text("Assigned To").Bold();
                    });

                    foreach (var fu in followUps)
                    {
                        table.Cell().Text(fu.LeadName);
                        table.Cell().Text(fu.ScheduledDate.ToString("yyyy-MM-dd"));
                        table.Cell().Text(fu.ScheduledTime ?? "-");
                        table.Cell().Text(fu.Status);
                        table.Cell().Text(fu.UserName ?? "-");
                    }
                });

                page.Footer().Text($"Generated on {DateTime.UtcNow:yyyy-MM-dd HH:mm}")
                    .FontSize(10)
                    .AlignCenter();
            });
        });

        return document.GeneratePdf();
    }

    public byte[] GenerateMeetingsPdf(List<MeetingReportDto> meetings)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);

                page.Header().Text("Meetings Report")
                    .FontSize(20)
                    .Bold()
                    .AlignCenter();

                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        header.Cell().Text("Lead").Bold();
                        header.Cell().Text("Title").Bold();
                        header.Cell().Text("Type").Bold();
                        header.Cell().Text("Date").Bold();
                        header.Cell().Text("Status").Bold();
                    });

                    foreach (var m in meetings)
                    {
                        table.Cell().Text(m.LeadName);
                        table.Cell().Text(m.Title);
                        table.Cell().Text(m.MeetingType);
                        table.Cell().Text(m.ScheduledDate.ToString("yyyy-MM-dd HH:mm"));
                        table.Cell().Text(m.SetupStatus);
                    }
                });

                page.Footer().Text($"Generated on {DateTime.UtcNow:yyyy-MM-dd HH:mm}")
                    .FontSize(10)
                    .AlignCenter();
            });
        });

        return document.GeneratePdf();
    }

    public byte[] GenerateAttendancePdf(List<AttendanceReportDto> attendances)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);

                page.Header().Text("Attendance Report")
                    .FontSize(20)
                    .Bold()
                    .AlignCenter();

                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        header.Cell().Text("User").Bold();
                        header.Cell().Text("Date").Bold();
                        header.Cell().Text("Check In").Bold();
                        header.Cell().Text("Check Out").Bold();
                        header.Cell().Text("Hours").Bold();
                        header.Cell().Text("Status").Bold();
                    });

                    foreach (var a in attendances)
                    {
                        table.Cell().Text(a.UserName);
                        table.Cell().Text(a.Date.ToString("yyyy-MM-dd"));
                        table.Cell().Text(a.CheckInTime?.ToString("HH:mm") ?? "-");
                        table.Cell().Text(a.CheckOutTime?.ToString("HH:mm") ?? "-");
                        table.Cell().Text(a.HoursWorked?.ToString("F2") ?? "-");
                        table.Cell().Text(a.Status);
                    }
                });

                page.Footer().Text($"Generated on {DateTime.UtcNow:yyyy-MM-dd HH:mm}")
                    .FontSize(10)
                    .AlignCenter();
            });
        });

        return document.GeneratePdf();
    }

    public byte[] GenerateClientsPdf(List<ClientReportDto> clients)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);

                page.Header().Text("Clients Report")
                    .FontSize(20)
                    .Bold()
                    .AlignCenter();

                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        header.Cell().Text("Company").Bold();
                        header.Cell().Text("Contact").Bold();
                        header.Cell().Text("Email").Bold();
                        header.Cell().Text("Projects").Bold();
                        header.Cell().Text("Revenue").Bold();
                    });

                    foreach (var c in clients)
                    {
                        table.Cell().Text(c.CompanyName);
                        table.Cell().Text(c.ContactName);
                        table.Cell().Text(c.Email ?? "-");
                        table.Cell().Text(c.ProjectCount.ToString());
                        table.Cell().Text(c.TotalRevenue.ToString("C"));
                    }
                });

                page.Footer().Text($"Generated on {DateTime.UtcNow:yyyy-MM-dd HH:mm}")
                    .FontSize(10)
                    .AlignCenter();
            });
        });

        return document.GeneratePdf();
    }

    public byte[] GenerateUsersPdf(List<UserEntryReportDto> users)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);

                page.Header().Text("Users Report")
                    .FontSize(20)
                    .Bold()
                    .AlignCenter();

                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        header.Cell().Text("User").Bold();
                        header.Cell().Text("Email").Bold();
                        header.Cell().Text("Role").Bold();
                        header.Cell().Text("Leads").Bold();
                        header.Cell().Text("Active").Bold();
                    });

                    foreach (var u in users)
                    {
                        table.Cell().Text(u.UserName);
                        table.Cell().Text(u.Email);
                        table.Cell().Text(u.Role ?? "-");
                        table.Cell().Text(u.TotalLeadsAssigned.ToString());
                        table.Cell().Text(u.IsActive ? "Yes" : "No");
                    }
                });

                page.Footer().Text($"Generated on {DateTime.UtcNow:yyyy-MM-dd HH:mm}")
                    .FontSize(10)
                    .AlignCenter();
            });
        });

        return document.GeneratePdf();
    }
}
