using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Domain.Common.Enums;
using SBLMS.Domain.Entities;
using SBLMS.Infrastructure.Persistence;

namespace SBLMS.Infrastructure.Repositories;

public class LeadRepository : Repository<Lead>, ILeadRepository
{
    public LeadRepository(SBLMSDbContext context) : base(context)
    {
    }

    public async Task<Lead?> GetByNumberAsync(string leadNumber)
    {
        return await _dbSet.FirstOrDefaultAsync(l => l.LeadNumber == leadNumber);
    }

    public async Task<Lead?> GetWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(l => l.Addresses)
            .Include(l => l.ContactPersons)
            .Include(l => l.Assignments)
            .ThenInclude(a => a.User)
            .Include(l => l.FollowUps)
            .Include(l => l.Meetings)
            .Include(l => l.Activities)
            .ThenInclude(a => a.User)
            .FirstOrDefaultAsync(l => l.Id == id);
    }

    public async Task<string> GenerateNextLeadNumberAsync()
    {
        var lastLead = await _dbSet
            .OrderByDescending(l => l.LeadNumber)
            .FirstOrDefaultAsync();

        if (lastLead == null)
            return "LD-00001";

        var lastNumber = int.Parse(lastLead.LeadNumber.Replace("LD-", ""));
        return $"LD-{(lastNumber + 1):D5}";
    }

    public async Task<IEnumerable<Lead>> GetLeadsByStatusAsync(LeadStatus status)
    {
        return await _dbSet.Where(l => l.Status == status).ToListAsync();
    }

    public async Task<IEnumerable<Lead>> GetLeadsByAssigneeAsync(Guid userId)
    {
        return await _dbSet
            .Where(l => l.Assignments.Any(a => a.UserId == userId && a.IsActive))
            .ToListAsync();
    }

    public async Task<int> GetLeadCountByStatusAsync(LeadStatus status)
    {
        return await _dbSet.CountAsync(l => l.Status == status);
    }

    public async Task<int> GetTodayFollowUpsCountAsync()
    {
        var today = DateTime.UtcNow.Date;
        return await _context.FollowUps.CountAsync(f =>
            f.ScheduledDate.Date == today && f.Status == FollowUpStatus.Pending);
    }

    public async Task<int> GetUpcomingMeetingsCountAsync()
    {
        var now = DateTime.UtcNow;
        var endOfDay = now.Date.AddDays(1);
        return await _context.Meetings.CountAsync(m =>
            m.ScheduledDate >= now && m.ScheduledDate <= endOfDay && m.Status == MeetingStatus.Scheduled);
    }
}
