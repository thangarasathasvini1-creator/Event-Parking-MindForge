using Event_And_Parking_Manage_system.DTOs.Customers;
using FluentValidation;

namespace Event_And_Parking_Manage_system.Validators
{
    public class VerifyEmailValidator : AbstractValidator<VerifyEmailDto>
    {
        public VerifyEmailValidator()
        {
            RuleFor(x => x.Token)
                .NotEmpty()
                .WithMessage("Verification token is required.");
        }
    }
}