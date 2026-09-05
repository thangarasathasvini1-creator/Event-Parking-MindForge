using Event_And_Parking_Manage_system.DTOs.Bookings;
using FluentValidation;

namespace Event_And_Parking_Manage_system.Validators
{
    public class BookingValidator : AbstractValidator<CreateBookingDto>
    {
        public BookingValidator()
        {
            RuleFor(x => x.EventId)
                .GreaterThan(0)
                .WithMessage("EventId must be greater than 0.");

            RuleFor(x => x.SeatIds)
                .NotNull()
                .Must(seats => seats != null && seats.Count > 0)
                .WithMessage("At least one seat must be selected.");

            RuleFor(x => x.SeatIds)
                .Must(seats => seats != null && seats.Distinct().Count() == seats.Count)
                .WithMessage("Duplicate seat IDs are not allowed.");

            RuleForEach(x => x.SeatIds)
                .GreaterThan(0)
                .WithMessage("Seat ID must be greater than 0.");

            When(x => x.ParkingSlotId.HasValue, () =>
            {
                RuleFor(x => x.ParkingSlotId!.Value)
                    .GreaterThan(0)
                    .WithMessage("ParkingSlotId must be greater than 0.");
            });
        }
    }
}