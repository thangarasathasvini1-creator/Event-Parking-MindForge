using Event_And_Parking_Manage_system.DTOs.Payments;

namespace Event_And_Parking_Manage_system.Services.Interfaces
{
    public interface IPaymentService
    {
        Task<PaymentDto> ProcessPaymentAsync(
            int customerId,
            int bookingId,
            CreatePaymentDto dto);

        Task<PaymentDto?> GetPaymentByBookingIdAsync(
            int bookingId);

        Task<List<PaymentDto>> GetCustomerPaymentsAsync(
            int customerId);

        Task<PaymentDto?> GetPaymentByIdAsync(
            int paymentId);
    }
}