using Event_And_Parking_Manage_system.DTOs.Parking;

namespace Event_And_Parking_Manage_system.Validators
{
    public class ParkingValidator
    {
        public static void ValidateCreate(CreateParkingSlotDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.SlotNumber))
            {
                throw new ArgumentException(
                    "Parking slot number is required.");
            }

            if (dto.SlotNumber.Length > 50)
            {
                throw new ArgumentException(
                    "Parking slot number cannot exceed 50 characters.");
            }

            if (dto.Fee < 0)
            {
                throw new ArgumentException(
                    "Parking fee cannot be negative.");
            }
        }

        public static void ValidateUpdate(UpdateParkingSlotDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.SlotNumber))
            {
                throw new ArgumentException(
                    "Parking slot number is required.");
            }

            if (dto.SlotNumber.Length > 50)
            {
                throw new ArgumentException(
                    "Parking slot number cannot exceed 50 characters.");
            }

            if (dto.Fee < 0)
            {
                throw new ArgumentException(
                    "Parking fee cannot be negative.");
            }
        }
    }
}