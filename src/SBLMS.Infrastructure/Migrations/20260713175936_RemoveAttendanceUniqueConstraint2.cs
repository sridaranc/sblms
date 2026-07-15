using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SBLMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveAttendanceUniqueConstraint2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Attendances_UserId_Date",
                table: "Attendances");

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_UserId_Date",
                table: "Attendances",
                columns: new[] { "UserId", "Date" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Attendances_UserId_Date",
                table: "Attendances");

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_UserId_Date",
                table: "Attendances",
                columns: new[] { "UserId", "Date" },
                unique: true);
        }
    }
}
