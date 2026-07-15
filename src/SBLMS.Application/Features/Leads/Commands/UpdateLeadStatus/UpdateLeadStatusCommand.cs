using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Leads.DTOs;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.Leads.Commands.UpdateLeadStatus;

public class UpdateLeadStatusCommand : IRequest<Result<LeadDto>>
{
    public Guid LeadId { get; set; }
    public LeadStatus Status { get; set; }
    public string? Notes { get; set; }
}
