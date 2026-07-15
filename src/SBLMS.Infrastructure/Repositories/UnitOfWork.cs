using SBLMS.Domain.Interfaces;
using SBLMS.Infrastructure.Persistence;

namespace SBLMS.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly SBLMSDbContext _context;

    public UnitOfWork(SBLMSDbContext context)
    {
        _context = context;
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
