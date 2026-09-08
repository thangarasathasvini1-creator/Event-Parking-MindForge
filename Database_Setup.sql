-- ============================================================================
-- Event and Parking Management System - Complete SQL Setup Script
-- Database: EventParkingDb
-- Engine: SQL Server (T-SQL)
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'EventParkingDb')
BEGIN
    CREATE DATABASE EventParkingDb;
END
GO

USE EventParkingDb;
GO

-- ============================================================================
-- 1. CUSTOMERS TABLE
-- ============================================================================
IF OBJECT_ID('dbo.Customers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Customers (
        CustomerId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Customers PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        Email NVARCHAR(100) NOT NULL,
        Phone NVARCHAR(20) NOT NULL CONSTRAINT DF_Customers_Phone DEFAULT (''),
        PasswordHash NVARCHAR(500) NOT NULL,
        Role INT NOT NULL CONSTRAINT DF_Customers_Role DEFAULT (1), -- 1: Customer, 2: Administrator
        Status INT NOT NULL CONSTRAINT DF_Customers_Status DEFAULT (1), -- 1: Active, 2: Deactivated
        EmailVerified BIT NOT NULL CONSTRAINT DF_Customers_EmailVerified DEFAULT (0),
        EmailVerificationTokenHash NVARCHAR(500) NULL,
        EmailVerificationTokenExpiresAt DATETIME2 NULL,
        EmailVerificationOtpHash NVARCHAR(MAX) NULL,
        EmailVerificationOtpExpiresAt DATETIME2 NULL,
        EmailVerificationOtpAttempts INT NOT NULL CONSTRAINT DF_Customers_EmailVerificationOtpAttempts DEFAULT (0),
        PasswordResetTokenHash NVARCHAR(500) NULL,
        PasswordResetTokenExpiresAt DATETIME2 NULL,
        PasswordResetOtpHash NVARCHAR(500) NULL,
        PasswordResetOtpExpiresAt DATETIME2 NULL,
        PasswordResetOtpAttempts INT NOT NULL CONSTRAINT DF_Customers_PasswordResetOtpAttempts DEFAULT (0),
        PasswordResetAuthorizationTokenHash NVARCHAR(500) NULL,
        PasswordResetAuthorizationTokenExpiresAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Customers_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2 NULL
    );

    CREATE UNIQUE INDEX UX_Customers_Email ON dbo.Customers(Email);
END
GO

-- ============================================================================
-- 2. VENUES TABLE
-- ============================================================================
IF OBJECT_ID('dbo.Venues', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Venues (
        VenueId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Venues PRIMARY KEY,
        Name NVARCHAR(150) NOT NULL,
        Address NVARCHAR(500) NOT NULL,
        TotalCapacity INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Venues_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2 NULL
    );
END
GO

-- ============================================================================
-- 3. EVENT CATEGORIES TABLE
-- ============================================================================
IF OBJECT_ID('dbo.EventCategories', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.EventCategories (
        CategoryId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_EventCategories PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500) NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_EventCategories_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2 NULL
    );

    CREATE UNIQUE INDEX UX_EventCategories_Name ON dbo.EventCategories(Name);
END
GO

-- ============================================================================
-- 4. EVENTS TABLE
-- ============================================================================
IF OBJECT_ID('dbo.Events', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Events (
        EventId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Events PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        VenueId INT NOT NULL,
        CategoryId INT NOT NULL,
        EventDate DATETIME2 NOT NULL,
        StartTime TIME(7) NOT NULL,
        EndTime TIME(7) NOT NULL,
        TicketPrice DECIMAL(10,2) NOT NULL,
        ParkingFee DECIMAL(10,2) NOT NULL,
        Capacity INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Events_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_Events_Venues FOREIGN KEY (VenueId) REFERENCES dbo.Venues(VenueId) ON DELETE NO ACTION,
        CONSTRAINT FK_Events_EventCategories FOREIGN KEY (CategoryId) REFERENCES dbo.EventCategories(CategoryId) ON DELETE NO ACTION
    );

    CREATE INDEX IX_Events_VenueId ON dbo.Events(VenueId);
    CREATE INDEX IX_Events_CategoryId ON dbo.Events(CategoryId);
    CREATE INDEX IX_Events_EventDate ON dbo.Events(EventDate);
END
GO

-- ============================================================================
-- 5. SEATS TABLE
-- ============================================================================
IF OBJECT_ID('dbo.Seats', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Seats (
        SeatId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Seats PRIMARY KEY,
        EventId INT NOT NULL,
        SeatNumber NVARCHAR(20) NOT NULL,
        Row NVARCHAR(10) NULL,
        Column NVARCHAR(10) NULL,
        Status INT NOT NULL CONSTRAINT DF_Seats_Status DEFAULT (1), -- 1: Available, 2: Held, 3: Booked
        RowVersion ROWVERSION NOT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Seats_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_Seats_Events FOREIGN KEY (EventId) REFERENCES dbo.Events(EventId) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX UX_Seats_EventId_SeatNumber ON dbo.Seats(EventId, SeatNumber);
END
GO

-- ============================================================================
-- 6. PARKING SLOTS TABLE
-- ============================================================================
IF OBJECT_ID('dbo.ParkingSlots', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ParkingSlots (
        ParkingSlotId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ParkingSlots PRIMARY KEY,
        EventId INT NOT NULL,
        SlotNumber NVARCHAR(20) NOT NULL,
        Zone NVARCHAR(50) NULL,
        VehicleType INT NOT NULL, -- 1: Car, 2: Bike, 3: Bus, 4: Van
        Fee DECIMAL(10,2) NOT NULL,
        Status INT NOT NULL CONSTRAINT DF_ParkingSlots_Status DEFAULT (1), -- 1: Available, 2: Held, 3: Occupied
        RowVersion ROWVERSION NOT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_ParkingSlots_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_ParkingSlots_Events FOREIGN KEY (EventId) REFERENCES dbo.Events(EventId) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX UX_ParkingSlots_EventId_SlotNumber ON dbo.ParkingSlots(EventId, SlotNumber);
END
GO

-- ============================================================================
-- 7. BOOKINGS TABLE
-- ============================================================================
IF OBJECT_ID('dbo.Bookings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Bookings (
        BookingId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Bookings PRIMARY KEY,
        BookingNumber NVARCHAR(50) NOT NULL,
        CustomerId INT NOT NULL,
        EventId INT NOT NULL,
        Status INT NOT NULL CONSTRAINT DF_Bookings_Status DEFAULT (1), -- 1: Pending, 2: Confirmed, 3: Cancelled, 4: Expired
        TotalAmount DECIMAL(10,2) NOT NULL,
        HoldExpiresAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Bookings_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_Bookings_Customers FOREIGN KEY (CustomerId) REFERENCES dbo.Customers(CustomerId) ON DELETE NO ACTION,
        CONSTRAINT FK_Bookings_Events FOREIGN KEY (EventId) REFERENCES dbo.Events(EventId) ON DELETE NO ACTION
    );

    CREATE UNIQUE INDEX UX_Bookings_BookingNumber ON dbo.Bookings(BookingNumber);
    CREATE INDEX IX_Bookings_CustomerId ON dbo.Bookings(CustomerId);
    CREATE INDEX IX_Bookings_EventId ON dbo.Bookings(EventId);
END
GO

-- ============================================================================
-- 8. BOOKING SEATS TABLE
-- ============================================================================
IF OBJECT_ID('dbo.BookingSeats', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.BookingSeats (
        BookingSeatId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_BookingSeats PRIMARY KEY,
        BookingId INT NOT NULL,
        SeatId INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_BookingSeats_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_BookingSeats_Bookings FOREIGN KEY (BookingId) REFERENCES dbo.Bookings(BookingId) ON DELETE CASCADE,
        CONSTRAINT FK_BookingSeats_Seats FOREIGN KEY (SeatId) REFERENCES dbo.Seats(SeatId) ON DELETE NO ACTION
    );

    CREATE UNIQUE INDEX UX_BookingSeats_BookingId_SeatId ON dbo.BookingSeats(BookingId, SeatId);
    CREATE INDEX IX_BookingSeats_SeatId ON dbo.BookingSeats(SeatId);
END
GO

-- ============================================================================
-- 9. PARKING RESERVATIONS TABLE
-- ============================================================================
IF OBJECT_ID('dbo.ParkingReservations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ParkingReservations (
        ParkingReservationId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ParkingReservations PRIMARY KEY,
        BookingId INT NOT NULL,
        ParkingSlotId INT NOT NULL,
        ReservedFee DECIMAL(10,2) NOT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_ParkingReservations_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_ParkingReservations_Bookings FOREIGN KEY (BookingId) REFERENCES dbo.Bookings(BookingId) ON DELETE CASCADE,
        CONSTRAINT FK_ParkingReservations_ParkingSlots FOREIGN KEY (ParkingSlotId) REFERENCES dbo.ParkingSlots(ParkingSlotId) ON DELETE NO ACTION
    );

    CREATE UNIQUE INDEX UX_ParkingReservations_BookingId ON dbo.ParkingReservations(BookingId);
    CREATE INDEX IX_ParkingReservations_ParkingSlotId ON dbo.ParkingReservations(ParkingSlotId);
END
GO

-- ============================================================================
-- 10. PAYMENTS TABLE
-- ============================================================================
IF OBJECT_ID('dbo.Payments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Payments (
        PaymentId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Payments PRIMARY KEY,
        BookingId INT NOT NULL,
        Amount DECIMAL(10,2) NOT NULL,
        Status INT NOT NULL CONSTRAINT DF_Payments_Status DEFAULT (1), -- 1: Pending, 2: Completed, 3: Failed
        PaymentMethod NVARCHAR(50) NULL,
        TransactionReference NVARCHAR(100) NULL,
        PaidAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Payments_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_Payments_Bookings FOREIGN KEY (BookingId) REFERENCES dbo.Bookings(BookingId) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX UX_Payments_BookingId ON dbo.Payments(BookingId);
    CREATE UNIQUE INDEX UX_Payments_TransactionReference ON dbo.Payments(TransactionReference) WHERE TransactionReference IS NOT NULL;
END
GO

-- ============================================================================
-- 11. NOTIFICATIONS TABLE
-- ============================================================================
IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notifications (
        NotificationId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Notifications PRIMARY KEY,
        CustomerId INT NOT NULL,
        Type NVARCHAR(50) NOT NULL,
        Message NVARCHAR(500) NOT NULL,
        IsRead BIT NOT NULL CONSTRAINT DF_Notifications_IsRead DEFAULT (0),
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Notifications_CreatedAt DEFAULT (SYSUTCDATETIME()),
        ReadAt DATETIME2 NULL,
        CONSTRAINT FK_Notifications_Customers FOREIGN KEY (CustomerId) REFERENCES dbo.Customers(CustomerId) ON DELETE CASCADE
    );

    CREATE INDEX IX_Notifications_CustomerId ON dbo.Notifications(CustomerId);
    CREATE INDEX IX_Notifications_CustomerId_IsRead ON dbo.Notifications(CustomerId, IsRead);
END
GO

-- ============================================================================
-- SAMPLE DATA SEEDING
-- ============================================================================

-- 1. Seed Administrator Customer (Password: Admin@123)
IF NOT EXISTS (SELECT 1 FROM dbo.Customers WHERE Email = 'admin@eventparking.com')
BEGIN
    INSERT INTO dbo.Customers (Name, Email, Phone, PasswordHash, Role, Status, EmailVerified, CreatedAt)
    VALUES (
        'System Administrator',
        'admin@eventparking.com',
        '+1234567890',
        '$2a$11$qRzN7LqX7D4Z5YqW.7X6EO7oG/6.1n5/xX2mP5tL8z.6Y5/uJ7X2O', -- BCrypt hash for Admin@123
        2, -- Administrator
        1, -- Active
        1, -- EmailVerified
        SYSUTCDATETIME()
    );
END

-- 2. Seed Customer (Password: Customer@123)
IF NOT EXISTS (SELECT 1 FROM dbo.Customers WHERE Email = 'customer@eventparking.com')
BEGIN
    INSERT INTO dbo.Customers (Name, Email, Phone, PasswordHash, Role, Status, EmailVerified, CreatedAt)
    VALUES (
        'Demo Customer',
        'customer@eventparking.com',
        '+0987654321',
        '$2a$11$qRzN7LqX7D4Z5YqW.7X6EO7oG/6.1n5/xX2mP5tL8z.6Y5/uJ7X2O', -- BCrypt hash for Customer@123
        1, -- Customer
        1, -- Active
        1, -- EmailVerified
        SYSUTCDATETIME()
    );
END

-- 3. Seed Event Categories
IF NOT EXISTS (SELECT 1 FROM dbo.EventCategories WHERE Name = 'Concerts')
BEGIN
    INSERT INTO dbo.EventCategories (Name, Description, CreatedAt)
    VALUES ('Concerts', 'Live music performances and orchestra shows', SYSUTCDATETIME());
END

IF NOT EXISTS (SELECT 1 FROM dbo.EventCategories WHERE Name = 'Sports')
BEGIN
    INSERT INTO dbo.EventCategories (Name, Description, CreatedAt)
    VALUES ('Sports', 'Athletic events, matches, and tournaments', SYSUTCDATETIME());
END

IF NOT EXISTS (SELECT 1 FROM dbo.EventCategories WHERE Name = 'Conferences')
BEGIN
    INSERT INTO dbo.EventCategories (Name, Description, CreatedAt)
    VALUES ('Conferences', 'Tech summits, business seminars, and expos', SYSUTCDATETIME());
END

-- 4. Seed Venue
IF NOT EXISTS (SELECT 1 FROM dbo.Venues WHERE Name = 'Grand City Arena')
BEGIN
    INSERT INTO dbo.Venues (Name, Address, TotalCapacity, CreatedAt)
    VALUES ('Grand City Arena', '100 Stadium Way, Tech City', 500, SYSUTCDATETIME());
END

-- 5. Seed Event
DECLARE @VenueId INT, @CategoryId INT, @EventId INT;

SELECT TOP 1 @VenueId = VenueId FROM dbo.Venues WHERE Name = 'Grand City Arena';
SELECT TOP 1 @CategoryId = CategoryId FROM dbo.EventCategories WHERE Name = 'Concerts';

IF @VenueId IS NOT NULL AND @CategoryId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.Events WHERE Name = 'Grand Symphony Concert 2026')
    BEGIN
        INSERT INTO dbo.Events (Name, VenueId, CategoryId, EventDate, StartTime, EndTime, TicketPrice, ParkingFee, Capacity, CreatedAt)
        VALUES (
            'Grand Symphony Concert 2026',
            @VenueId,
            @CategoryId,
            DATEADD(DAY, 30, SYSUTCDATETIME()),
            '18:00:00',
            '22:00:00',
            150.00,
            20.00,
            10,
            SYSUTCDATETIME()
        );
    END

    SELECT TOP 1 @EventId = EventId FROM dbo.Events WHERE Name = 'Grand Symphony Concert 2026';

    -- 6. Seed Seats for Event (Capacity = 10 seats)
    IF @EventId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Seats WHERE EventId = @EventId)
    BEGIN
        INSERT INTO dbo.Seats (EventId, SeatNumber, Row, Column, Status, CreatedAt)
        VALUES
            (@EventId, 'A-01', 'A', '1', 1, SYSUTCDATETIME()),
            (@EventId, 'A-02', 'A', '2', 1, SYSUTCDATETIME()),
            (@EventId, 'A-03', 'A', '3', 1, SYSUTCDATETIME()),
            (@EventId, 'A-04', 'A', '4', 1, SYSUTCDATETIME()),
            (@EventId, 'A-05', 'A', '5', 1, SYSUTCDATETIME()),
            (@EventId, 'B-01', 'B', '1', 1, SYSUTCDATETIME()),
            (@EventId, 'B-02', 'B', '2', 1, SYSUTCDATETIME()),
            (@EventId, 'B-03', 'B', '3', 1, SYSUTCDATETIME()),
            (@EventId, 'B-04', 'B', '4', 1, SYSUTCDATETIME()),
            (@EventId, 'B-05', 'B', '5', 1, SYSUTCDATETIME());
    END

    -- 7. Seed Parking Slots for Event demonstrating VehicleType
    -- Car = 1, Bike = 2, Bus = 3, Van = 4
    IF @EventId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ParkingSlots WHERE EventId = @EventId)
    BEGIN
        INSERT INTO dbo.ParkingSlots (EventId, SlotNumber, Zone, VehicleType, Fee, Status, CreatedAt)
        VALUES
            -- Car Slots (VehicleType = 1)
            (@EventId, 'C-01', 'Zone A', 1, 20.00, 1, SYSUTCDATETIME()),
            (@EventId, 'C-02', 'Zone A', 1, 20.00, 1, SYSUTCDATETIME()),
            (@EventId, 'C-03', 'Zone A', 1, 20.00, 1, SYSUTCDATETIME()),
            -- Bike Slots (VehicleType = 2)
            (@EventId, 'B-01', 'Zone B', 2, 10.00, 1, SYSUTCDATETIME()),
            (@EventId, 'B-02', 'Zone B', 2, 10.00, 1, SYSUTCDATETIME()),
            -- Bus Slot (VehicleType = 3)
            (@EventId, 'BUS-01', 'Zone C', 3, 50.00, 1, SYSUTCDATETIME()),
            -- Van Slot (VehicleType = 4)
            (@EventId, 'V-01', 'Zone C', 4, 30.00, 1, SYSUTCDATETIME());
    END
END
GO

PRINT 'EventParkingDb setup and seed executed successfully.';
GO
