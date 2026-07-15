using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.Reports.Commands.ExportLeadsToExcel;

public class ExportLeadsToExcelCommandHandler : IRequestHandler<ExportLeadsToExcelCommand, Result<byte[]>>
{
    private readonly IApplicationDbContext _context;
    private readonly IExcelService _excelService;

    public ExportLeadsToExcelCommandHandler(IApplicationDbContext context, IExcelService excelService)
    {
        _context = context;
        _excelService = excelService;
    }

    public async Task<Result<byte[]>> Handle(ExportLeadsToExcelCommand request, CancellationToken cancellationToken)
    {
        var leads = await _context.Leads
            .Select(l => new LeadExportDto
            {
                LeadNumber = l.LeadNumber,
                CustomerName = l.CustomerName,
                CompanyName = l.CompanyName,
                EmailAddress = l.EmailAddress,
                MobileNumber = l.MobileNumber,
                Status = l.Status.ToString(),
                Source = l.Source.ToString(),
                Value = l.Value,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var excelBytes = _excelService.ExportLeadsToExcel(leads);
        return Result<byte[]>.Success(excelBytes);
    }
}
