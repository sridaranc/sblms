using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Features.Reports.Queries.GetDashboardStats;
using SBLMS.Application.Features.Reports.DTOs;
using SBLMS.Domain.Entities;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Tests.Queries;

public class GetDashboardStatsQueryTests
{
    private readonly Mock<IApplicationDbContext> _contextMock;
    private readonly Mock<ILeadRepository> _leadRepositoryMock;
    private readonly GetDashboardStatsQueryHandler _handler;

    public GetDashboardStatsQueryTests()
    {
        _contextMock = new Mock<IApplicationDbContext>();
        _leadRepositoryMock = new Mock<ILeadRepository>();
        _handler = new GetDashboardStatsQueryHandler(_contextMock.Object, _leadRepositoryMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnDashboardStats()
    {
        _leadRepositoryMock.Setup(r => r.CountAsync()).ReturnsAsync(100);
        _leadRepositoryMock.Setup(r => r.GetLeadCountByStatusAsync(LeadStatus.New)).ReturnsAsync(20);
        _leadRepositoryMock.Setup(r => r.GetLeadCountByStatusAsync(LeadStatus.FollowUp)).ReturnsAsync(30);
        _leadRepositoryMock.Setup(r => r.GetLeadCountByStatusAsync(LeadStatus.Converted)).ReturnsAsync(40);
        _leadRepositoryMock.Setup(r => r.GetLeadCountByStatusAsync(LeadStatus.Lost)).ReturnsAsync(10);
        _leadRepositoryMock.Setup(r => r.GetTodayFollowUpsCountAsync()).ReturnsAsync(5);
        _leadRepositoryMock.Setup(r => r.GetUpcomingMeetingsCountAsync()).ReturnsAsync(3);

        var users = new List<User> { new User { IsActive = true } }.AsQueryable();
        _contextMock.Setup(c => c.Users).Returns(MockDbSet(users));

        var leads = new List<Lead>
        {
            new Lead { Value = 10000, Status = LeadStatus.Converted, CreatedAt = DateTime.UtcNow },
            new Lead { Value = 5000, Status = LeadStatus.New, CreatedAt = DateTime.UtcNow }
        }.AsQueryable();
        _contextMock.Setup(c => c.Leads).Returns(MockDbSet(leads));

        var activities = new List<Activity>().AsQueryable();
        _contextMock.Setup(c => c.Activities).Returns(MockDbSet(activities));

        var query = new GetDashboardStatsQuery();
        var result = await _handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.TotalLeads.Should().Be(100);
        result.Data.ConversionRate.Should().Be(40);
    }

    private static DbSet<T> MockDbSet<T>(IQueryable<T> data) where T : class
    {
        var mockSet = new Mock<DbSet<T>>();
        mockSet.As<IQueryable<T>>().Setup(m => m.Provider).Returns(data.Provider);
        mockSet.As<IQueryable<T>>().Setup(m => m.Expression).Returns(data.Expression);
        mockSet.As<IQueryable<T>>().Setup(m => m.ElementType).Returns(data.ElementType);
        mockSet.As<IQueryable<T>>().Setup(m => m.GetEnumerator()).Returns(data.GetEnumerator());
        return mockSet.Object;
    }
}
