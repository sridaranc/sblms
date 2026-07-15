using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Models;
using SBLMS.Domain.Entities;
using SBLMS.Infrastructure.Persistence;
using System.Security.Claims;

namespace SBLMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClientsController : ControllerBase
{
    private readonly SBLMSDbContext _context;

    public ClientsController(SBLMSDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? searchTerm, [FromQuery] string? status, [FromQuery] string? industry)
    {
        var query = _context.Clients
            .Include(c => c.User)
            .Include(c => c.SourceLead)
            .AsQueryable();

        if (!string.IsNullOrEmpty(searchTerm))
            query = query.Where(c => c.CompanyName.Contains(searchTerm) || c.ContactPerson.Contains(searchTerm) || (c.EmailAddress != null && c.EmailAddress.Contains(searchTerm)));

        if (!string.IsNullOrEmpty(status))
            query = query.Where(c => c.Status == status);

        if (!string.IsNullOrEmpty(industry))
            query = query.Where(c => c.Industry == industry);

        var clients = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();

        var result = clients.Select(c => new ClientListDto
        {
            Id = c.Id,
            ClientNumber = c.ClientNumber,
            CompanyName = c.CompanyName,
            ContactPerson = c.ContactPerson,
            EmailAddress = c.EmailAddress,
            Phone = c.Phone,
            Mobile = c.Mobile,
            City = c.City,
            Country = c.Country,
            Industry = c.Industry,
            NatureOfBusiness = c.NatureOfBusiness,
            Status = c.Status,
            CustomerPriority = c.CustomerPriority,
            LifetimeValue = c.LifetimeValue,
            ProjectCount = c.Projects.Count,
            UserName = c.User != null ? c.User.FirstName + " " + c.User.LastName : "Unknown",
            SourceLeadNumber = c.SourceLead?.LeadNumber,
            CreatedAt = c.CreatedAt
        }).ToList();

        return Ok(Result<List<ClientListDto>>.Success(result));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var client = await _context.Clients
            .Include(c => c.Projects)
            .Include(c => c.User)
            .Include(c => c.SourceLead)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (client == null) return NotFound();

        return Ok(Result<ClientDetailDto>.Success(new ClientDetailDto
        {
            Id = client.Id,
            ClientNumber = client.ClientNumber,
            CompanyName = client.CompanyName,
            ContactPerson = client.ContactPerson,
            EmailAddress = client.EmailAddress,
            ContactPersonEmail = client.ContactPersonEmail,
            Phone = client.Phone,
            Mobile = client.Mobile,
            AlternativePhone = client.AlternativePhone,
            Address = client.Address,
            City = client.City,
            State = client.State,
            Country = client.Country,
            PostalCode = client.PostalCode,
            Website = client.Website,
            NatureOfBusiness = client.NatureOfBusiness,
            Industry = client.Industry,
            CompanySize = client.CompanySize,
            BusinessRegistrationNumber = client.BusinessRegistrationNumber,
            TaxIdentificationNumber = client.TaxIdentificationNumber,
            GSTNumber = client.GSTNumber,
            AnnualRevenue = client.AnnualRevenue,
            YearEstablished = client.YearEstablished,
            ContactPersonRole = client.ContactPersonRole,
            ContactPersonPhone = client.ContactPersonPhone,
            SecondaryContactName = client.SecondaryContactName,
            SecondaryContactEmail = client.SecondaryContactEmail,
            SecondaryContactPhone = client.SecondaryContactPhone,
            PreferredCommunication = client.PreferredCommunication,
            PaymentTerms = client.PaymentTerms,
            CreditLimit = client.CreditLimit,
            Currency = client.Currency,
            ContractStartDate = client.ContractStartDate,
            ContractEndDate = client.ContractEndDate,
            LifetimeValue = client.LifetimeValue,
            CustomerPriority = client.CustomerPriority,
            Rating = client.Rating,
            Status = client.Status,
            Tags = client.Tags,
            Notes = client.Notes,
            SourceLeadId = client.SourceLeadId,
            SourceLeadNumber = client.SourceLead?.LeadNumber,
            UserName = client.User?.FirstName + " " + client.User?.LastName,
            CreatedAt = client.CreatedAt,
            UpdatedAt = client.UpdatedAt,
            Projects = client.Projects.Select(p => new ClientProjectDto
            {
                Id = p.Id,
                ProjectName = p.ProjectName,
                Description = p.Description,
                Budget = p.Budget,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                Status = p.Status,
                Notes = p.Notes,
                CreatedAt = p.CreatedAt
            }).ToList()
        }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateClientDto dto)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var clientCount = await _context.Clients.CountAsync();
        var clientNumber = $"CLI-{(clientCount + 1).ToString("D4")}";

        var client = new Client
        {
            ClientNumber = clientNumber,
            CompanyName = dto.CompanyName,
            ContactPerson = dto.ContactPerson,
            EmailAddress = dto.EmailAddress,
            ContactPersonEmail = dto.ContactPersonEmail,
            Phone = dto.Phone,
            Mobile = dto.Mobile,
            AlternativePhone = dto.AlternativePhone,
            Address = dto.Address,
            City = dto.City,
            State = dto.State,
            Country = dto.Country,
            PostalCode = dto.PostalCode,
            Website = dto.Website,
            NatureOfBusiness = dto.NatureOfBusiness,
            Industry = dto.Industry,
            CompanySize = dto.CompanySize,
            BusinessRegistrationNumber = dto.BusinessRegistrationNumber,
            TaxIdentificationNumber = dto.TaxIdentificationNumber,
            GSTNumber = dto.GSTNumber,
            AnnualRevenue = dto.AnnualRevenue,
            YearEstablished = dto.YearEstablished,
            ContactPersonRole = dto.ContactPersonRole,
            ContactPersonPhone = dto.ContactPersonPhone,
            SecondaryContactName = dto.SecondaryContactName,
            SecondaryContactEmail = dto.SecondaryContactEmail,
            SecondaryContactPhone = dto.SecondaryContactPhone,
            PreferredCommunication = dto.PreferredCommunication,
            PaymentTerms = dto.PaymentTerms,
            CreditLimit = dto.CreditLimit,
            Currency = dto.Currency,
            ContractStartDate = dto.ContractStartDate,
            ContractEndDate = dto.ContractEndDate,
            CustomerPriority = dto.CustomerPriority,
            Rating = dto.Rating,
            Status = "Active",
            Tags = dto.Tags,
            Notes = dto.Notes,
            SourceLeadId = dto.SourceLeadId,
            UserId = userId.Value
        };

        _context.Clients.Add(client);
        await _context.SaveChangesAsync();

        return Ok(Result<object>.Success(new { ClientId = client.Id, ClientNumber = client.ClientNumber }));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClientDto dto)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null) return NotFound();

        client.CompanyName = dto.CompanyName;
        client.ContactPerson = dto.ContactPerson;
        client.EmailAddress = dto.EmailAddress;
        client.ContactPersonEmail = dto.ContactPersonEmail;
        client.Phone = dto.Phone;
        client.Mobile = dto.Mobile;
        client.AlternativePhone = dto.AlternativePhone;
        client.Address = dto.Address;
        client.City = dto.City;
        client.State = dto.State;
        client.Country = dto.Country;
        client.PostalCode = dto.PostalCode;
        client.Website = dto.Website;
        client.NatureOfBusiness = dto.NatureOfBusiness;
        client.Industry = dto.Industry;
        client.CompanySize = dto.CompanySize;
        client.BusinessRegistrationNumber = dto.BusinessRegistrationNumber;
        client.TaxIdentificationNumber = dto.TaxIdentificationNumber;
        client.GSTNumber = dto.GSTNumber;
        client.AnnualRevenue = dto.AnnualRevenue;
        client.YearEstablished = dto.YearEstablished;
        client.ContactPersonRole = dto.ContactPersonRole;
        client.ContactPersonPhone = dto.ContactPersonPhone;
        client.SecondaryContactName = dto.SecondaryContactName;
        client.SecondaryContactEmail = dto.SecondaryContactEmail;
        client.SecondaryContactPhone = dto.SecondaryContactPhone;
        client.PreferredCommunication = dto.PreferredCommunication;
        client.PaymentTerms = dto.PaymentTerms;
        client.CreditLimit = dto.CreditLimit;
        client.Currency = dto.Currency;
        client.ContractStartDate = dto.ContractStartDate;
        client.ContractEndDate = dto.ContractEndDate;
        client.CustomerPriority = dto.CustomerPriority;
        client.Rating = dto.Rating;
        client.Status = dto.Status;
        client.Tags = dto.Tags;
        client.Notes = dto.Notes;
        client.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(Result<object>.Success(new { ClientId = client.Id, ClientNumber = client.ClientNumber }));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null) return NotFound();

        _context.Clients.Remove(client);
        await _context.SaveChangesAsync();

        return Ok(Result<bool>.Success(true, "Client deleted successfully."));
    }

    [HttpPost("{id}/projects")]
    public async Task<IActionResult> AddProject(Guid id, [FromBody] CreateProjectDto dto)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null) return NotFound();

        var project = new ClientProject
        {
            ClientId = id,
            ProjectName = dto.ProjectName,
            Description = dto.Description,
            Budget = dto.Budget,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Status = "Planning",
            Notes = dto.Notes
        };

        _context.ClientProjects.Add(project);
        await _context.SaveChangesAsync();

        return Ok(Result<object>.Success(new { ProjectId = project.Id }));
    }

    [HttpPut("{id}/projects/{projectId}")]
    public async Task<IActionResult> UpdateProject(Guid id, Guid projectId, [FromBody] CreateProjectDto dto)
    {
        var project = await _context.ClientProjects.FirstOrDefaultAsync(p => p.Id == projectId && p.ClientId == id);
        if (project == null) return NotFound();

        project.ProjectName = dto.ProjectName;
        project.Description = dto.Description;
        project.Budget = dto.Budget;
        project.StartDate = dto.StartDate;
        project.EndDate = dto.EndDate;
        project.Notes = dto.Notes;
        project.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(Result<object>.Success(new { ProjectId = project.Id }));
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var totalClients = await _context.Clients.CountAsync();
        var activeClients = await _context.Clients.CountAsync(c => c.Status == "Active");
        var totalProjects = await _context.ClientProjects.CountAsync();
        var activeProjects = await _context.ClientProjects.CountAsync(p => p.Status == "Active");
        var totalValue = await _context.Clients.SumAsync(c => c.LifetimeValue ?? 0);

        return Ok(Result<object>.Success(new
        {
            TotalClients = totalClients,
            ActiveClients = activeClients,
            TotalProjects = totalProjects,
            ActiveProjects = activeProjects,
            TotalValue = totalValue
        }));
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null ? Guid.Parse(claim.Value) : null;
    }
}

public class ClientListDto
{
    public Guid Id { get; set; }
    public string ClientNumber { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string? EmailAddress { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? Industry { get; set; }
    public string? NatureOfBusiness { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? CustomerPriority { get; set; }
    public decimal? LifetimeValue { get; set; }
    public int ProjectCount { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? SourceLeadNumber { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ClientDetailDto
{
    public Guid Id { get; set; }
    public string ClientNumber { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string? EmailAddress { get; set; }
    public string? ContactPersonEmail { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? AlternativePhone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public string? Website { get; set; }
    public string? NatureOfBusiness { get; set; }
    public string? Industry { get; set; }
    public string? CompanySize { get; set; }
    public string? BusinessRegistrationNumber { get; set; }
    public string? TaxIdentificationNumber { get; set; }
    public string? GSTNumber { get; set; }
    public string? AnnualRevenue { get; set; }
    public string? YearEstablished { get; set; }
    public string? ContactPersonRole { get; set; }
    public string? ContactPersonPhone { get; set; }
    public string? SecondaryContactName { get; set; }
    public string? SecondaryContactEmail { get; set; }
    public string? SecondaryContactPhone { get; set; }
    public string? PreferredCommunication { get; set; }
    public string? PaymentTerms { get; set; }
    public string? CreditLimit { get; set; }
    public string? Currency { get; set; }
    public string? ContractStartDate { get; set; }
    public string? ContractEndDate { get; set; }
    public decimal? LifetimeValue { get; set; }
    public string? CustomerPriority { get; set; }
    public string? Rating { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Tags { get; set; }
    public string? Notes { get; set; }
    public Guid? SourceLeadId { get; set; }
    public string? SourceLeadNumber { get; set; }
    public string? UserName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<ClientProjectDto> Projects { get; set; } = new();
}

public class ClientProjectDto
{
    public Guid Id { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? Budget { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateClientDto
{
    public string CompanyName { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string? EmailAddress { get; set; }
    public string? ContactPersonEmail { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? AlternativePhone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public string? Website { get; set; }
    public string? NatureOfBusiness { get; set; }
    public string? Industry { get; set; }
    public string? CompanySize { get; set; }
    public string? BusinessRegistrationNumber { get; set; }
    public string? TaxIdentificationNumber { get; set; }
    public string? GSTNumber { get; set; }
    public string? AnnualRevenue { get; set; }
    public string? YearEstablished { get; set; }
    public string? ContactPersonRole { get; set; }
    public string? ContactPersonPhone { get; set; }
    public string? SecondaryContactName { get; set; }
    public string? SecondaryContactEmail { get; set; }
    public string? SecondaryContactPhone { get; set; }
    public string? PreferredCommunication { get; set; }
    public string? PaymentTerms { get; set; }
    public string? CreditLimit { get; set; }
    public string? Currency { get; set; }
    public string? ContractStartDate { get; set; }
    public string? ContractEndDate { get; set; }
    public string? CustomerPriority { get; set; }
    public string? Rating { get; set; }
    public string? Tags { get; set; }
    public string? Notes { get; set; }
    public Guid? SourceLeadId { get; set; }
}

public class UpdateClientDto
{
    public string CompanyName { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string? EmailAddress { get; set; }
    public string? ContactPersonEmail { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? AlternativePhone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public string? Website { get; set; }
    public string? NatureOfBusiness { get; set; }
    public string? Industry { get; set; }
    public string? CompanySize { get; set; }
    public string? BusinessRegistrationNumber { get; set; }
    public string? TaxIdentificationNumber { get; set; }
    public string? GSTNumber { get; set; }
    public string? AnnualRevenue { get; set; }
    public string? YearEstablished { get; set; }
    public string? ContactPersonRole { get; set; }
    public string? ContactPersonPhone { get; set; }
    public string? SecondaryContactName { get; set; }
    public string? SecondaryContactEmail { get; set; }
    public string? SecondaryContactPhone { get; set; }
    public string? PreferredCommunication { get; set; }
    public string? PaymentTerms { get; set; }
    public string? CreditLimit { get; set; }
    public string? Currency { get; set; }
    public string? ContractStartDate { get; set; }
    public string? ContractEndDate { get; set; }
    public string? CustomerPriority { get; set; }
    public string? Rating { get; set; }
    public string Status { get; set; } = "Active";
    public string? Tags { get; set; }
    public string? Notes { get; set; }
}

public class CreateProjectDto
{
    public string ProjectName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? Budget { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Notes { get; set; }
}
