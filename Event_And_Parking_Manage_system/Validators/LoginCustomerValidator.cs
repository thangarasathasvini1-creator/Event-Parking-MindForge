using Event_And_Parking_Manage_system.DTOs.Customers;
using FluentValidation;

namespace Event_And_Parking_Manage_system.Validators
{
    public class LoginCustomerValidator : AbstractValidator<LoginCustomerDto>
    {
        public LoginCustomerValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty()
                .WithMessage("Email is required.")
                .EmailAddress()
                .WithMessage("Enter a valid email address.");

            RuleFor(x => x.Password)
                .NotEmpty()
                .WithMessage("Password is required.");
        }
    }
}