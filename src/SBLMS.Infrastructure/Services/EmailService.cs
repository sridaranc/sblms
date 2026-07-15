using Microsoft.Extensions.Logging;
using SBLMS.Application.Common.Interfaces;

namespace SBLMS.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string to, string subject, string htmlBody)
    {
        _logger.LogInformation("Email sent to {To} with subject: {Subject}", to, subject);
        // TODO: Implement actual SMTP email sending (SendGrid, SMTP, etc.)
        return Task.CompletedTask;
    }

    public Task SendWelcomeEmailAsync(string to, string firstName)
    {
        var subject = "Welcome to SBLMS";
        var body = $"<h1>Welcome {firstName}!</h1><p>Your account has been created successfully.</p>";
        return SendAsync(to, subject, body);
    }

    public Task SendPasswordResetEmailAsync(string to, string resetLink)
    {
        var subject = "Password Reset Request";
        var body = $"<h1>Password Reset</h1><p>Click <a href=\"{resetLink}\">here</a> to reset your password.</p>";
        return SendAsync(to, subject, body);
    }

    public Task SendLeadAssignedEmailAsync(string to, string leadName, string assigneeName)
    {
        var subject = "Lead Assigned to You";
        var body = $"<h1>New Lead Assignment</h1><p>You have been assigned lead '{leadName}' by {assigneeName}.</p>";
        return SendAsync(to, subject, body);
    }

    public Task SendMeetingInvitationAsync(string to, string clientName, string meetingTitle, string meetingType, DateTime meetingDate, int? durationMinutes, string meetingUrl, string organizerName, string? description)
    {
        var subject = $"Meeting Invitation: {meetingTitle}";
        var dateStr = meetingDate.ToString("dddd, MMMM dd, yyyy 'at' h:mm tt");
        var durationStr = durationMinutes.HasValue ? $"{durationMinutes.Value} minutes" : "Duration TBD";
        var meetingLinkSection = !string.IsNullOrEmpty(meetingUrl) && !meetingUrl.StartsWith("Phone") && !meetingUrl.StartsWith("In-person")
            ? $"<div style='margin: 24px 0; text-align: center;'><a href='{meetingUrl}' style='display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;'>Join {meetingType}</a><p style='color: #94a3b8; font-size: 12px; margin-top: 8px;'>Meeting Link: {meetingUrl}</p></div>"
            : $"<div style='margin: 24px 0; padding: 16px; background: #f8fafc; border-radius: 8px; text-align: center;'><p style='font-weight: 600; color: #475569;'>{meetingUrl}</p></div>";

        var body = $@"
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f1f5f9;'>
  <div style='max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);'>
    <div style='background: linear-gradient(135deg, #667eea, #764ba2); padding: 32px; text-align: center;'>
      <h1 style='color: white; margin: 0; font-size: 24px;'>Meeting Invitation</h1>
      <p style='color: rgba(255,255,255,0.8); margin: 8px 0 0;'>{meetingTitle}</p>
    </div>
    <div style='padding: 32px;'>
      <p style='font-size: 16px; color: #334155;'>Dear {clientName},</p>
      <p style='font-size: 14px; color: #64748b; line-height: 1.6;'>You are invited to a meeting scheduled by <strong>{organizerName}</strong>.</p>
      
      <div style='background: #f8fafc; border-radius: 10px; padding: 20px; margin: 24px 0; border-left: 4px solid #667eea;'>
        <table style='width: 100%; border-collapse: collapse;'>
          <tr><td style='padding: 6px 0; color: #94a3b8; font-size: 13px; width: 100px;'>Date</td><td style='padding: 6px 0; color: #1e293b; font-weight: 600; font-size: 14px;'>{dateStr}</td></tr>
          <tr><td style='padding: 6px 0; color: #94a3b8; font-size: 13px;'>Duration</td><td style='padding: 6px 0; color: #1e293b; font-size: 14px;'>{durationStr}</td></tr>
          <tr><td style='padding: 6px 0; color: #94a3b8; font-size: 13px;'>Type</td><td style='padding: 6px 0; color: #1e293b; font-size: 14px;'>{meetingType}</td></tr>
        </table>
      </div>

      {(string.IsNullOrEmpty(description) ? "" : $"<p style='font-size: 14px; color: #64748b; line-height: 1.6; margin: 16px 0;'><strong>Description:</strong><br/>{description}</p>")}

      {meetingLinkSection}

      <div style='text-align: center; margin-top: 24px;'>
        <a href='{meetingUrl}' style='display: inline-block; margin: 0 8px; padding: 10px 24px; background: #10b981; color: white; border-radius: 6px; text-decoration: none; font-weight: 600;'>Accept</a>
        <a href='#' style='display: inline-block; margin: 0 8px; padding: 10px 24px; background: #ef4444; color: white; border-radius: 6px; text-decoration: none; font-weight: 600;'>Decline</a>
      </div>
    </div>
    <div style='background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;'>
      <p style='color: #94a3b8; font-size: 12px; margin: 0;'>SBLMS - Smart Business Lead Management System</p>
    </div>
  </div>
</body>
</html>";

        return SendAsync(to, subject, body);
    }
}
