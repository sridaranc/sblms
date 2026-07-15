using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Domain.Common.Enums;
using SBLMS.Domain.Entities;

namespace SBLMS.Infrastructure.Persistence.Seeds;

public static class UserSeeder
{
    public static async Task SeedAsync(SBLMSDbContext context, IPasswordHasher passwordHasher)
    {
        var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == AppUserRole.Admin.ToString());
        if (adminRole == null) return;

        var existingAdmin = await context.Users.FirstOrDefaultAsync(u => u.Email == "sri@sblms.com");
        if (existingAdmin != null)
        {
            existingAdmin.PasswordHash = passwordHasher.HashPassword("Sri@123");
            existingAdmin.FirstName = "Sri";
            existingAdmin.LastName = "Admin";
            await context.SaveChangesAsync();
            return;
        }

        var adminUser = new User
        {
            Email = "sri@sblms.com",
            PasswordHash = passwordHasher.HashPassword("Sri@123"),
            FirstName = "Sri",
            LastName = "Admin",
            IsActive = true
        };

        await context.Users.AddAsync(adminUser);
        await context.SaveChangesAsync();

        var userRole = new UserRole
        {
            UserId = adminUser.Id,
            RoleId = adminRole.Id,
            AssignedAt = DateTime.UtcNow
        };

        await context.UserRoles.AddAsync(userRole);
        await context.SaveChangesAsync();
    }
}
