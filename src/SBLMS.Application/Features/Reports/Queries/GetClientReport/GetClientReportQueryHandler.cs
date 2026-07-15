using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Features.Reports.Queries.GetClientReport;

public class GetClientReportQueryHandler : IRequestHandler<GetClientReportQuery, Result<List<ClientReportDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetClientReportQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<ClientReportDto>>> Handle(GetClientReportQuery request, CancellationToken cancellationToken)
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

        return Result<List<ClientReportDto>>.Success(clients);
    }
}
