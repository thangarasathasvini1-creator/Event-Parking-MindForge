using Event_And_Parking_Manage_system.DTOs.Customers;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Event_And_Parking_Manage_system.Controllers
{
    [ApiController]
    [Route("api/customers")]
    [Authorize]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerService _customerService;

        public CustomerController(ICustomerService customerService)
        {
            _customerService = customerService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var customerIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(customerIdClaim, out var loggedInCustomerId))
            {
                return Unauthorized(new
                {
                    message = "Invalid customer identity."
                });
            }

            // Administrator can view any customer
            if (!User.IsInRole("Administrator") && loggedInCustomerId != id)
            {
                return Forbid();
            }

            var customer = await _customerService.GetByIdAsync(id);

            if (customer == null)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            return Ok(customer);
        }

        [Authorize(Roles = "Administrator")]
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search = null)
        {
            var customers = await _customerService.GetAllAsync(search);

            return Ok(customers);
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Create(RegisterCustomerDto dto)
        {
            try
            {
                var customer = await _customerService.CreateAsync(dto);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = customer.CustomerId },
                    customer);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateCustomerDto dto)
        {
            var customerIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(customerIdClaim, out var loggedInCustomerId))
            {
                return Unauthorized(new
                {
                    message = "Invalid customer identity."
                });
            }

            // Administrator can update any customer
            if (!User.IsInRole("Administrator") && loggedInCustomerId != id)
            {
                return Forbid();
            }

            try
            {
                var result = await _customerService.UpdateAsync(id, dto);

                if (!result)
                {
                    return NotFound(new
                    {
                        message = "Customer not found."
                    });
                }

                return Ok(new
                {
                    message = "Customer updated successfully."
                });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new
                {
                    message = ex.Message
                });
            }
        }

        [Authorize(Roles = "Administrator")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var result = await _customerService.DeleteAsync(id);

                if (!result)
                    return NotFound(new
                    {
                        message = "Customer not found."
                    });

                return Ok(new
                {
                    message = "Customer deactivated successfully."
                });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new
                {
                    message = ex.Message
                });
            }
        }

        [Authorize(Roles = "Administrator")]
        [HttpPost("{id}/reactivate")]
        public async Task<IActionResult> Reactivate(int id)
        {
            var result = await _customerService.ReactivateAsync(id);

            if (!result)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            return Ok(new
            {
                message = "Customer reactivated successfully."
            });
        }
    }
}