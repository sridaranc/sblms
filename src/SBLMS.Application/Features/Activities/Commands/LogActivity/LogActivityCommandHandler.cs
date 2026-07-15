using MediatR;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Activities.DTOs;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Activities.Commands.LogActivity;

public class LogActivityCommandHandler : IRequestHandler<LogActivityCommand, Result<ActivityDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public LogActivityCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<ActivityDto>> Handle(LogActivityCommand request, CancellationToken cancellationToken)
    {
        var activity = new Activity
        {
            LeadId = request.LeadId,
            UserId = _currentUserService.UserId ?? Guid.Empty,
            Type = request.Type,
            Description = request.Description,
            Metadata = request.Metadata
        };

        _context.Activities.Add(activity);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = new ActivityDto
        {
            Id = activity.Id,
            LeadId = activity.LeadId,
            UserId = activity.UserId,
            Type = activity.Type,
            Description = activity.Description,
            Metadata = activity.Metadata,
            CreatedAt = activity.CreatedAt
        };

        return Result<ActivityDto>.Success(dto, "Activity logged successfully.");
    }
}
