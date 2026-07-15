using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using SBLMS.Infrastructure.Persistence;

namespace DbQuery
{
    class Program
    {
        static void Main(string[] args)
        {
            var options = new DbContextOptionsBuilder<SBLMSDbContext>()
                .UseNpgsql("Host=localhost;Port=5432;Database=SBLMS_Dev;Username=postgres;Password=postgres")
                .Options;

            using var context = new SBLMSDbContext(options);
            var attendances = context.Attendances.OrderByDescending(a => a.Date).Take(15).ToList();
            Console.WriteLine($"Found {attendances.Count} attendances.");
            foreach (var a in attendances)
            {
                Console.WriteLine($"Id={a.Id}, UserId={a.UserId}, Date={a.Date:yyyy-MM-dd HH:mm:ss}, CheckIn={a.CheckInTime}, CheckOut={a.CheckOutTime}, Status={a.Status}");
            }
            Console.WriteLine("Done.");
        }
    }
}
