using MediatR;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Leads.DTOs;
using SBLMS.Domain.Common.Enums;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Leads.Commands.UpdateLead;

public class UpdateLeadCommandHandler : IRequestHandler<UpdateLeadCommand, Result<LeadDto>>
{
    private readonly ILeadRepository _leadRepository;
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public UpdateLeadCommandHandler(
        ILeadRepository leadRepository,
        IApplicationDbContext context,
        IAuditService auditService)
    {
        _leadRepository = leadRepository;
        _context = context;
        _auditService = auditService;
    }

    public async Task<Result<LeadDto>> Handle(UpdateLeadCommand request, CancellationToken cancellationToken)
    {
        var lead = await _leadRepository.GetWithDetailsAsync(request.Id);
        if (lead == null)
            throw new NotFoundException(nameof(Lead), request.Id);

        var oldValues = new { lead.CustomerName, lead.Status, lead.Value };

        lead.CompanyName = request.CompanyName;
        lead.CustomerName = request.CustomerName;
        lead.MobileNumber = request.MobileNumber;
        lead.AlternativeNumber = request.AlternativeNumber;
        lead.EmailAddress = request.EmailAddress;
        lead.Address = request.Address;
        lead.City = request.City;
        lead.State = request.State;
        lead.Country = request.Country;
        lead.PostalCode = request.PostalCode;
        lead.IndustryType = request.IndustryType;
        lead.BusinessCategory = request.BusinessCategory;
        lead.CompanySize = request.CompanySize;
        lead.Website = request.Website;
        lead.Source = request.Source;
        lead.ExpectedBudget = request.ExpectedBudget;
        lead.Requirements = request.Requirements;
        lead.Notes = request.Notes;
        lead.CustomerPriority = request.CustomerPriority;
        lead.Value = request.Value;
        lead.TaxId = request.TaxId;
        lead.AnnualRevenue = request.AnnualRevenue;
        lead.EmployeeCount = request.EmployeeCount;
        lead.Fax = request.Fax;
        lead.LinkedInUrl = request.LinkedInUrl;
        lead.SkypeId = request.SkypeId;
        lead.CampaignSource = request.CampaignSource;
        lead.LeadSourceDetails = request.LeadSourceDetails;

        foreach (var addr in lead.Addresses.ToList())
        {
            _context.LeadAddresses.Remove(addr);
        }
        foreach (var cp in lead.ContactPersons.ToList())
        {
            _context.LeadContactPersons.Remove(cp);
        }
        await _context.SaveChangesAsync(cancellationToken);

        var newAddresses = request.Addresses.Select(a => new LeadAddress
        {
            LeadId = lead.Id,
            Label = Enum.TryParse<AddressLabel>(a.Label, true, out var label) ? label : AddressLabel.Address1,
            AddressLine1 = a.AddressLine1,
            AddressLine2 = a.AddressLine2,
            City = a.City,
            State = a.State,
            PostalCode = a.PostalCode,
            Country = a.Country,
            CreatedBy = lead.CreatedBy
        }).ToList();

        var newContacts = request.ContactPersons.Select(cp => new LeadContactPerson
        {
            LeadId = lead.Id,
            SortOrder = cp.SortOrder,
            Name = cp.Name,
            Designation = cp.Designation,
            Phone = cp.Phone,
            Mobile = cp.Mobile,
            Email = cp.Email,
            CreatedBy = lead.CreatedBy
        }).ToList();

        await _context.LeadAddresses.AddRangeAsync(newAddresses);
        await _context.LeadContactPersons.AddRangeAsync(newContacts);
        await _context.SaveChangesAsync(cancellationToken);

        lead.Addresses = newAddresses;
        lead.ContactPersons = newContacts;

        await _auditService.LogAsync("Update", "Lead", lead.Id.ToString(),
            oldValues: oldValues,
            newValues: new { lead.CustomerName, lead.Status, lead.Value });

        var dto = MapToDto(lead);
        return Result<LeadDto>.Success(dto, "Lead updated successfully.");
    }

    private static LeadDto MapToDto(Lead lead)
    {
        return new LeadDto
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
            FollowUpCount = lead.FollowUps.Count,
            MeetingCount = lead.Meetings.Count
        };
    }
}
