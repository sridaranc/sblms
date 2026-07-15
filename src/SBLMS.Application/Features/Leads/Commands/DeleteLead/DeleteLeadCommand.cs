using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Leads.Commands.DeleteLead;

public class DeleteLeadCommand : IRequest<Result<bool>>
{
    public Guid Id { get; set; }
}
