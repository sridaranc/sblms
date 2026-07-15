using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Meetings.DTOs;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Meetings.Queries.GetMeetingById;

public class GetMeetingByIdQueryHandler : IRequestHandler<GetMeetingByIdQuery, Result<MeetingDto>>
{
    private readonly IApplicationDbContext _context;

    public GetMeetingByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<MeetingDto>> Handle(GetMeetingByIdQuery request, CancellationToken cancellationToken)
    {
        var meeting = await _context.Meetings
            .Include(m => m.Lead)
            .Include(m => m.User)
            .FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);

        if (meeting == null)
            throw new NotFoundException(nameof(Meeting), request.Id);

        var dto = new MeetingDto
        {
            Id = meeting.Id,
            LeadId = meeting.LeadId,
            LeadNumber = meeting.Lead.LeadNumber,
            CustomerName = meeting.Lead.CustomerName,
            UserId = meeting.UserId,
            UserName = $"{meeting.User.FirstName} {meeting.User.LastName}",
            Title = meeting.Title,
            Description = meeting.Description,
            ScheduledDate = meeting.ScheduledDate,
            Duration = meeting.Duration,
            Location = meeting.Location,
            MeetingUrl = meeting.MeetingUrl,
            Status = meeting.Status,
            CompletedAt = meeting.CompletedAt,
            CreatedAt = meeting.CreatedAt
        };

        return Result<MeetingDto>.Success(dto);
    }
}
