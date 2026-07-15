using MediatR;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Leads.Commands.DeleteLead;

public class DeleteLeadCommandHandler : IRequestHandler<DeleteLeadCommand, Result<bool>>
{
    private readonly ILeadRepository _leadRepository;
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public DeleteLeadCommandHandler(
        ILeadRepository leadRepository,
        IApplicationDbContext context,
        IAuditService auditService)
    {
        _leadRepository = leadRepository;
        _context = context;
        _auditService = auditService;
    }

    public async Task<Result<bool>> Handle(DeleteLeadCommand request, CancellationToken cancellationToken)
    {
        var lead = await _leadRepository.GetByIdAsync(request.Id);
        if (lead == null)
            throw new NotFoundException(nameof(Lead), request.Id);

        await _leadRepository.DeleteAsync(lead);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("Delete", "Lead", request.Id.ToString(),
            newValues: new { lead.LeadNumber, lead.CustomerName });

        return Result<bool>.Success(true, "Lead deleted successfully.");
    }
}
