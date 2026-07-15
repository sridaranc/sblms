using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Domain.Common;
using SBLMS.Domain.Entities;

namespace SBLMS.Infrastructure.Persistence;

public class SBLMSDbContext : DbContext, IApplicationDbContext
{
    public SBLMSDbContext(DbContextOptions<SBLMSDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<LeadAddress> LeadAddresses => Set<LeadAddress>();
    public DbSet<LeadContactPerson> LeadContactPersons => Set<LeadContactPerson>();
    public DbSet<LeadAssignment> LeadAssignments => Set<LeadAssignment>();
    public DbSet<FollowUp> FollowUps => Set<FollowUp>();
    public DbSet<Meeting> Meetings => Set<Meeting>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<FileAttachment> FileAttachments => Set<FileAttachment>();
    public DbSet<AiLeadRequest> AiLeadRequests => Set<AiLeadRequest>();
    public DbSet<AiLeadResult> AiLeadResults => Set<AiLeadResult>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<ClientProject> ClientProjects => Set<ClientProject>();
    public DbSet<FaceEnrolment> FaceEnrolments => Set<FaceEnrolment>();
    public DbSet<Attendance> Attendances => Set<Attendance>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SBLMSDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
