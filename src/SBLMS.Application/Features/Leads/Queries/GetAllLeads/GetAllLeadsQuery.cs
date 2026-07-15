using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Leads.DTOs;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.Leads.Queries.GetAllLeads;

public class GetAllLeadsQuery : IRequest<Result<List<LeadDto>>>
{
    public string? SearchTerm { get; set; }
    public LeadStatus? Status { get; set; }
    public LeadSource? Source { get; set; }
    public Guid? AssignedToUserId { get; set; }
}
