using FluentAssertions;
using SBLMS.Domain.Entities;

namespace SBLMS.Domain.Tests.Entities;

public class LeadTests
{
    [Fact]
    public void Lead_ShouldHaveDefaultValues()
    {
        var lead = new Lead();
        lead.Id.Should().NotBe(Guid.Empty);
        lead.Status.Should().Be(SBLMS.Domain.Common.Enums.LeadStatus.New);
        lead.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Lead_ShouldSetProperties()
    {
        var lead = new Lead
        {
            CustomerName = "John Doe",
            CompanyName = "Acme Corp",
            EmailAddress = "john@acme.com",
            MobileNumber = "+1234567890",
            Source = SBLMS.Domain.Common.Enums.LeadSource.Website,
            Value = 50000,
            Status = SBLMS.Domain.Common.Enums.LeadStatus.FollowUp
        };

        lead.CustomerName.Should().Be("John Doe");
        lead.CompanyName.Should().Be("Acme Corp");
        lead.EmailAddress.Should().Be("john@acme.com");
        lead.MobileNumber.Should().Be("+1234567890");
        lead.Source.Should().Be(SBLMS.Domain.Common.Enums.LeadSource.Website);
        lead.Value.Should().Be(50000);
        lead.Status.Should().Be(SBLMS.Domain.Common.Enums.LeadStatus.FollowUp);
    }

    [Fact]
    public void Lead_CanBeConverted()
    {
        var lead = new Lead { Status = SBLMS.Domain.Common.Enums.LeadStatus.New };
        lead.Status = SBLMS.Domain.Common.Enums.LeadStatus.Converted;
        lead.Status.Should().Be(SBLMS.Domain.Common.Enums.LeadStatus.Converted);
    }

    [Fact]
    public void Lead_CanBeLost()
    {
        var lead = new Lead { Status = SBLMS.Domain.Common.Enums.LeadStatus.FollowUp };
        lead.Status = SBLMS.Domain.Common.Enums.LeadStatus.Lost;
        lead.Status.Should().Be(SBLMS.Domain.Common.Enums.LeadStatus.Lost);
    }
}

public class UserTests
{
    [Fact]
    public void User_ShouldHaveDefaultValues()
    {
        var user = new User();
        user.Id.Should().NotBe(Guid.Empty);
        user.IsActive.Should().BeTrue();
        user.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void User_FullName_ShouldCombineFirstAndLastName()
    {
        var user = new User { FirstName = "John", LastName = "Doe" };
        user.FullName.Should().Be("John Doe");
    }

    [Fact]
    public void User_ShouldSetRole()
    {
        var user = new User { Role = SBLMS.Domain.Common.Enums.UserRole.Admin };
        user.Role.Should().Be(SBLMS.Domain.Common.Enums.UserRole.Admin);
    }
}

public class FollowUpTests
{
    [Fact]
    public void FollowUp_ShouldHaveDefaultValues()
    {
        var followUp = new FollowUp();
        followUp.Id.Should().NotBe(Guid.Empty);
        followUp.Status.Should().Be(SBLMS.Domain.Common.Enums.FollowUpStatus.Pending);
    }

    [Fact]
    public void FollowUp_CanBeCompleted()
    {
        var followUp = new FollowUp { Status = SBLMS.Domain.Common.Enums.FollowUpStatus.Pending };
        followUp.Status = SBLMS.Domain.Common.Enums.FollowUpStatus.Completed;
        followUp.CompletedAt = DateTime.UtcNow;
        followUp.Status.Should().Be(SBLMS.Domain.Common.Enums.FollowUpStatus.Completed);
        followUp.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public void FollowUp_CanBeCancelled()
    {
        var followUp = new FollowUp { Status = SBLMS.Domain.Common.Enums.FollowUpStatus.Pending };
        followUp.Status = SBLMS.Domain.Common.Enums.FollowUpStatus.Cancelled;
        followUp.Status.Should().Be(SBLMS.Domain.Common.Enums.FollowUpStatus.Cancelled);
    }
}

public class MeetingTests
{
    [Fact]
    public void Meeting_ShouldHaveDefaultValues()
    {
        var meeting = new Meeting();
        meeting.Id.Should().NotBe(Guid.Empty);
        meeting.Status.Should().Be(SBLMS.Domain.Common.Enums.MeetingStatus.Scheduled);
    }

    [Fact]
    public void Meeting_CanBeCompleted()
    {
        var meeting = new Meeting { Status = SBLMS.Domain.Common.Enums.MeetingStatus.Scheduled };
        meeting.Status = SBLMS.Domain.Common.Enums.MeetingStatus.Completed;
        meeting.CompletedAt = DateTime.UtcNow;
        meeting.Status.Should().Be(SBLMS.Domain.Common.Enums.MeetingStatus.Completed);
        meeting.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public void Meeting_CanBeCancelled()
    {
        var meeting = new Meeting { Status = SBLMS.Domain.Common.Enums.MeetingStatus.Scheduled };
        meeting.Status = SBLMS.Domain.Common.Enums.MeetingStatus.Cancelled;
        meeting.Status.Should().Be(SBLMS.Domain.Common.Enums.MeetingStatus.Cancelled);
    }
}

public class NotificationTests
{
    [Fact]
    public void Notification_ShouldHaveDefaultValues()
    {
        var notification = new Notification();
        notification.Id.Should().NotBe(Guid.Empty);
        notification.IsRead.Should().BeFalse();
    }

    [Fact]
    public void Notification_CanBeMarkedAsRead()
    {
        var notification = new Notification { IsRead = false };
        notification.IsRead = true;
        notification.IsRead.Should().BeTrue();
    }
}

public class AuditLogTests
{
    [Fact]
    public void AuditLog_ShouldHaveDefaultValues()
    {
        var auditLog = new AuditLog();
        auditLog.Id.Should().NotBe(Guid.Empty);
        auditLog.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void AuditLog_ShouldStoreValues()
    {
        var auditLog = new AuditLog
        {
            EntityName = "Lead",
            EntityId = "123",
            Action = "Create",
            OldValues = "{}",
            NewValues = "{\"Name\":\"Test\"}"
        };

        auditLog.EntityName.Should().Be("Lead");
        auditLog.EntityId.Should().Be("123");
        auditLog.Action.Should().Be("Create");
        auditLog.OldValues.Should().Be("{}");
        auditLog.NewValues.Should().Be("{\"Name\":\"Test\"}");
    }
}
