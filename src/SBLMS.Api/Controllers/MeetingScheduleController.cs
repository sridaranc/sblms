using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Domain.Common.Enums;
using SBLMS.Domain.Entities;
using SBLMS.Infrastructure.Persistence;
using System.Security.Claims;

namespace SBLMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MeetingScheduleController : ControllerBase
{
    private readonly SBLMSDbContext _context;
    private readonly IMediator _mediator;
    private readonly IEmailService _emailService;

    public MeetingScheduleController(SBLMSDbContext context, IMediator mediator, IEmailService emailService)
    {
        _context = context;
        _mediator = mediator;
        _emailService = emailService;
    }

    [HttpPost("setup")]
    public async Task<IActionResult> SetupMeeting([FromBody] MeetingSetupDto dto)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var lead = await _context.Leads.FindAsync(dto.LeadId);
        if (lead == null) return NotFound("Lead not found");

        var meetingUrl = GenerateMeetingUrl(dto.MeetingType, dto.Title);

        // Ensure ScheduledDate is UTC for PostgreSQL
        var scheduledDate = dto.ScheduledDate.Kind == DateTimeKind.Utc
            ? dto.ScheduledDate
            : DateTime.SpecifyKind(dto.ScheduledDate, DateTimeKind.Utc);

        var meeting = new Meeting
        {
            LeadId = dto.LeadId,
            UserId = userId.Value,
            Title = dto.Title,
            Description = dto.Description,
            ScheduledDate = scheduledDate,
            Duration = dto.Duration != null ? TimeSpan.FromMinutes(dto.Duration.Value) : null,
            MeetingType = dto.MeetingType,
            ClientEmail = dto.ClientEmail,
            ClientName = dto.ClientName,
            MeetingUrl = meetingUrl,
            SetupStatus = MeetingSetupStatus.Ready,
            SetupByUserId = userId.Value,
            AttendeeEmails = dto.AttendeeEmails,
            AttendeeNames = dto.AttendeeNames,
            Status = MeetingStatus.Scheduled
        };

        _context.Meetings.Add(meeting);

        // Update lead status
        lead.Status = LeadStatus.MeetingScheduled;
        await _context.SaveChangesAsync();

        return Ok(Result<object>.Success(new
        {
            MeetingId = meeting.Id,
            MeetingUrl = meetingUrl,
            SetupStatus = "Ready",
            Message = $"Meeting setup ready via {dto.MeetingType}. Click 'Send to Client' to invite."
        }));
    }

    [HttpPost("send/{meetingId}")]
    public async Task<IActionResult> SendToClient(Guid meetingId)
    {
        var meeting = await _context.Meetings
            .Include(m => m.User)
            .Include(m => m.Lead)
            .FirstOrDefaultAsync(m => m.Id == meetingId);
        if (meeting == null) return NotFound();

        meeting.SentAt = DateTime.UtcNow;
        meeting.SentToEmail = meeting.ClientEmail;
        meeting.SetupStatus = MeetingSetupStatus.SentToClient;
        meeting.ClientResponse = ClientMeetingResponse.Pending;

        await _context.SaveChangesAsync();

        // Send professional email invitation
        if (!string.IsNullOrEmpty(meeting.ClientEmail))
        {
            var organizerName = meeting.User != null ? $"{meeting.User.FirstName} {meeting.User.LastName}" : "Team";
            var clientName = meeting.ClientName ?? meeting.Lead?.CustomerName ?? "Client";
            var durationMinutes = meeting.Duration != null ? (int?)meeting.Duration.Value.TotalMinutes : null;

            await _emailService.SendMeetingInvitationAsync(
                meeting.ClientEmail,
                clientName,
                meeting.Title,
                meeting.MeetingType.ToString(),
                meeting.ScheduledDate,
                durationMinutes,
                meeting.MeetingUrl ?? "",
                organizerName,
                meeting.Description
            );
        }

        return Ok(Result<object>.Success(new
        {
            MeetingId = meeting.Id,
            Status = "SentToClient",
            Message = $"Meeting invitation sent to {meeting.ClientEmail}"
        }));
    }

    [HttpPost("client-respond/{meetingId}")]
    [AllowAnonymous]
    public async Task<IActionResult> ClientRespond(Guid meetingId, [FromBody] ClientResponseDto dto)
    {
        var meeting = await _context.Meetings.FindAsync(meetingId);
        if (meeting == null) return NotFound();

        meeting.ClientResponse = dto.Response;
        meeting.ClientRespondedAt = DateTime.UtcNow;

        if (dto.Response == ClientMeetingResponse.Accepted)
        {
            meeting.SetupStatus = MeetingSetupStatus.Accepted;
            meeting.Status = MeetingStatus.Scheduled;
        }
        else if (dto.Response == ClientMeetingResponse.Declined)
        {
            meeting.SetupStatus = MeetingSetupStatus.Declined;
            meeting.Status = MeetingStatus.Cancelled;
        }

        await _context.SaveChangesAsync();

        return Ok(Result<object>.Success(new
        {
            MeetingId = meeting.Id,
            Response = dto.Response.ToString(),
            Status = meeting.SetupStatus.ToString()
        }));
    }

    [HttpGet("lead/{leadId}")]
    public async Task<IActionResult> GetLeadMeetings(Guid leadId)
    {
        var meetings = await _context.Meetings
            .Include(m => m.User)
            .Include(m => m.SetupByUser)
            .Where(m => m.LeadId == leadId)
            .OrderByDescending(m => m.ScheduledDate)
            .Select(m => new MeetingDetailDto
            {
                Id = m.Id,
                Title = m.Title,
                Description = m.Description,
                ScheduledDate = m.ScheduledDate,
                Duration = m.Duration != null ? (int)m.Duration.Value.TotalMinutes : null,
                MeetingType = m.MeetingType.ToString(),
                MeetingUrl = m.MeetingUrl,
                ClientEmail = m.ClientEmail,
                ClientName = m.ClientName,
                Status = m.Status.ToString(),
                SetupStatus = m.SetupStatus.ToString(),
                SetupByName = m.SetupByUser != null ? m.SetupByUser.FirstName + " " + m.SetupByUser.LastName : "Unknown",
                SentAt = m.SentAt,
                SentToEmail = m.SentToEmail,
                ClientResponse = m.ClientResponse.ToString(),
                ClientRespondedAt = m.ClientRespondedAt,
                AttendeeEmails = m.AttendeeEmails,
                AttendeeNames = m.AttendeeNames,
                CreatedByName = m.User != null ? m.User.FirstName + " " + m.User.LastName : "Unknown",
                CreatedAt = m.CreatedAt
            })
            .ToListAsync();

        return Ok(Result<object>.Success(meetings));
    }

    [HttpGet("{meetingId}")]
    public async Task<IActionResult> GetMeeting(Guid meetingId)
    {
        var meeting = await _context.Meetings
            .Include(m => m.User)
            .Include(m => m.SetupByUser)
            .Include(m => m.Lead)
            .FirstOrDefaultAsync(m => m.Id == meetingId);

        if (meeting == null) return NotFound();

        return Ok(Result<object>.Success(new MeetingDetailDto
        {
            Id = meeting.Id,
            Title = meeting.Title,
            Description = meeting.Description,
            ScheduledDate = meeting.ScheduledDate,
            Duration = meeting.Duration != null ? (int)meeting.Duration.Value.TotalMinutes : null,
            MeetingType = meeting.MeetingType.ToString(),
            MeetingUrl = meeting.MeetingUrl,
            ClientEmail = meeting.ClientEmail,
            ClientName = meeting.ClientName,
            Status = meeting.Status.ToString(),
            SetupStatus = meeting.SetupStatus.ToString(),
            SetupByName = meeting.SetupByUser != null ? meeting.SetupByUser.FirstName + " " + meeting.SetupByUser.LastName : "Unknown",
            SentAt = meeting.SentAt,
            SentToEmail = meeting.SentToEmail,
            ClientResponse = meeting.ClientResponse.ToString(),
            ClientRespondedAt = meeting.ClientRespondedAt,
            AttendeeEmails = meeting.AttendeeEmails,
            AttendeeNames = meeting.AttendeeNames,
            CreatedByName = meeting.User != null ? meeting.User.FirstName + " " + meeting.User.LastName : "Unknown",
            CreatedAt = meeting.CreatedAt,
            LeadCustomerName = meeting.Lead?.CustomerName,
            LeadCompanyName = meeting.Lead?.CompanyName
        }));
    }

    private string GenerateMeetingUrl(MeetingType type, string title)
    {
        var slug = title.ToLower().Replace(" ", "-").Substring(0, Math.Min(title.Length, 20));
        var id = Guid.NewGuid().ToString("N").Substring(0, 10);

        return type switch
        {
            MeetingType.GoogleMeet => $"https://meet.google.com/{id.Substring(0, 3)}-{id.Substring(3, 4)}-{id.Substring(7, 3)}",
            MeetingType.MicrosoftTeams => $"https://teams.microsoft.com/l/meetup-join/{id}",
            MeetingType.Zoom => $"https://zoom.us/j/{10000000000 + Random.Shared.Next(999999999)}?pwd={id}",
            MeetingType.Webex => $"https://.webex.com/meet/{id}",
            MeetingType.PhoneCall => "Phone call to be arranged",
            MeetingType.InPerson => "In-person meeting",
            _ => $"https://meeting.sblms.com/{id}"
        };
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null ? Guid.Parse(claim.Value) : null;
    }
}

public class MeetingSetupDto
{
    public Guid LeadId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime ScheduledDate { get; set; }
    public int? Duration { get; set; }
    public MeetingType MeetingType { get; set; }
    public string? ClientEmail { get; set; }
    public string? ClientName { get; set; }
    public string? AttendeeEmails { get; set; }
    public string? AttendeeNames { get; set; }
}

public class ClientResponseDto
{
    public ClientMeetingResponse Response { get; set; }
}

public class MeetingDetailDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime ScheduledDate { get; set; }
    public int? Duration { get; set; }
    public string MeetingType { get; set; } = string.Empty;
    public string? MeetingUrl { get; set; }
    public string? ClientEmail { get; set; }
    public string? ClientName { get; set; }
    public string Status { get; set; } = string.Empty;
    public string SetupStatus { get; set; } = string.Empty;
    public string? SetupByName { get; set; }
    public DateTime? SentAt { get; set; }
    public string? SentToEmail { get; set; }
    public string ClientResponse { get; set; } = string.Empty;
    public DateTime? ClientRespondedAt { get; set; }
    public string? AttendeeEmails { get; set; }
    public string? AttendeeNames { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? LeadCustomerName { get; set; }
    public string? LeadCompanyName { get; set; }
}
