using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Event_And_Parking_Manage_system.Data;

public static class ReservationTransactions
{
    // A transaction-owned SQL Server lock coordinates the small application's
    // inventory writers across API instances and the expiry worker. Acquire it
    // before reading state. It is released automatically on commit or rollback.
    public static async Task<IDbContextTransaction> BeginReservationTransactionAsync(
        this ApplicationDbContext context, CancellationToken cancellationToken = default)
    {
        var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        try
        {
            await context.Database.ExecuteSqlRawAsync("""
                DECLARE @result int;
                EXEC @result = sys.sp_getapplock @Resource = 'EventParking:Inventory',
                    @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 10000;
                IF @result < 0 THROW 51001, 'Inventory is busy. Please retry.', 1;
                """, cancellationToken);
            return transaction;
        }
        catch { await transaction.DisposeAsync(); throw; }
    }
}
