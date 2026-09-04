using Event_And_Parking_Manage_system.DTOs.Customers;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services.Interfaces;

namespace Event_And_Parking_Manage_system.Services
{
    public class CustomerDashboardService : ICustomerDashboardService
    {
        private readonly ICustomerRepository _customerRepository;

        public CustomerDashboardService(
            ICustomerRepository customerRepository)
        {
            _customerRepository = customerRepository;
        }

        public async Task<CustomerDashboardDto?> GetDashboardAsync(
            int customerId)
        {
            var customer = await _customerRepository.GetByIdAsync(customerId);

            if (customer == null)
                return null;

            return new CustomerDashboardDto
            {
                UpcomingBookings =
                    await _customerRepository
                        .GetUpcomingBookingsCountAsync(customerId),

                ReservedParking =
                    await _customerRepository
                        .GetReservedParkingCountAsync(customerId),

                RecentPayments =
                    await _customerRepository
                        .GetRecentPaymentsCountAsync(customerId),

                UnreadNotifications =
                    await _customerRepository
                        .GetUnreadNotificationsCountAsync(customerId)
            };
        }
    }
}