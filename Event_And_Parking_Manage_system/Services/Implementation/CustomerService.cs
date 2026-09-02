using Event_And_Parking_Manage_system.DTOs.Customers;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services.Interfaces;

namespace Event_And_Parking_Manage_system.Services
{
    public class CustomerService : ICustomerService
    {
        private readonly ICustomerRepository _customerRepository;

        public CustomerService(ICustomerRepository customerRepository)
        {
            _customerRepository = customerRepository;
        }

        public async Task<CustomerDto?> GetByIdAsync(int customerId)
        {
            var customer = await _customerRepository.GetByIdAsync(customerId);

            if (customer == null)
                return null;

            return MapToDto(customer);
        }

        public async Task<IEnumerable<CustomerDto>> GetAllAsync(string? search = null)
        {
            var customers = await _customerRepository.GetAllAsync(search);

            return customers.Select(MapToDto);
        }

        public async Task<CustomerDto> CreateAsync(RegisterCustomerDto dto)
        {
            var emailExists = await _customerRepository.ExistsByEmailAsync(dto.Email);

            if (emailExists)
            {
                throw new InvalidOperationException("Email already exists.");
            }

            var customer = new Customer
            {
                Name = dto.Name,
                Email = dto.Email,
                Phone = dto.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                EmailVerified = false,
                CreatedAt = DateTime.UtcNow
            };

            await _customerRepository.AddAsync(customer);

            return MapToDto(customer);
        }

        public async Task<bool> UpdateAsync(int customerId, UpdateCustomerDto dto)
        {
            var customer = await _customerRepository.GetByIdAsync(customerId);

            if (customer == null)
                return false;

            customer.Name = dto.Name;
            customer.Email = dto.Email;
            customer.Phone = dto.Phone;
            customer.UpdatedAt = DateTime.UtcNow;

            await _customerRepository.UpdateAsync(customer);

            return true;
        }

        public async Task<bool> DeleteAsync(int customerId)
        {
            var customer = await _customerRepository.GetByIdAsync(customerId);

            if (customer == null)
                return false;

            await _customerRepository.DeleteAsync(customer);

            return true;
        }

        private static CustomerDto MapToDto(Customer customer)
        {
            return new CustomerDto
            {
                CustomerId = customer.CustomerId,
                Name = customer.Name,
                Email = customer.Email,
                Phone = customer.Phone,
                Role = customer.Role.ToString(),
                Status = customer.Status.ToString(),
                EmailVerified = customer.EmailVerified,
                CreatedAt = customer.CreatedAt,
                UpdatedAt = customer.UpdatedAt
            };
        }
    }
}