using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Leads.DTOs;
using SBLMS.Domain.Common.Enums;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Leads.Commands.AssignLead;

public class AssignLeadCommandHandler : IRequestHandler<AssignLeadCommand, Result<LeadDto>>
{
    private readonly ILeadRepository _leadRepository;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditService _auditService;
    private readonly INotificationService _notificationService;

    public AssignLeadCommandHandler(
        ILeadRepository leadRepository,
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IAuditService auditService,
        INotificationService notificationService)
    {
        _leadRepository = leadRepository;
        _context = context;
        _currentUserService = currentUserService;
        _auditService = auditService;
        _notificationService = notificationService;
    }

    public async Task<Result<LeadDto>> Handle(AssignLeadCommand request, CancellationToken cancellationToken)
    {
        var lead = await _leadRepository.GetWithDetailsAsync(request.LeadId);
        if (lead == null)
            throw new NotFoundException(nameof(Lead), request.LeadId);

        var user = await _context.Users.FindAsync(request.UserId);
        if (user == null)
            throw new NotFoundException(nameof(User), request.UserId);

        var existingAssignment = lead.Assignments
            .FirstOrDefault(a => a.UserId == request.UserId && a.IsActive);

        if (existingAssignment != null)
            return Result<LeadDto>.Failure("This user is already assigned to this lead.");

        var currentActiveAssignment = lead.Assignments.FirstOrDefault(a => a.IsActive);
        if (currentActiveAssignment != null)
        {
            currentActiveAssignment.IsActive = false;
            currentActiveAssignment.UpdatedAt = DateTime.UtcNow;
        }

        var assignment = new LeadAssignment
        {
            LeadId = request.LeadId,
            UserId = request.UserId,
            AssignedBy = _currentUserService.UserId,
            IsActive = true
        };

        _context.LeadAssignments.Add(assignment);

        var activity = new Activity
        {
            LeadId = request.LeadId,
            UserId = _currentUserService.UserId ?? Guid.Empty,
            Type = ActivityType.Assignment,
            Description = $"Lead assigned to {user.FullName}"
        };
        _context.Activities.Add(activity);

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("Assign", "Lead", request.LeadId.ToString(),
            newValues: new { AssignedTo = user.FullName });

        await _notificationService.CreateNotificationAsync(
            request.UserId,
            "Lead Assigned",
            $"You have been assigned to lead {lead.LeadNumber} ({lead.CustomerName})",
            NotificationType.LeadAssigned,
            $"/leads/{lead.Id}");

        var dto = MapToDto(lead, assignment);
        return Result<LeadDto>.Success(dto, "Lead assigned successfully.");
    }

    private static LeadDto MapToDto(Lead lead, LeadAssignment newAssignment)
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
            Assignments = lead.Assignments.Select(a => new LeadAssignmentDto
            {
                Id = a.Id,
                UserId = a.UserId,
                UserName = a.User?.FullName ?? string.Empty,
                AssignedAt = a.AssignedAt,
                IsActive = a.IsActive
            }).ToList()
        };
    }
}
