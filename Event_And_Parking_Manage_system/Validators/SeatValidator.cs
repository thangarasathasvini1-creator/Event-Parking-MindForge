using Event_And_Parking_Manage_system.DTOs.Seats;

namespace Event_And_Parking_Manage_system.Validators
{
    public class SeatValidator
    {
        public static void ValidateCreate(CreateSeatDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.SeatNumber))
            {
                throw new ArgumentException(
                    "Seat number is required.");
            }

            if (dto.SeatNumber.Length > 50)
            {
                throw new ArgumentException(
                    "Seat number cannot exceed 50 characters.");
            }
        }

        public static void ValidateUpdate(UpdateSeatDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.SeatNumber))
            {
                throw new ArgumentException(
                    "Seat number is required.");
            }

            if (dto.SeatNumber.Length > 50)
            {
                throw new ArgumentException(
                    "Seat number cannot exceed 50 characters.");
            }
        }
    }
}