using Microsoft.EntityFrameworkCore;
using OnlineBankBack.Models;

namespace OnlineBankBack.Data
{
    public class DataContext : DbContext
    {
        public DataContext(DbContextOptions<DataContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Wallet> Wallets => Set<Wallet>();
        public DbSet<WalletBalance> WalletBalances => Set<WalletBalance>();
        public DbSet<VirtualCard> VirtualCards => Set<VirtualCard>();
        public DbSet<ExternalCard> ExternalCards => Set<ExternalCard>();
        public DbSet<Transaction> Transactions => Set<Transaction>();
        public DbSet<Portfolio> Portfolios => Set<Portfolio>();
        public DbSet<CurrencyConversion> CurrencyConversions => Set<CurrencyConversion>();
        public DbSet<StockTransaction> StockTransactions => Set<StockTransaction>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<WalletBalance>()
                .HasOne(b => b.Wallet)
                .WithMany(w => w.Balances)
                .HasForeignKey(b => b.WalletId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WalletBalance>()
                .HasIndex(b => new { b.WalletId, b.Currency })
                .IsUnique();

            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.Sender)
                .WithMany()
                .HasForeignKey(t => t.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.Recipient)
                .WithMany()
                .HasForeignKey(t => t.RecipientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CurrencyConversion>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CurrencyConversion>()
                .HasOne(c => c.Transaction)
                .WithMany()
                .HasForeignKey(c => c.TransactionId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Transaction>()
                .Property(t => t.Amount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<WalletBalance>()
                .Property(b => b.Balance)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<VirtualCard>()
                .Property(v => v.CurrentDailySpent)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Portfolio>()
                .Property(p => p.Quantity)
                .HasColumnType("decimal(18,6)");

            modelBuilder.Entity<Portfolio>()
                .Property(p => p.AveragePurchasePrice)
                .HasColumnType("decimal(18,6)");

            modelBuilder.Entity<StockTransaction>()
                .HasOne(t => t.User)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}