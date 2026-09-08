using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Models.Enums;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace Event_And_Parking_Manage_system.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            // =========================
            // 1. Event Categories
            // =========================

            if (!await context.EventCategories.AnyAsync())
            {
                var categories = new List<EventCategory>
                {
                    new EventCategory
                    {
                        Name = "Music",
                        Description = "Music concerts and live performances"
                    },
                    new EventCategory
                    {
                        Name = "Conference",
                        Description = "Professional conferences and seminars"
                    },
                    new EventCategory
                    {
                        Name = "Sports",
                        Description = "Sports events and competitions"
                    }
                };

                await context.EventCategories.AddRangeAsync(categories);
                await context.SaveChangesAsync();
            }

            // =========================
            // 2. Venues
            // =========================

            if (!await context.Venues.AnyAsync())
            {
                var venues = new List<Venue>
                {
                    new Venue
                    {
                        Name = "Colombo Convention Centre",
                        Address = "Colombo, Sri Lanka",
                        TotalCapacity = 500
                    },
                    new Venue
                    {
                        Name = "BMICH",
                        Address = "Bauddhaloka Mawatha, Colombo",
                        TotalCapacity = 1000
                    },
                    new Venue
                    {
                        Name = "Sugathadasa Stadium",
                        Address = "Colombo, Sri Lanka",
                        TotalCapacity = 2000
                    }
                };

                await context.Venues.AddRangeAsync(venues);
                await context.SaveChangesAsync();
            }

            // =========================
            // 3. Events
            // =========================

            if (!await context.Events.AnyAsync())
            {
                var musicCategory = await context.EventCategories
                    .FirstAsync(x => x.Name == "Music");

                var conferenceCategory = await context.EventCategories
                    .FirstAsync(x => x.Name == "Conference");

                var sportsCategory = await context.EventCategories
                    .FirstAsync(x => x.Name == "Sports");

                var conventionCentre = await context.Venues
                    .FirstAsync(x => x.Name == "Colombo Convention Centre");

                var bmich = await context.Venues
                    .FirstAsync(x => x.Name == "BMICH");

                var stadium = await context.Venues
                    .FirstAsync(x => x.Name == "Sugathadasa Stadium");

                var events = new List<Event>
                {
                    new Event
                    {
                        Name = "Colombo Music Festival",
                        VenueId = conventionCentre.VenueId,
                        CategoryId = musicCategory.CategoryId,
                        EventDate = DateTime.UtcNow.Date.AddDays(30),
                        StartTime = new TimeSpan(18, 0, 0),
                        EndTime = new TimeSpan(22, 0, 0),
                        TicketPrice = 5000,
                        ParkingFee = 500,

                        // 10 rows × 10 columns = 100 seats
                        Capacity = 100
                    },

                    new Event
                    {
                        Name = "Technology Conference 2026",
                        VenueId = bmich.VenueId,
                        CategoryId = conferenceCategory.CategoryId,
                        EventDate = DateTime.UtcNow.Date.AddDays(45),
                        StartTime = new TimeSpan(9, 0, 0),
                        EndTime = new TimeSpan(17, 0, 0),
                        TicketPrice = 7500,
                        ParkingFee = 750,

                        // 15 rows × 10 columns = 150 seats
                        Capacity = 150
                    },

                    new Event
                    {
                        Name = "Colombo Sports Championship",
                        VenueId = stadium.VenueId,
                        CategoryId = sportsCategory.CategoryId,
                        EventDate = DateTime.UtcNow.Date.AddDays(60),
                        StartTime = new TimeSpan(16, 0, 0),
                        EndTime = new TimeSpan(21, 0, 0),
                        TicketPrice = 3000,
                        ParkingFee = 300,

                        // 20 rows × 10 columns = 200 seats
                        Capacity = 200
                    }
                };

                await context.Events.AddRangeAsync(events);
                await context.SaveChangesAsync();
            }

            // =========================
            // 4. Seats
            // =========================

            if (!await context.Seats.AnyAsync())
            {
                var events = await context.Events
                    .OrderBy(x => x.EventId)
                    .ToListAsync();

                var seats = new List<Seat>();

                foreach (var eventItem in events)
                {
                    /*
                     * Seat count must be equal to Event.Capacity.
                     *
                     * Event 1 → Capacity 100 → 10 × 10
                     * Event 2 → Capacity 150 → 15 × 10
                     * Event 3 → Capacity 200 → 20 × 10
                     */

                    int columns = 10;
                    int rows = (int)Math.Ceiling(
                        (double)eventItem.Capacity / columns);

                    int seatCounter = 0;

                    for (int row = 1; row <= rows; row++)
                    {
                        for (int column = 1;
                             column <= columns;
                             column++)
                        {
                            if (seatCounter >= eventItem.Capacity)
                                break;

                            seatCounter++;

                            seats.Add(new Seat
                            {
                                EventId = eventItem.EventId,

                                SeatNumber = $"R{row}-C{column}",

                                Row = $"R{row}",

                                Column = $"C{column}",

                                Status = SeatStatus.Available,

                                CreatedAt = DateTime.UtcNow
                            });
                        }
                    }
                }

                await context.Seats.AddRangeAsync(seats);
                await context.SaveChangesAsync();
            }

            // =========================
            // 5. Parking Slots
            // =========================

            if (!await context.ParkingSlots.AnyAsync())
            {
                var events = await context.Events
                    .OrderBy(x => x.EventId)
                    .ToListAsync();

                var parkingSlots = new List<ParkingSlot>();

                foreach (var eventItem in events)
                {
                    // -----------------------------------------
                    // Car Slots - 4
                    // -----------------------------------------

                    for (int i = 1; i <= 4; i++)
                    {
                        parkingSlots.Add(new ParkingSlot
                        {
                            EventId = eventItem.EventId,

                            SlotNumber = $"C-{i:00}",

                            Zone = "A",

                            VehicleType = VehicleType.Car,

                            Fee = eventItem.ParkingFee,

                            Status = ParkingSlotStatus.Available,

                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    // -----------------------------------------
                    // Bike Slots - 3
                    // -----------------------------------------

                    for (int i = 1; i <= 3; i++)
                    {
                        parkingSlots.Add(new ParkingSlot
                        {
                            EventId = eventItem.EventId,

                            SlotNumber = $"B-{i:00}",

                            Zone = "B",

                            VehicleType = VehicleType.Bike,

                            Fee = eventItem.ParkingFee * 0.5m,

                            Status = ParkingSlotStatus.Available,

                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    // -----------------------------------------
                    // Bus Slots - 2
                    // -----------------------------------------

                    for (int i = 1; i <= 2; i++)
                    {
                        parkingSlots.Add(new ParkingSlot
                        {
                            EventId = eventItem.EventId,

                            SlotNumber = $"BUS-{i:00}",

                            Zone = "C",

                            VehicleType = VehicleType.Bus,

                            Fee = eventItem.ParkingFee * 2m,

                            Status = ParkingSlotStatus.Available,

                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    // -----------------------------------------
                    // Van Slot - 1
                    // -----------------------------------------

                    parkingSlots.Add(new ParkingSlot
                    {
                        EventId = eventItem.EventId,

                        SlotNumber = "V-01",

                        Zone = "C",

                        VehicleType = VehicleType.Van,

                        Fee = eventItem.ParkingFee * 1.5m,

                        Status = ParkingSlotStatus.Available,

                        CreatedAt = DateTime.UtcNow
                    });
                }

                await context.ParkingSlots.AddRangeAsync(parkingSlots);
                await context.SaveChangesAsync();
            }

            // =========================
            // 6. Seed Admin & Customer
            // =========================

            var adminEmail = "psujee07@gmail.com";

            var customerEmail = "sujeepansujee07@gmail.com";

            // =========================
            // Administrator
            // =========================

            if (!await context.Customers
                .AnyAsync(x => x.Email == adminEmail))
            {
                var admin = new Customer
                {
                    Name = "System Administrator",

                    Email = adminEmail,

                    Phone = "0771234567",

                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                        "Admin@12345"),

                    Role = UserRole.Administrator,

                    Status = CustomerStatus.Active,

                    EmailVerified = true,

                    CreatedAt = DateTime.UtcNow
                };

                await context.Customers.AddAsync(admin);

                await context.SaveChangesAsync();
            }

            // =========================
            // Customer
            // =========================

            if (!await context.Customers
                .AnyAsync(x => x.Email == customerEmail))
            {
                var customer = new Customer
                {
                    Name = "Demo Customer",

                    Email = customerEmail,

                    Phone = "0777654321",

                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                        "Customer@12345"),

                    Role = UserRole.Customer,

                    Status = CustomerStatus.Active,

                    EmailVerified = true,

                    CreatedAt = DateTime.UtcNow
                };

                await context.Customers.AddAsync(customer);

                await context.SaveChangesAsync();
            }
        }
    }
}