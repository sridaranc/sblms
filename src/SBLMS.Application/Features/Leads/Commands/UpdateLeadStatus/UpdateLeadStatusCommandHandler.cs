using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Leads.DTOs;
using SBLMS.Domain.Common.Enums;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Leads.Commands.UpdateLeadStatus;

public class UpdateLeadStatusCommandHandler : IRequestHandler<UpdateLeadStatusCommand, Result<LeadDto>>
{
    private readonly ILeadRepository _leadRepository;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditService _auditService;

    public UpdateLeadStatusCommandHandler(
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

    public async Task<Result<LeadDto>> Handle(UpdateLeadStatusCommand request, CancellationToken cancellationToken)
    {
        var lead = await _leadRepository.GetWithDetailsAsync(request.LeadId);
        if (lead == null)
            throw new NotFoundException(nameof(Lead), request.LeadId);

        var oldStatus = lead.Status;
        lead.Status = request.Status;
        lead.UpdatedAt = DateTime.UtcNow;

        var activity = new Activity
        {
            LeadId = request.LeadId,
            UserId = _currentUserService.UserId ?? Guid.Empty,
            Type = ActivityType.StatusChange,
            Description = $"Status changed from {oldStatus} to {request.Status}" +
                          (string.IsNullOrEmpty(request.Notes) ? "" : $". Notes: {request.Notes}")
        };
        _context.Activities.Add(activity);

        Client? createdClient = null;
        if (request.Status == LeadStatus.Converted)
        {
            var existingClient = await _context.Clients
                .FirstOrDefaultAsync(c => c.SourceLeadId == lead.Id, cancellationToken);

            if (existingClient == null)
            {
                var clientCount = await _context.Clients.CountAsync(cancellationToken);
                var clientNumber = $"CLI-{(clientCount + 1).ToString("D4")}";
                var userId = _currentUserService.UserId ?? Guid.Empty;

                createdClient = new Client
                {
                    ClientNumber = clientNumber,
                    CompanyName = lead.CompanyName ?? lead.CustomerName,
                    ContactPerson = lead.CustomerName,
                    EmailAddress = lead.EmailAddress,
                    ContactPersonEmail = lead.EmailAddress,
                    Phone = lead.AlternativeNumber,
                    Mobile = lead.MobileNumber,
                    AlternativePhone = lead.AlternativeNumber,
                    Address = lead.Address,
                    City = lead.City,
                    State = lead.State,
                    Country = lead.Country,
                    PostalCode = lead.PostalCode,
                    Website = lead.Website,
                    NatureOfBusiness = lead.BusinessCategory,
                    Industry = lead.IndustryType,
                    CompanySize = lead.CompanySize,
                    Status = "Active",
                    Notes = lead.Notes,
                    CustomerPriority = lead.CustomerPriority,
                    LifetimeValue = lead.Value,
                    SourceLeadId = lead.Id,
                    UserId = userId
                };

                _context.Clients.Add(createdClient);

                var convertActivity = new Activity
                {
                    LeadId = request.LeadId,
                    UserId = userId,
                    Type = ActivityType.StatusChange,
                    Description = $"Lead converted to Client {clientNumber}"
                };
                _context.Activities.Add(convertActivity);
            }
        }

        await _leadRepository.UpdateAsync(lead);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("UpdateStatus", "Lead", request.LeadId.ToString(),
            oldValues: new { Status = oldStatus },
            newValues: new { Status = request.Status, ClientCreated = createdClient?.ClientNumber });

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
                IsActive = a.IsActive
            }).ToList()
        };

        var message = createdClient != null
            ? $"Lead converted to Client {createdClient.ClientNumber} successfully."
            : "Lead status updated successfully.";

        return Result<LeadDto>.Success(dto, message);
    }
}
