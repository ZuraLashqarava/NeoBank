using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineBankBack.Data;
using OnlineBankBack.DTOs;
using OnlineBankBack.Services;
using System.Security.Claims;

namespace OnlineBankBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WalletController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly AlphaVantageService _alphaVantage;

        public WalletController(DataContext context, AlphaVantageService alphaVantage)
        {
            _context = context;
            _alphaVantage = alphaVantage;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyWallet()
        {
            Guid userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Invalid token." });

            var wallet = await _context.Wallets
                .Include(w => w.Balances)
                .FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet is null)
                return NotFound(new { message = "Wallet not found." });

            var activeBalances = wallet.Balances
                .Where(b => b.Balance > 0)
                .OrderByDescending(b => b.Currency == "USD")
                .ThenBy(b => b.Currency)
                .ToList();

            return Ok(new WalletDto
            {
                Id = wallet.Id,
                UserId = wallet.UserId,
                Balances = activeBalances.Select(b => new WalletBalanceDto
                {
                    Currency = b.Currency,
                    Balance = b.Balance
                }).ToList()
            });
        }

        [HttpGet("total-usd")]
        public async Task<IActionResult> GetTotalInUsd()
        {
            Guid userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Invalid token." });

            var wallet = await _context.Wallets
                .Include(w => w.Balances)
                .FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet is null)
                return NotFound(new { message = "Wallet not found." });

            var activeBalances = wallet.Balances.Where(b => b.Balance > 0).ToList();

            decimal totalUsd = 0;

            foreach (var balance in activeBalances)
            {
                if (balance.Currency == "USD")
                {
                    totalUsd += balance.Balance;
                    continue;
                }

                var rate = await _alphaVantage.GetExchangeRateAsync(balance.Currency, "USD");
                if (rate is not null)
                    totalUsd += Math.Round(balance.Balance * rate.Rate, 2);
            }

            return Ok(new { totalUsd = Math.Round(totalUsd, 2) });
        }

        private Guid GetUserId()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                   ?? User.FindFirstValue("sub");
            return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
        }
    }
}