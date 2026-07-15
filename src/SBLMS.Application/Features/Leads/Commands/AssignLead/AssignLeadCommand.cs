using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Leads.DTOs;

namespace SBLMS.Application.Features.Leads.Commands.AssignLead;

public class AssignLeadCommand : IRequest<Result<LeadDto>>
{
    public Guid LeadId { get; set; }
    public Guid UserId { get; set; }
}
