using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using SBLMS.Infrastructure.Persistence;

namespace SBLMS.Infrastructure;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<SBLMSDbContext>
{
    public SBLMSDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<SBLMSDbContext>();
        optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=SBLMS_Dev;Username=postgres;Password=postgres");
        return new SBLMSDbContext(optionsBuilder.Options);
    }
}
