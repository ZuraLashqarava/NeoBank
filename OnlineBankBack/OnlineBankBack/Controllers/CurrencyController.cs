using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineBankBack.Data;
using OnlineBankBack.DTOs;
using OnlineBankBack.Models;
using OnlineBankBack.Services;
using System.Security.Claims;

namespace OnlineBankBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CurrencyController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly AlphaVantageService _alphaVantage;

        public CurrencyController(DataContext context, AlphaVantageService alphaVantage)
        {
            _context = context;
            _alphaVantage = alphaVantage;
        }

        [HttpGet("rate")]
        public async Task<IActionResult> GetRate([FromQuery] string from, [FromQuery] string to)
        {
            if (string.IsNullOrWhiteSpace(from) || string.IsNullOrWhiteSpace(to))
                return BadRequest(new { message = "Both 'from' and 'to' currency codes are required." });

            if (from.ToUpper() == to.ToUpper())
                return BadRequest(new { message = "From and To currencies must be different." });

            var result = await _alphaVantage.GetExchangeRateAsync(from, to);
            if (result is null)
                return StatusCode(502, new { message = "Could not retrieve exchange rate. Please try again." });

            return Ok(new ExchangeRateResponseDto
            {
                FromCurrency = result.FromCurrency,
                FromCurrencyName = result.FromCurrencyName,
                ToCurrency = result.ToCurrency,
                ToCurrencyName = result.ToCurrencyName,
                Rate = result.Rate,
                LastRefreshed = result.LastRefreshed
            });
        }

        [HttpPost("convert")]
        public async Task<IActionResult> Convert([FromBody] ConvertCurrencyDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var from = dto.FromCurrency.ToUpper();
            var to = dto.ToCurrency.ToUpper();

            if (from == to)
                return BadRequest(new { message = "From and To currencies must be different." });

            Guid userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Invalid token." });

            var wallet = await _context.Wallets
                .Include(w => w.Balances)
                .FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet is null)
                return NotFound(new { message = "Wallet not found." });

            var sourceBalance = wallet.Balances.FirstOrDefault(b => b.Currency == from);
            if (sourceBalance is null || sourceBalance.Balance < dto.Amount)
                return BadRequest(new { message = $"Insufficient {from} balance." });

            var rateResult = await _alphaVantage.GetExchangeRateAsync(from, to);
            if (rateResult is null)
                return StatusCode(502, new { message = "Could not retrieve exchange rate. Please try again." });

            decimal convertedAmount = Math.Round(dto.Amount * rateResult.Rate, 2);

            sourceBalance.Balance -= dto.Amount;

            var targetBalance = wallet.Balances.FirstOrDefault(b => b.Currency == to);
            if (targetBalance is null)
            {
                targetBalance = new WalletBalance
                {
                    Id = Guid.NewGuid(),
                    WalletId = wallet.Id,
                    Currency = to,
                    Balance = convertedAmount
                };
                await _context.WalletBalances.AddAsync(targetBalance);
            }
            else
            {
                targetBalance.Balance += convertedAmount;
            }

            var card = await _context.VirtualCards
                .FirstOrDefaultAsync(c => c.UserId == userId && c.IsActive);

            if (card is not null)
                card.CurrentDailySpent += dto.Amount;

            var transaction = new Transaction
            {
                SenderId = userId,
                RecipientId = null,
                Amount = dto.Amount,
                Category = TransactionCategory.CurrencyConversion,
                RecipientLabel = $"{from} → {to}",
                Description = $"Converted {dto.Amount:F2} {from} to {convertedAmount:F2} {to} at rate {rateResult.Rate:F6}"
            };

            await _context.Transactions.AddAsync(transaction);
            await _context.SaveChangesAsync();

            var conversion = new CurrencyConversion
            {
                UserId = userId,
                FromCurrency = from,
                ToCurrency = to,
                SourceAmount = dto.Amount,
                ConvertedAmount = convertedAmount,
                ExchangeRate = rateResult.Rate,
                TransactionId = transaction.Id
            };

            await _context.CurrencyConversions.AddAsync(conversion);
            await _context.SaveChangesAsync();

            return Ok(new ConversionResultDto
            {
                ConversionId = conversion.Id,
                TransactionId = transaction.Id,
                FromCurrency = from,
                ToCurrency = to,
                SourceAmount = dto.Amount,
                ConvertedAmount = convertedAmount,
                ExchangeRate = rateResult.Rate,
                NewWalletBalance = sourceBalance.Balance,
                CreatedAt = conversion.CreatedAt
            });
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            Guid userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Invalid token." });

            var history = await _context.CurrencyConversions
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.CreatedAt)
                .Take(20)
                .Select(c => new ConversionHistoryDto
                {
                    Id = c.Id,
                    FromCurrency = c.FromCurrency,
                    ToCurrency = c.ToCurrency,
                    SourceAmount = c.SourceAmount,
                    ConvertedAmount = c.ConvertedAmount,
                    ExchangeRate = c.ExchangeRate,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(history);
        }

        private Guid GetUserId()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                   ?? User.FindFirstValue("sub");
            return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
        }
    }
}