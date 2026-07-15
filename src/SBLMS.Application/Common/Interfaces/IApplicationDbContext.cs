using Microsoft.EntityFrameworkCore;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<RolePermission> RolePermissions { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Lead> Leads { get; }
    DbSet<LeadAddress> LeadAddresses { get; }
    DbSet<LeadContactPerson> LeadContactPersons { get; }
    DbSet<LeadAssignment> LeadAssignments { get; }
    DbSet<FollowUp> FollowUps { get; }
    DbSet<Meeting> Meetings { get; }
    DbSet<Activity> Activities { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<FileAttachment> FileAttachments { get; }
    DbSet<Client> Clients { get; }
    DbSet<ClientProject> ClientProjects { get; }
    DbSet<FaceEnrolment> FaceEnrolments { get; }
    DbSet<Attendance> Attendances { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
