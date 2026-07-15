using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Leads.DTOs;

namespace SBLMS.Application.Features.Leads.Queries.SearchLeads;

public class SearchLeadsQuery : IRequest<Result<List<LeadDto>>>
{
    public string SearchTerm { get; set; } = string.Empty;
}
