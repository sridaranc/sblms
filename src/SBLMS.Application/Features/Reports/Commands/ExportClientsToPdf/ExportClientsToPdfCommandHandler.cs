using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Features.Reports.Commands.ExportClientsToPdf;

public class ExportClientsToPdfCommandHandler : IRequestHandler<ExportClientsToPdfCommand, Result<byte[]>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPdfService _pdfService;

    public ExportClientsToPdfCommandHandler(IApplicationDbContext context, IPdfService pdfService)
    {
        _context = context;
        _pdfService = pdfService;
    }

    public async Task<Result<byte[]>> Handle(ExportClientsToPdfCommand request, CancellationToken cancellationToken)
    {
        var clients = await _context.Clients
            .Include(c => c.Projects)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new ClientReportDto
            {
                Id = c.Id,
                CompanyName = c.CompanyName,
                ContactName = c.ContactPerson,
                Email = c.EmailAddress,
                Phone = c.Phone,
                Industry = c.Industry,
                ProjectCount = c.Projects.Count,
                TotalRevenue = c.Projects.Sum(p => p.Budget ?? 0),
                CreatedAt = c.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var pdfBytes = _pdfService.GenerateClientsPdf(clients);
        return Result<byte[]>.Success(pdfBytes);
    }
}
