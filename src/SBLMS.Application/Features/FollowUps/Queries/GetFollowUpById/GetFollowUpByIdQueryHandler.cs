using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.FollowUps.DTOs;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.FollowUps.Queries.GetFollowUpById;

public class GetFollowUpByIdQueryHandler : IRequestHandler<GetFollowUpByIdQuery, Result<FollowUpDto>>
{
    private readonly IApplicationDbContext _context;

    public GetFollowUpByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<FollowUpDto>> Handle(GetFollowUpByIdQuery request, CancellationToken cancellationToken)
    {
        var followUp = await _context.FollowUps
            .Include(fu => fu.Lead)
            .Include(fu => fu.User)
            .FirstOrDefaultAsync(fu => fu.Id == request.Id, cancellationToken);

        if (followUp == null)
            throw new NotFoundException(nameof(FollowUp), request.Id);

        var dto = new FollowUpDto
        {
            Id = followUp.Id,
            LeadId = followUp.LeadId,
            LeadNumber = followUp.Lead.LeadNumber,
            CustomerName = followUp.Lead.CustomerName,
            UserId = followUp.UserId,
            UserName = $"{followUp.User.FirstName} {followUp.User.LastName}",
            ScheduledDate = followUp.ScheduledDate,
            ScheduledTime = followUp.ScheduledTime,
            Status = followUp.Status,
            Notes = followUp.Notes,
            Outcome = followUp.Outcome,
            CompletedAt = followUp.CompletedAt,
            CreatedAt = followUp.CreatedAt
        };

        return Result<FollowUpDto>.Success(dto);
    }
}
