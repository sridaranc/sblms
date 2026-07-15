using FluentAssertions;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Domain.Tests.Enums;

public class EnumTests
{
    [Fact]
    public void LeadStatus_ShouldHaveAllValues()
    {
        var values = Enum.GetValues<LeadStatus>();
        values.Should().HaveCount(6);
        values.Should().Contain(LeadStatus.New);
        values.Should().Contain(LeadStatus.FollowUp);
        values.Should().Contain(LeadStatus.Contacted);
        values.Should().Contain(LeadStatus.Converted);
        values.Should().Contain(LeadStatus.Lost);
        values.Should().Contain(LeadStatus.Closed);
    }

    [Fact]
    public void UserRole_ShouldHaveAllValues()
    {
        var values = Enum.GetValues<UserRole>();
        values.Should().HaveCount(4);
        values.Should().Contain(UserRole.SuperAdmin);
        values.Should().Contain(UserRole.Admin);
        values.Should().Contain(UserRole.Manager);
        values.Should().Contain(UserRole.Employee);
    }

    [Fact]
    public void FollowUpStatus_ShouldHaveAllValues()
    {
        var values = Enum.GetValues<FollowUpStatus>();
        values.Should().HaveCount(4);
        values.Should().Contain(FollowUpStatus.Pending);
        values.Should().Contain(FollowUpStatus.Completed);
        values.Should().Contain(FollowUpStatus.Cancelled);
        values.Should().Contain(FollowUpStatus.Overdue);
    }

    [Fact]
    public void MeetingStatus_ShouldHaveAllValues()
    {
        var values = Enum.GetValues<MeetingStatus>();
        values.Should().HaveCount(5);
        values.Should().Contain(MeetingStatus.Scheduled);
        values.Should().Contain(MeetingStatus.Completed);
        values.Should().Contain(MeetingStatus.Cancelled);
        values.Should().Contain(MeetingStatus.Rescheduled);
        values.Should().Contain(MeetingStatus.InProgress);
    }

    [Fact]
    public void LeadSource_ShouldHaveAllValues()
    {
        var values = Enum.GetValues<LeadSource>();
        values.Should().HaveCount(6);
        values.Should().Contain(LeadSource.Website);
        values.Should().Contain(LeadSource.Referral);
        values.Should().Contain(LeadSource.SocialMedia);
        values.Should().Contain(LeadSource.ColdCall);
        values.Should().Contain(LeadSource.Advertisement);
        values.Should().Contain(LeadSource.Other);
    }
}
