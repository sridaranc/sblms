using MediatR;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Activities.DTOs;
using SBLMS.Domain.Common.Enums;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Activities.Commands.LogActivity;

public class LogActivityCommand : IRequest<Result<ActivityDto>>
{
    public Guid? LeadId { get; set; }
    public ActivityType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Metadata { get; set; }
}
