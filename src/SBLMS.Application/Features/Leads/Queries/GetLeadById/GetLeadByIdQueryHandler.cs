using MediatR;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Leads.DTOs;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Leads.Queries.GetLeadById;

public class GetLeadByIdQueryHandler : IRequestHandler<GetLeadByIdQuery, Result<LeadDto>>
{
    private readonly ILeadRepository _leadRepository;

    public GetLeadByIdQueryHandler(ILeadRepository leadRepository)
    {
        _leadRepository = leadRepository;
    }

    public async Task<Result<LeadDto>> Handle(GetLeadByIdQuery request, CancellationToken cancellationToken)
    {
        var lead = await _leadRepository.GetWithDetailsAsync(request.Id);
        if (lead == null)
            throw new NotFoundException(nameof(Lead), request.Id);

        var dto = new LeadDto
        {
            Id = lead.Id,
            LeadNumber = lead.LeadNumber,
            CompanyName = lead.CompanyName,
            CustomerName = lead.CustomerName,
            MobileNumber = lead.MobileNumber,
            AlternativeNumber = lead.AlternativeNumber,
            EmailAddress = lead.EmailAddress,
            Address = lead.Address,
            City = lead.City,
            State = lead.State,
            Country = lead.Country,
            PostalCode = lead.PostalCode,
            IndustryType = lead.IndustryType,
            BusinessCategory = lead.BusinessCategory,
            CompanySize = lead.CompanySize,
            Website = lead.Website,
            Source = lead.Source,
            ExpectedBudget = lead.ExpectedBudget,
            Requirements = lead.Requirements,
            Notes = lead.Notes,
            CustomerPriority = lead.CustomerPriority,
            Status = lead.Status,
            Value = lead.Value,
            TaxId = lead.TaxId,
            AnnualRevenue = lead.AnnualRevenue,
            EmployeeCount = lead.EmployeeCount,
            Fax = lead.Fax,
            LinkedInUrl = lead.LinkedInUrl,
            SkypeId = lead.SkypeId,
            CampaignSource = lead.CampaignSource,
            LeadSourceDetails = lead.LeadSourceDetails,
            CreatedAt = lead.CreatedAt,
            UpdatedAt = lead.UpdatedAt,
            Addresses = lead.Addresses.Select(a => new LeadAddressDto
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
            ContactPersons = lead.ContactPersons.Select(cp => new LeadContactPersonDto
            {
                Id = cp.Id,
                SortOrder = cp.SortOrder,
                Name = cp.Name,
                Designation = cp.Designation,
                Phone = cp.Phone,
                Mobile = cp.Mobile,
                Email = cp.Email
            }).ToList(),
            Assignments = lead.Assignments.Select(a => new LeadAssignmentDto
            {
                Id = a.Id,
                UserId = a.UserId,
                UserName = a.User?.FullName ?? string.Empty,
                AssignedAt = a.AssignedAt,
                AssignedByName = a.AssignedBy.HasValue ? "System" : null,
                IsActive = a.IsActive
            }).ToList(),
            FollowUpCount = lead.FollowUps.Count,
            MeetingCount = lead.Meetings.Count
        };

        return Result<LeadDto>.Success(dto);
    }
}
