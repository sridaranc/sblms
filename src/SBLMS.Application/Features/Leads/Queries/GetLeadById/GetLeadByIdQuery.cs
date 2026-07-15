using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Leads.DTOs;

namespace SBLMS.Application.Features.Leads.Queries.GetLeadById;

public class GetLeadByIdQuery : IRequest<Result<LeadDto>>
{
    public Guid Id { get; set; }
}
