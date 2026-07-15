using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace SBLMS.Api.Tests;

public class AuthControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public AuthControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_ShouldReturnUnauthorized_WhenInvalidCredentials()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "invalid@test.com",
            password = "wrongpassword"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_ShouldReturnToken_WhenValidCredentials()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "admin@sblms.com",
            password = "Admin@123"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadFromJsonAsync<dynamic>();
        Assert.NotNull(content);
    }
}

public class LeadsControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public LeadsControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetLeads_ShouldReturnUnauthorized_WhenNoToken()
    {
        var response = await _client.GetAsync("/api/leads");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}

public class ReportsControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ReportsControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetDashboard_ShouldReturnUnauthorized_WhenNoToken()
    {
        var response = await _client.GetAsync("/api/reports/dashboard");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
