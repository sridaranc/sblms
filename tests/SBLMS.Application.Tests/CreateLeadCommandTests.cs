using FluentAssertions;
using MediatR;
using Moq;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Leads.Commands.CreateLead;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Tests.Commands;

public class CreateLeadCommandTests
{
    private readonly Mock<IApplicationDbContext> _contextMock;
    private readonly Mock<ILeadRepository> _leadRepositoryMock;
    private readonly CreateLeadCommandHandler _handler;

    public CreateLeadCommandTests()
    {
        _contextMock = new Mock<IApplicationDbContext>();
        _leadRepositoryMock = new Mock<ILeadRepository>();
        _handler = new CreateLeadCommandHandler(_contextMock.Object, _leadRepositoryMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldCreateLead_WhenValidCommand()
    {
        var command = new CreateLeadCommand
        {
            CustomerName = "John Doe",
            CompanyName = "Acme Corp",
            EmailAddress = "john@acme.com",
            Source = SBLMS.Domain.Common.Enums.LeadSource.Website,
            Value = 50000
        };

        _leadRepositoryMock.Setup(r => r.GenerateLeadNumberAsync()).ReturnsAsync("LD-000001");
        _contextMock.Setup(c => c.Leads.AddAsync(It.IsAny<Lead>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.CustomerName.Should().Be("John Doe");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenSaveFails()
    {
        var command = new CreateLeadCommand
        {
            CustomerName = "John Doe",
            Source = SBLMS.Domain.Common.Enums.LeadSource.Website
        };

        _leadRepositoryMock.Setup(r => r.GenerateLeadNumberAsync()).ReturnsAsync("LD-000001");
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }
}
