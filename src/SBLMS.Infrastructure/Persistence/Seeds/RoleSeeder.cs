using Microsoft.EntityFrameworkCore;
using SBLMS.Domain.Common.Enums;
using SBLMS.Domain.Entities;

namespace SBLMS.Infrastructure.Persistence.Seeds;

public static class RoleSeeder
{
    public static async Task SeedAsync(SBLMSDbContext context)
    {
        var existingRoles = await context.Roles.ToListAsync();
        if (existingRoles.Any())
        {
            foreach (var role in existingRoles)
            {
                if (role.Name == AppUserRole.SuperAdmin.ToString())
                {
                    role.Hierarchy = 1;
                    role.IsSystemRole = true;
                }
                else if (role.Name == AppUserRole.Admin.ToString())
                {
                    role.Hierarchy = 2;
                    role.IsSystemRole = true;
                }
                else if (role.Name == AppUserRole.Manager.ToString())
                {
                    role.Hierarchy = 3;
                    role.IsSystemRole = false;
                }
                else if (role.Name == AppUserRole.Employee.ToString())
                {
                    role.Hierarchy = 4;
                    role.IsSystemRole = false;
                }
            }
            await context.SaveChangesAsync();
            return;
        }

        var roles = new List<Role>
        {
            new() { Name = AppUserRole.SuperAdmin.ToString(), Description = "Full system access", Hierarchy = 1, IsSystemRole = true },
            new() { Name = AppUserRole.Admin.ToString(), Description = "Administrative access", Hierarchy = 2, IsSystemRole = true },
            new() { Name = AppUserRole.Manager.ToString(), Description = "Team management access", Hierarchy = 3, IsSystemRole = false },
            new() { Name = AppUserRole.Employee.ToString(), Description = "Standard employee access", Hierarchy = 4, IsSystemRole = false }
        };

        await context.Roles.AddRangeAsync(roles);
        await context.SaveChangesAsync();
    }
}
