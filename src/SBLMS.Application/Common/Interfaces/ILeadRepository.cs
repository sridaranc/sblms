using SBLMS.Domain.Common.Enums;
using SBLMS.Domain.Common;
using SBLMS.Domain.Entities;
using SBLMS.Domain.Interfaces;

namespace SBLMS.Application.Common.Interfaces;

public interface ILeadRepository : IRepository<Lead>
{
    Task<Lead?> GetByNumberAsync(string leadNumber);
    Task<Lead?> GetWithDetailsAsync(Guid id);
    Task<string> GenerateNextLeadNumberAsync();
    Task<IEnumerable<Lead>> GetLeadsByStatusAsync(LeadStatus status);
    Task<IEnumerable<Lead>> GetLeadsByAssigneeAsync(Guid userId);
    Task<int> GetLeadCountByStatusAsync(LeadStatus status);
    Task<int> GetTodayFollowUpsCountAsync();
    Task<int> GetUpcomingMeetingsCountAsync();
}
