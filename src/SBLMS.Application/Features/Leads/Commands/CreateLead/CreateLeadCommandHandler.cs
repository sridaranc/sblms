using MediatR;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Leads.DTOs;
using SBLMS.Domain.Common.Enums;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Leads.Commands.CreateLead;

public class CreateLeadCommandHandler : IRequestHandler<CreateLeadCommand, Result<LeadDto>>
{
    private readonly ILeadRepository _leadRepository;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditService _auditService;

    public CreateLeadCommandHandler(
        ILeadRepository leadRepository,
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IAuditService auditService)
    {
        _leadRepository = leadRepository;
        _context = context;
        _currentUserService = currentUserService;
        _auditService = auditService;
    }

    public async Task<Result<LeadDto>> Handle(CreateLeadCommand request, CancellationToken cancellationToken)
    {
        var leadNumber = await _leadRepository.GenerateNextLeadNumberAsync();

        var lead = new Lead
        {
            LeadNumber = leadNumber,
            CompanyName = request.CompanyName,
            CustomerName = request.CustomerName,
            MobileNumber = request.MobileNumber,
            AlternativeNumber = request.AlternativeNumber,
            EmailAddress = request.EmailAddress,
            Address = request.Address,
            City = request.City,
            State = request.State,
            Country = request.Country,
            PostalCode = request.PostalCode,
            IndustryType = request.IndustryType,
            BusinessCategory = request.BusinessCategory,
            CompanySize = request.CompanySize,
            Website = request.Website,
            Source = request.Source,
            ExpectedBudget = request.ExpectedBudget,
            Requirements = request.Requirements,
            Notes = request.Notes,
            CustomerPriority = request.CustomerPriority,
            Value = request.Value,
            TaxId = request.TaxId,
            AnnualRevenue = request.AnnualRevenue,
            EmployeeCount = request.EmployeeCount,
            Fax = request.Fax,
            LinkedInUrl = request.LinkedInUrl,
            SkypeId = request.SkypeId,
            CampaignSource = request.CampaignSource,
            LeadSourceDetails = request.LeadSourceDetails,
            Status = LeadStatus.New,
            CreatedBy = _currentUserService.UserId,
            Addresses = request.Addresses.Select(a => new LeadAddress
            {
                Label = Enum.TryParse<AddressLabel>(a.Label, true, out var label) ? label : AddressLabel.Address1,
                AddressLine1 = a.AddressLine1,
                AddressLine2 = a.AddressLine2,
                City = a.City,
                State = a.State,
                PostalCode = a.PostalCode,
                Country = a.Country,
                CreatedBy = _currentUserService.UserId
            }).ToList(),
            ContactPersons = request.ContactPersons.Select(cp => new LeadContactPerson
            {
                SortOrder = cp.SortOrder,
                Name = cp.Name,
                Designation = cp.Designation,
                Phone = cp.Phone,
                Mobile = cp.Mobile,
                Email = cp.Email,
                CreatedBy = _currentUserService.UserId
            }).ToList()
        };

        await _leadRepository.AddAsync(lead);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("Create", "Lead", lead.Id.ToString(),
            newValues: new { lead.LeadNumber, lead.CustomerName, lead.Status });

        var dto = MapToDto(lead);
        return Result<LeadDto>.Success(dto, "Lead created successfully.");
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
