using Microsoft.EntityFrameworkCore;
using OnlineBankBack.Models;

namespace OnlineBankBack.Data
{
    public class DataSeedingService
    {
        private readonly DataContext _context;

        public DataSeedingService(DataContext context)
        {
            _context = context;
        }

        public async Task SeedAsync()
        {
            await _context.Database.MigrateAsync();

            if (await _context.Users.AnyAsync())
                return;

            var userId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                FullName = "Admin User",
                Email = "admin@neobank.com",
                PersonalNumber = "00000000000",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@1234"),
                CreatedAt = DateTime.UtcNow,
                Currency = "USD"
            };

            var walletId = Guid.NewGuid();

            var wallet = new Wallet
            {
                Id = walletId,
                UserId = userId,
                Balances = new List<WalletBalance>
                {
                    new WalletBalance
                    {
                        Id = Guid.NewGuid(),
                        WalletId = walletId,
                        Currency = "USD",
                        Balance = 500.00m
                    }
                }
            };

            var rng = new Random();
            string randomDigits = string.Concat(Enumerable.Range(0, 12).Select(_ => rng.Next(0, 10).ToString()));
            string pinCode = rng.Next(1000, 10000).ToString();

            var virtualCard = new VirtualCard
            {
                Id = Guid.NewGuid(),
                CardNumber = "9999" + randomDigits,
                CardHolderName = user.FullName,
                ExpiryDate = DateTime.UtcNow.AddYears(4).ToString("MM/yy"),
                CVV = rng.Next(100, 1000).ToString(),
                PinCode = pinCode,
                Nickname = "Main Virtual Card",
                IsActive = true,
                Network = "NeoBank",
                UserId = userId,
                IssuedAt = DateTime.UtcNow,
                CurrentDailySpent = 0.00m
            };

            await _context.Users.AddAsync(user);
            await _context.Wallets.AddAsync(wallet);
            await _context.VirtualCards.AddAsync(virtualCard);
            await _context.SaveChangesAsync();
        }
    }
}