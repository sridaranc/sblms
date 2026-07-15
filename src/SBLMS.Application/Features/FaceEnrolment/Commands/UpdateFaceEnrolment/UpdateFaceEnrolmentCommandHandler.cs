using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.FaceEnrolment.Commands.UpdateFaceEnrolment;

public class UpdateFaceEnrolmentCommandHandler : IRequestHandler<UpdateFaceEnrolmentCommand, Result<UpdateFaceEnrolmentResponse>>
{
    private readonly IApplicationDbContext _context;

    public UpdateFaceEnrolmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<UpdateFaceEnrolmentResponse>> Handle(UpdateFaceEnrolmentCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(request.UserId, cancellationToken);
        if (user == null)
            return Result<UpdateFaceEnrolmentResponse>.Failure("User not found.");

        var faceEnrolment = await _context.FaceEnrolments
            .FirstOrDefaultAsync(fe => fe.UserId == request.UserId && fe.IsActive, cancellationToken);

        if (faceEnrolment == null)
            return Result<UpdateFaceEnrolmentResponse>.Failure("No active face enrolment found. Use enrol instead.");

        var faceDescriptorJson = JsonSerializer.Serialize(request.FaceDescriptor);

        faceEnrolment.FaceDescriptor = faceDescriptorJson;
        faceEnrolment.Notes = request.Notes;
        faceEnrolment.UpdatedAt = DateTime.UtcNow;

        _context.FaceEnrolments.Update(faceEnrolment);

        user.FaceDescriptor = faceDescriptorJson;
        user.UpdatedAt = DateTime.UtcNow;
        _context.Users.Update(user);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<UpdateFaceEnrolmentResponse>.Success(new UpdateFaceEnrolmentResponse
        {
            Id = faceEnrolment.Id,
            UserId = faceEnrolment.UserId,
            IsActive = faceEnrolment.IsActive,
            EnrolledAt = faceEnrolment.EnrolledAt ?? DateTime.UtcNow
        }, "Face enrolment updated successfully.");
    }
}
