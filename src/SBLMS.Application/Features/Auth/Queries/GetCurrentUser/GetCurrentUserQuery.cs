using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Auth.Commands.Login;

namespace SBLMS.Application.Features.Auth.Queries.GetCurrentUser;

public class GetCurrentUserQuery : IRequest<Result<UserResponse>>
{
}

public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, Result<UserResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetCurrentUserQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<UserResponse>> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.UserId.HasValue)
            return Result<UserResponse>.Failure("User not authenticated.");

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == _currentUserService.UserId.Value, cancellationToken);

        if (user == null)
            return Result<UserResponse>.Failure("User not found.");

        var response = new UserResponse
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            ProfileImageUrl = user.ProfileImageUrl,
            Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList()
        };

        return Result<UserResponse>.Success(response);
    }
}
