using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Event_And_Parking_Manage_system.Migrations
{
    /// <inheritdoc />
    public partial class UpdateExistingParkingSlotVehicleTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ;WITH ParkingSlotsToUpdate AS
                (
                    SELECT
                        ParkingSlotId,
                        ROW_NUMBER() OVER (
                            PARTITION BY EventId
                            ORDER BY ParkingSlotId
                        ) AS RowNumber
                    FROM ParkingSlots
                )
                UPDATE ps
                SET
                    VehicleType =
                        CASE
                            WHEN p.RowNumber BETWEEN 1 AND 4 THEN 1
                            WHEN p.RowNumber BETWEEN 5 AND 7 THEN 2
                            WHEN p.RowNumber BETWEEN 8 AND 9 THEN 3
                            WHEN p.RowNumber = 10 THEN 4
                        END,

                    SlotNumber =
                        CASE
                            WHEN p.RowNumber BETWEEN 1 AND 4
                                THEN CONCAT(
                                    'C-',
                                    RIGHT(
                                        '00' + CAST(p.RowNumber AS VARCHAR(2)),
                                        2
                                    )
                                )

                            WHEN p.RowNumber BETWEEN 5 AND 7
                                THEN CONCAT(
                                    'B-',
                                    RIGHT(
                                        '00' + CAST(p.RowNumber - 4 AS VARCHAR(2)),
                                        2
                                    )
                                )

                            WHEN p.RowNumber BETWEEN 8 AND 9
                                THEN CONCAT(
                                    'BUS-',
                                    RIGHT(
                                        '00' + CAST(p.RowNumber - 7 AS VARCHAR(2)),
                                        2
                                    )
                                )

                            WHEN p.RowNumber = 10
                                THEN 'V-01'
                        END
                FROM ParkingSlots ps
                INNER JOIN ParkingSlotsToUpdate p
                    ON ps.ParkingSlotId = p.ParkingSlotId;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ;WITH ParkingSlotsToRestore AS
                (
                    SELECT
                        ParkingSlotId,
                        ROW_NUMBER() OVER (
                            PARTITION BY EventId
                            ORDER BY ParkingSlotId
                        ) AS RowNumber
                    FROM ParkingSlots
                )
                UPDATE ps
                SET
                    VehicleType = 1,

                    SlotNumber =
                        CONCAT(
                            'P-',
                            RIGHT(
                                '00' + CAST(p.RowNumber AS VARCHAR(2)),
                                2
                            )
                        )
                FROM ParkingSlots ps
                INNER JOIN ParkingSlotsToRestore p
                    ON ps.ParkingSlotId = p.ParkingSlotId;
            ");
        }
    }
}