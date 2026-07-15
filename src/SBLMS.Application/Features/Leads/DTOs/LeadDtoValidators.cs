using FluentValidation;

namespace SBLMS.Application.Features.Leads.DTOs;

public class CreateLeadDtoValidator : AbstractValidator<CreateLeadDto>
{
    public CreateLeadDtoValidator()
    {
        RuleFor(x => x.CustomerName)
            .NotEmpty().WithMessage("Customer name is required.")
            .MaximumLength(200).WithMessage("Customer name must not exceed 200 characters.");

        RuleFor(x => x.EmailAddress)
            .EmailAddress().WithMessage("A valid email is required.")
            .When(x => !string.IsNullOrEmpty(x.EmailAddress));

        RuleFor(x => x.MobileNumber)
            .MaximumLength(20).WithMessage("Mobile number must not exceed 20 characters.");

        RuleFor(x => x.CompanyName)
            .MaximumLength(200).WithMessage("Company name must not exceed 200 characters.");

        RuleFor(x => x.ExpectedBudget)
            .GreaterThanOrEqualTo(0).WithMessage("Expected budget must be non-negative.")
            .When(x => x.ExpectedBudget.HasValue);

        RuleFor(x => x.Value)
            .GreaterThanOrEqualTo(0).WithMessage("Value must be non-negative.")
            .When(x => x.Value.HasValue);
    }
}

public class UpdateLeadDtoValidator : AbstractValidator<UpdateLeadDto>
{
    public UpdateLeadDtoValidator()
    {
        RuleFor(x => x.CustomerName)
            .NotEmpty().WithMessage("Customer name is required.")
            .MaximumLength(200).WithMessage("Customer name must not exceed 200 characters.");

        RuleFor(x => x.EmailAddress)
            .EmailAddress().WithMessage("A valid email is required.")
            .When(x => !string.IsNullOrEmpty(x.EmailAddress));

        RuleFor(x => x.MobileNumber)
            .MaximumLength(20).WithMessage("Mobile number must not exceed 20 characters.");

        RuleFor(x => x.CompanyName)
            .MaximumLength(200).WithMessage("Company name must not exceed 200 characters.");

        RuleFor(x => x.ExpectedBudget)
            .GreaterThanOrEqualTo(0).WithMessage("Expected budget must be non-negative.")
            .When(x => x.ExpectedBudget.HasValue);

        RuleFor(x => x.Value)
            .GreaterThanOrEqualTo(0).WithMessage("Value must be non-negative.")
            .When(x => x.Value.HasValue);
    }
}
