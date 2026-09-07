using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Event_And_Parking_Manage_system.Migrations
{
    /// <inheritdoc />
    public partial class AddParkingSlotRowVersion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "ParkingSlots",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "ParkingSlots");
        }
    }
}
