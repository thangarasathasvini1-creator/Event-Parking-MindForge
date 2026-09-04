using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Event_And_Parking_Manage_system.Repositories.Implementation
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly ApplicationDbContext _context;

        public CategoryRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<EventCategory>> GetAllAsync()
        {
            return await _context.EventCategories
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<EventCategory?> GetByIdAsync(int id)
        {
            return await _context.EventCategories
                .FirstOrDefaultAsync(c => c.CategoryId == id);
        }

        public async Task<EventCategory?> GetByNameAsync(string name)
        {
            return await _context.EventCategories
                .FirstOrDefaultAsync(c => c.Name == name);
        }

        public async Task AddAsync(EventCategory category)
        {
            await _context.EventCategories.AddAsync(category);
        }

        public void Update(EventCategory category)
        {
            _context.EventCategories.Update(category);
        }

        public void Delete(EventCategory category)
        {
            _context.EventCategories.Remove(category);
        }

        public async Task<bool> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }
    }
}