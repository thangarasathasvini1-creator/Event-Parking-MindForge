using Event_And_Parking_Manage_system.DTOs.Customers;

namespace Event_And_Parking_Manage_system.Services.Interfaces
{
    public interface ICustomerService
    {
        Task<CustomerDto?> GetByIdAsync(int customerId);

        Task<IEnumerable<CustomerDto>> GetAllAsync(string? search = null);

        Task<CustomerDto> CreateAsync(RegisterCustomerDto dto);

        Task<bool> UpdateAsync(int customerId, UpdateCustomerDto dto);

        Task<bool> DeleteAsync(int customerId);
    }
}