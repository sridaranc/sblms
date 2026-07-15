using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Leads.DTOs;

namespace SBLMS.Application.Features.Leads.Queries.SearchLeads;

public class SearchLeadsQueryHandler : IRequestHandler<SearchLeadsQuery, Result<List<LeadDto>>>
{
    private readonly IApplicationDbContext _context;

    public SearchLeadsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<LeadDto>>> Handle(SearchLeadsQuery request, CancellationToken cancellationToken)
    {
        var searchLower = request.SearchTerm.ToLower();

        var leads = await _context.Leads
            .Include(l => l.Assignments)
                .ThenInclude(a => a.User)
            .Where(l =>
                l.LeadNumber.ToLower().Contains(searchLower) ||
                l.CustomerName.ToLower().Contains(searchLower) ||
                (l.CompanyName != null && l.CompanyName.ToLower().Contains(searchLower)) ||
                (l.EmailAddress != null && l.EmailAddress.ToLower().Contains(searchLower)) ||
                (l.MobileNumber != null && l.MobileNumber.Contains(searchLower)) ||
                (l.City != null && l.City.ToLower().Contains(searchLower)) ||
                (l.State != null && l.State.ToLower().Contains(searchLower)))
            .OrderByDescending(l => l.CreatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);

        var dtos = leads.Select(l => new LeadDto
        {
            Id = l.Id,
            LeadNumber = l.LeadNumber,
            CompanyName = l.CompanyName,
            CustomerName = l.CustomerName,
            MobileNumber = l.MobileNumber,
            EmailAddress = l.EmailAddress,
            City = l.City,
            State = l.State,
            Source = l.Source,
            Status = l.Status,
            Value = l.Value,
            TaxId = l.TaxId,
            AnnualRevenue = l.AnnualRevenue,
            EmployeeCount = l.EmployeeCount,
            CreatedAt = l.CreatedAt,
            Assignments = l.Assignments.Where(a => a.IsActive).Select(a => new LeadAssignmentDto
            {
                UserId = a.UserId,
                UserName = a.User?.FullName ?? string.Empty
            }).ToList()
        }).ToList();

        return Result<List<LeadDto>>.Success(dtos);
    }
}
