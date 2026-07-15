using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Leads.DTOs;

namespace SBLMS.Application.Features.Leads.Queries.GetAllLeads;

public class GetAllLeadsQueryHandler : IRequestHandler<GetAllLeadsQuery, Result<List<LeadDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetAllLeadsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<LeadDto>>> Handle(GetAllLeadsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Leads
            .Include(l => l.Addresses)
            .Include(l => l.ContactPersons)
            .Include(l => l.Assignments)
                .ThenInclude(a => a.User)
            .Include(l => l.FollowUps)
            .Include(l => l.Meetings)
            .AsQueryable();

        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchLower = request.SearchTerm.ToLower();
            query = query.Where(l =>
                l.LeadNumber.ToLower().Contains(searchLower) ||
                l.CustomerName.ToLower().Contains(searchLower) ||
                (l.CompanyName != null && l.CompanyName.ToLower().Contains(searchLower)) ||
                (l.EmailAddress != null && l.EmailAddress.ToLower().Contains(searchLower)) ||
                (l.MobileNumber != null && l.MobileNumber.Contains(searchLower)));
        }

        if (request.Status.HasValue)
            query = query.Where(l => l.Status == request.Status.Value);

        if (request.Source.HasValue)
            query = query.Where(l => l.Source == request.Source.Value);

        if (request.AssignedToUserId.HasValue)
            query = query.Where(l => l.Assignments.Any(a => a.UserId == request.AssignedToUserId.Value && a.IsActive));

        var leads = await query
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync(cancellationToken);

        var dtos = leads.Select(l => new LeadDto
        {
            Id = l.Id,
            LeadNumber = l.LeadNumber,
            CompanyName = l.CompanyName,
            CustomerName = l.CustomerName,
            MobileNumber = l.MobileNumber,
            AlternativeNumber = l.AlternativeNumber,
            EmailAddress = l.EmailAddress,
            Address = l.Address,
            City = l.City,
            State = l.State,
            Country = l.Country,
            PostalCode = l.PostalCode,
            IndustryType = l.IndustryType,
            BusinessCategory = l.BusinessCategory,
            CompanySize = l.CompanySize,
            Website = l.Website,
            Source = l.Source,
            ExpectedBudget = l.ExpectedBudget,
            Requirements = l.Requirements,
            Notes = l.Notes,
            CustomerPriority = l.CustomerPriority,
            Status = l.Status,
            Value = l.Value,
            TaxId = l.TaxId,
            AnnualRevenue = l.AnnualRevenue,
            EmployeeCount = l.EmployeeCount,
            Fax = l.Fax,
            LinkedInUrl = l.LinkedInUrl,
            SkypeId = l.SkypeId,
            CampaignSource = l.CampaignSource,
            LeadSourceDetails = l.LeadSourceDetails,
            CreatedAt = l.CreatedAt,
            UpdatedAt = l.UpdatedAt,
            Addresses = l.Addresses.Select(a => new LeadAddressDto
            {
                Id = a.Id,
                Label = a.Label.ToString(),
                AddressLine1 = a.AddressLine1,
                AddressLine2 = a.AddressLine2,
                City = a.City,
                State = a.State,
                PostalCode = a.PostalCode,
                Country = a.Country
            }).ToList(),
            ContactPersons = l.ContactPersons.Select(cp => new LeadContactPersonDto
            {
                Id = cp.Id,
                SortOrder = cp.SortOrder,
                Name = cp.Name,
                Designation = cp.Designation,
                Phone = cp.Phone,
                Mobile = cp.Mobile,
                Email = cp.Email
            }).ToList(),
            Assignments = l.Assignments.Where(a => a.IsActive).Select(a => new LeadAssignmentDto
            {
                Id = a.Id,
                UserId = a.UserId,
                UserName = a.User?.FullName ?? string.Empty,
                AssignedAt = a.AssignedAt,
                IsActive = a.IsActive
            }).ToList(),
            FollowUpCount = l.FollowUps.Count,
            MeetingCount = l.Meetings.Count
        }).ToList();

        return Result<List<LeadDto>>.Success(dtos);
    }
}
