namespace SBLMS.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendAsync(string to, string subject, string htmlBody);
    Task SendWelcomeEmailAsync(string to, string firstName);
    Task SendPasswordResetEmailAsync(string to, string resetLink);
    Task SendLeadAssignedEmailAsync(string to, string leadName, string assigneeName);
    Task SendMeetingInvitationAsync(string to, string clientName, string meetingTitle, string meetingType, DateTime meetingDate, int? durationMinutes, string meetingUrl, string organizerName, string? description);
}
