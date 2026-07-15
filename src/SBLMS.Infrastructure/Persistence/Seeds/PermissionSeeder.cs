using Microsoft.EntityFrameworkCore;
using SBLMS.Domain.Entities;

namespace SBLMS.Infrastructure.Persistence.Seeds;

public static class PermissionSeeder
{
    public static async Task SeedAsync(SBLMSDbContext context)
    {
        if (await context.Permissions.AnyAsync())
            return;

        var permissions = new List<Permission>
        {
            // Leads
            new() { Name = "leads-create", Resource = "leads", Action = "create", Description = "Create leads" },
            new() { Name = "leads-read", Resource = "leads", Action = "read", Description = "View leads" },
            new() { Name = "leads-update", Resource = "leads", Action = "update", Description = "Edit leads" },
            new() { Name = "leads-delete", Resource = "leads", Action = "delete", Description = "Delete leads" },

            // Clients
            new() { Name = "clients-create", Resource = "clients", Action = "create", Description = "Create clients" },
            new() { Name = "clients-read", Resource = "clients", Action = "read", Description = "View clients" },
            new() { Name = "clients-update", Resource = "clients", Action = "update", Description = "Edit clients" },
            new() { Name = "clients-delete", Resource = "clients", Action = "delete", Description = "Delete clients" },

            // Users
            new() { Name = "users-create", Resource = "users", Action = "create", Description = "Create users" },
            new() { Name = "users-read", Resource = "users", Action = "read", Description = "View users" },
            new() { Name = "users-update", Resource = "users", Action = "update", Description = "Edit users" },
            new() { Name = "users-delete", Resource = "users", Action = "delete", Description = "Delete users" },

            // Follow-ups
            new() { Name = "followups-create", Resource = "followups", Action = "create", Description = "Create follow-ups" },
            new() { Name = "followups-read", Resource = "followups", Action = "read", Description = "View follow-ups" },
            new() { Name = "followups-update", Resource = "followups", Action = "update", Description = "Edit follow-ups" },
            new() { Name = "followups-delete", Resource = "followups", Action = "delete", Description = "Delete follow-ups" },

            // Meetings
            new() { Name = "meetings-create", Resource = "meetings", Action = "create", Description = "Create meetings" },
            new() { Name = "meetings-read", Resource = "meetings", Action = "read", Description = "View meetings" },
            new() { Name = "meetings-update", Resource = "meetings", Action = "update", Description = "Edit meetings" },
            new() { Name = "meetings-delete", Resource = "meetings", Action = "delete", Description = "Delete meetings" },

            // Reports
            new() { Name = "reports-read", Resource = "reports", Action = "read", Description = "View reports" },
            new() { Name = "reports-export", Resource = "reports", Action = "export", Description = "Export reports" },

            // Settings
            new() { Name = "settings-read", Resource = "settings", Action = "read", Description = "View settings" },
            new() { Name = "settings-update", Resource = "settings", Action = "update", Description = "Edit settings" },

            // Face Enrolment
            new() { Name = "face-enrolment-read", Resource = "face-enrolment", Action = "read", Description = "View face enrolments" },
            new() { Name = "face-enrolment-create", Resource = "face-enrolment", Action = "create", Description = "Create face enrolments" },
            new() { Name = "face-enrolment-delete", Resource = "face-enrolment", Action = "delete", Description = "Delete face enrolments" },

            // Attendance
            new() { Name = "attendance-read", Resource = "attendance", Action = "read", Description = "View attendance" },
            new() { Name = "attendance-create", Resource = "attendance", Action = "create", Description = "Check in/out" },
            new() { Name = "attendance-update", Resource = "attendance", Action = "update", Description = "Edit attendance" },

            // Notifications
            new() { Name = "notifications-read", Resource = "notifications", Action = "read", Description = "View notifications" },
            new() { Name = "notifications-update", Resource = "notifications", Action = "update", Description = "Mark notifications read" },

            // Roles & Permissions
            new() { Name = "roles-create", Resource = "roles", Action = "create", Description = "Create roles" },
            new() { Name = "roles-read", Resource = "roles", Action = "read", Description = "View roles" },
            new() { Name = "roles-update", Resource = "roles", Action = "update", Description = "Edit roles" },
            new() { Name = "roles-delete", Resource = "roles", Action = "delete", Description = "Delete roles" },

            // Dashboard
            new() { Name = "dashboard-read", Resource = "dashboard", Action = "read", Description = "View dashboard" },

            // Audit Logs
            new() { Name = "audit-logs-read", Resource = "audit-logs", Action = "read", Description = "View audit logs" },
        };

        await context.Permissions.AddRangeAsync(permissions);
        await context.SaveChangesAsync();
    }
}
