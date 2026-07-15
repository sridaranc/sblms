using FluentValidation;

namespace SBLMS.Application.Features.FollowUps.DTOs;

public class CreateFollowUpDtoValidator : AbstractValidator<CreateFollowUpDto>
{
    public CreateFollowUpDtoValidator()
    {
        RuleFor(x => x.LeadId)
            .NotEmpty().WithMessage("Lead ID is required.");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required.");

        RuleFor(x => x.ScheduledDate)
            .NotEmpty().WithMessage("Scheduled date is required.")
            .GreaterThanOrEqualTo(DateTime.Today).WithMessage("Scheduled date must be today or in the future.");

        RuleFor(x => x.ScheduledTime)
            .Matches(@"^([01]?[0-9]|2[0-3]):[0-5][0-9]$").WithMessage("Time must be in HH:mm format.")
            .When(x => !string.IsNullOrEmpty(x.ScheduledTime));

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Notes must not exceed 2000 characters.");
    }
}

public class UpdateFollowUpDtoValidator : AbstractValidator<UpdateFollowUpDto>
{
    public UpdateFollowUpDtoValidator()
    {
        RuleFor(x => x.ScheduledDate)
            .NotEmpty().WithMessage("Scheduled date is required.");

        RuleFor(x => x.ScheduledTime)
            .Matches(@"^([01]?[0-9]|2[0-3]):[0-5][0-9]$").WithMessage("Time must be in HH:mm format.")
            .When(x => !string.IsNullOrEmpty(x.ScheduledTime));

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Notes must not exceed 2000 characters.");
    }
}
