using Event_And_Parking_Manage_system.DTOs.Dashboard;

namespace Event_And_Parking_Manage_system.Services.Interfaces
{
    public interface IAdminDashboardService
    {
        Task<AdminDashboardDto> GetDashboardAsync();
    }
}