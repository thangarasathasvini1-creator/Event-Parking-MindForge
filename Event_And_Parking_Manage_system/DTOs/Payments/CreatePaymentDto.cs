namespace Event_And_Parking_Manage_system.DTOs.Payments
{
    public class CreatePaymentDto
    {
        public string PaymentMethod { get; set; } = string.Empty;

        public bool SimulateSuccess { get; set; } = true;
    }
}