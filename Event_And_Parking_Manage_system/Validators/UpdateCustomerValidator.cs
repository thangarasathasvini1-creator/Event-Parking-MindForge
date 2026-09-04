using Event_And_Parking_Manage_system.DTOs.Customers;
using FluentValidation;

namespace Event_And_Parking_Manage_system.Validators
{
    public class UpdateCustomerValidator : AbstractValidator<UpdateCustomerDto>
    {
        public UpdateCustomerValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty()
                .WithMessage("Name is required.")
                .MaximumLength(100)
                .WithMessage("Name must not exceed 100 characters.");

            RuleFor(x => x.Email)
                .NotEmpty()
                .WithMessage("Email is required.")
                .EmailAddress()
                .WithMessage("Enter a valid email address.")
                .MaximumLength(100)
                .WithMessage("Email must not exceed 255 characters.");

            RuleFor(x => x.Phone)
                .NotEmpty()
                .WithMessage("Phone is required.")
                .MaximumLength(20)
                .WithMessage("Phone must not exceed 20 characters.");
        }
    }
}