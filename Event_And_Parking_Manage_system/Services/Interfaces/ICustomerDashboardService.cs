using Event_And_Parking_Manage_system.DTOs.Customers;

namespace Event_And_Parking_Manage_system.Services.Interfaces
{
    public interface ICustomerDashboardService
    {
        Task<CustomerDashboardDto?> GetDashboardAsync(int customerId);
    }
}