using Event_And_Parking_Manage_system.DTOs.Payments;
using FluentValidation;

namespace Event_And_Parking_Manage_system.Validators
{
    public class PaymentValidator : AbstractValidator<CreatePaymentDto>
    {
        public PaymentValidator()
        {
            RuleFor(x => x.PaymentMethod)
                .NotEmpty()
                .WithMessage("Payment method is required.")
                .MaximumLength(50)
                .WithMessage("Payment method cannot exceed 50 characters.");
        }
    }
}