using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.FaceEnrolment.Commands.RemoveFaceEnrolment;

public class RemoveFaceEnrolmentCommandHandler : IRequestHandler<RemoveFaceEnrolmentCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public RemoveFaceEnrolmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(RemoveFaceEnrolmentCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(request.UserId, cancellationToken);
        if (user == null)
            return Result<bool>.Failure("User not found.");

        var faceEnrolment = await _context.FaceEnrolments
            .FirstOrDefaultAsync(fe => fe.UserId == request.UserId && fe.IsActive, cancellationToken);

        if (faceEnrolment == null)
            return Result<bool>.Failure("No active face enrolment found.");

        faceEnrolment.IsActive = false;
        faceEnrolment.UpdatedAt = DateTime.UtcNow;
        _context.FaceEnrolments.Update(faceEnrolment);

        user.FaceDescriptor = null;
        user.HasFaceDescriptor = false;
        user.FaceEnrolledAt = null;
        user.UpdatedAt = DateTime.UtcNow;
        _context.Users.Update(user);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true, "Face enrolment removed successfully.");
    }
}
