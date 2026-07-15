using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Features.Reports.Commands.ExportClientsToExcel;

public class ExportClientsToExcelCommandHandler : IRequestHandler<ExportClientsToExcelCommand, Result<byte[]>>
{
    private readonly IApplicationDbContext _context;
    private readonly IExcelService _excelService;

    public ExportClientsToExcelCommandHandler(IApplicationDbContext context, IExcelService excelService)
    {
        _context = context;
        _excelService = excelService;
    }

    public async Task<Result<byte[]>> Handle(ExportClientsToExcelCommand request, CancellationToken cancellationToken)
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

        var excelBytes = _excelService.ExportClientsToExcel(clients);
        return Result<byte[]>.Success(excelBytes);
    }
}
