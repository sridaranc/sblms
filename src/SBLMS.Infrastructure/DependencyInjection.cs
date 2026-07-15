using Hangfire;
using Hangfire.PostgreSql;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SBLMS.Application.Common.Behaviours;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Domain.Interfaces;
using SBLMS.Infrastructure.Persistence;
using SBLMS.Infrastructure.Repositories;
using SBLMS.Infrastructure.Services;

namespace SBLMS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Database
        services.AddDbContext<SBLMSDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        // Repositories
        services.AddScoped(typeof(SBLMS.Domain.Interfaces.IRepository<>), typeof(Repositories.Repository<>));
        services.AddScoped<IUserRepository, Repositories.UserRepository>();
        services.AddScoped<ILeadRepository, Repositories.LeadRepository>();

        // Services
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<IFileService, FileService>();
        services.AddScoped<IExcelService, ExcelService>();
        services.AddScoped<IPdfService, PdfService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IFaceRecognitionService, FaceRecognitionService>();
        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<SBLMSDbContext>());

        // HttpContext
        services.AddHttpContextAccessor();

        // MediatR Pipeline Behaviors
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(PerformanceBehavior<,>));

        // Hangfire
        services.AddHangfire(config => config
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UsePostgreSqlStorage(options =>
                options.UseNpgsqlConnection(configuration.GetConnectionString("DefaultConnection"))));
        services.AddHangfireServer();

        return services;
    }
}
