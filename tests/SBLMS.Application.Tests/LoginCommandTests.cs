using FluentAssertions;
using MediatR;
using Moq;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Auth.Commands.Login;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Tests.Commands;

public class LoginCommandTests
{
    private readonly Mock<IApplicationDbContext> _contextMock;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly LoginCommandHandler _handler;

    public LoginCommandTests()
    {
        _contextMock = new Mock<IApplicationDbContext>();
        _jwtServiceMock = new Mock<IJwtService>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _handler = new LoginCommandHandler(_contextMock.Object, _jwtServiceMock.Object, _passwordHasherMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnTokens_WhenValidCredentials()
    {
        var command = new LoginCommand
        {
            Email = "admin@sblms.com",
            Password = "Admin@123"
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@sblms.com",
            FirstName = "Admin",
            LastName = "User",
            PasswordHash = "hashed",
            Role = SBLMS.Domain.Common.Enums.UserRole.SuperAdmin,
            IsActive = true
        };

        _contextMock.Setup(c => c.Users.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>()))
            .ReturnsAsync(user);
        _passwordHasherMock.Verify(h => h.VerifyPassword("Admin@123", "hashed"), Times.Once);
        _jwtServiceMock.Setup(j => j.GenerateAccessTokenAsync(user)).ReturnsAsync("access-token");
        _jwtServiceMock.Setup(j => j.GenerateRefreshTokenAsync(user)).ReturnsAsync("refresh-token");
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data!.AccessToken.Should().Be("access-token");
        result.Data.RefreshToken.Should().Be("refresh-token");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenUserNotFound()
    {
        var command = new LoginCommand
        {
            Email = "nonexistent@test.com",
            Password = "password"
        };

        _contextMock.Setup(c => c.Users.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>()))
            .ReturnsAsync((User?)null);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Invalid");
    }
}
