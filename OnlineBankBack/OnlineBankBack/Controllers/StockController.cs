using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineBankBack.Data;
using OnlineBankBack.DTOs;
using OnlineBankBack.Models;
using OnlineBankBack.Services;

namespace OnlineBankBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StockController : ControllerBase
    {
        private readonly FinnhubService _finnhub;
        private readonly DataContext _context;

        public StockController(FinnhubService finnhub, DataContext context)
        {
            _finnhub = finnhub;
            _context = context;
        }

        private Guid GetUserId()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                   ?? User.FindFirstValue("sub");
            return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
        }

        [HttpGet("quote/{symbol}")]
        public async Task<IActionResult> GetQuote(string symbol)
        {
            var data = await _finnhub.GetQuoteAsync(symbol);
            if (data == null) return NotFound(new { message = "Symbol not found." });
            return Ok(data);
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
                return BadRequest(new { message = "Query is required." });

            var data = await _finnhub.SearchStocksAsync(q);
            return Ok(data);
        }

        [HttpGet("news")]
        public async Task<IActionResult> GetNews([FromQuery] string category = "general")
        {
            var data = await _finnhub.GetMarketNewsAsync(category);
            return Ok(data);
        }

        [HttpPost("buy")]
        public async Task<IActionResult> BuyStock([FromBody] BuyStockDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            Guid userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Invalid token." });

            var quote = await _finnhub.GetQuoteAsync(dto.Symbol);
            if (quote == null || !quote.Value.TryGetProperty("c", out var cp))
                return BadRequest(new { message = "Could not fetch stock price." });

            decimal currentPrice = cp.GetDecimal();
            if (currentPrice <= 0)
                return BadRequest(new { message = "Invalid stock price." });

            decimal totalCost = Math.Round(currentPrice * dto.Quantity, 2);

            var wallet = await _context.Wallets
                .Include(w => w.Balances)
                .FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet is null)
                return NotFound(new { message = "Wallet not found." });

            var usdBalance = wallet.Balances.FirstOrDefault(b => b.Currency == "USD");
            if (usdBalance is null || usdBalance.Balance < totalCost)
                return BadRequest(new { message = $"Insufficient USD balance. Required: ${totalCost:F2}" });

            var profile = await _finnhub.GetCompanyProfileAsync(dto.Symbol);
            string companyName = dto.Symbol.ToUpper();
            if (profile.HasValue && profile.Value.TryGetProperty("name", out var nameEl))
                companyName = nameEl.GetString() ?? dto.Symbol.ToUpper();

            usdBalance.Balance -= totalCost;

            var holding = await _context.Portfolios
                .FirstOrDefaultAsync(p => p.UserId == userId && p.TickerSymbol == dto.Symbol.ToUpper());

            if (holding is null)
            {
                holding = new Portfolio
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    TickerSymbol = dto.Symbol.ToUpper(),
                    CompanyName = companyName,
                    Quantity = dto.Quantity,
                    AveragePurchasePrice = currentPrice,
                    LastUpdated = DateTime.UtcNow
                };
                _context.Portfolios.Add(holding);
            }
            else
            {
                decimal totalShares = holding.Quantity + dto.Quantity;
                holding.AveragePurchasePrice =
                    Math.Round(((holding.Quantity * holding.AveragePurchasePrice) + totalCost) / totalShares, 6);
                holding.Quantity = totalShares;
                holding.LastUpdated = DateTime.UtcNow;
            }

            _context.StockTransactions.Add(new StockTransaction
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Symbol = dto.Symbol.ToUpper(),
                Type = StockTransactionType.Buy,
                Quantity = dto.Quantity,
                PriceAtTransaction = currentPrice,
                TotalAmount = totalCost,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Successfully bought {dto.Quantity} shares of {dto.Symbol.ToUpper()} at ${currentPrice:F2}",
                symbol = dto.Symbol.ToUpper(),
                quantity = dto.Quantity,
                pricePerShare = currentPrice,
                totalCost,
                newUsdBalance = usdBalance.Balance
            });
        }

        [HttpPost("sell")]
        public async Task<IActionResult> SellStock([FromBody] SellStockDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            Guid userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Invalid token." });

            var holding = await _context.Portfolios
                .FirstOrDefaultAsync(p => p.UserId == userId && p.TickerSymbol == dto.Symbol.ToUpper());

            if (holding is null)
                return BadRequest(new { message = $"You do not hold any {dto.Symbol.ToUpper()} shares." });

            if (holding.Quantity < dto.Quantity)
                return BadRequest(new { message = $"Not enough shares. You hold {holding.Quantity}, tried to sell {dto.Quantity}." });

            var quote = await _finnhub.GetQuoteAsync(dto.Symbol);
            if (quote == null || !quote.Value.TryGetProperty("c", out var cp))
                return BadRequest(new { message = "Could not fetch stock price." });

            decimal currentPrice = cp.GetDecimal();
            decimal totalEarnings = Math.Round(currentPrice * dto.Quantity, 2);

            var wallet = await _context.Wallets
                .Include(w => w.Balances)
                .FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet is null)
                return NotFound(new { message = "Wallet not found." });

            var usdBalance = wallet.Balances.FirstOrDefault(b => b.Currency == "USD");
            if (usdBalance is null)
            {
                usdBalance = new WalletBalance
                {
                    Id = Guid.NewGuid(),
                    WalletId = wallet.Id,
                    Currency = "USD",
                    Balance = totalEarnings
                };
                await _context.WalletBalances.AddAsync(usdBalance);
            }
            else
            {
                usdBalance.Balance += totalEarnings;
            }

            holding.Quantity -= dto.Quantity;
            holding.LastUpdated = DateTime.UtcNow;

            if (holding.Quantity == 0)
                _context.Portfolios.Remove(holding);

            _context.StockTransactions.Add(new StockTransaction
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Symbol = dto.Symbol.ToUpper(),
                Type = StockTransactionType.Sell,
                Quantity = dto.Quantity,
                PriceAtTransaction = currentPrice,
                TotalAmount = totalEarnings,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Successfully sold {dto.Quantity} shares of {dto.Symbol.ToUpper()} at ${currentPrice:F2}",
                symbol = dto.Symbol.ToUpper(),
                quantity = dto.Quantity,
                pricePerShare = currentPrice,
                totalEarnings,
                newUsdBalance = usdBalance.Balance
            });
        }

        [HttpGet("candles/{symbol}")]
        public async Task<IActionResult> GetCandles(
            string symbol,
            [FromQuery] string resolution = "D",
            [FromQuery] long? from = null,
            [FromQuery] long? to = null)
        {
            if (string.IsNullOrWhiteSpace(symbol))
                return BadRequest(new { message = "Symbol is required." });

            var yesterday = DateTimeOffset.UtcNow.AddDays(-1).Date;
            var endOfYesterday = new DateTimeOffset(yesterday, TimeSpan.Zero)
                .AddHours(23).AddMinutes(59).AddSeconds(59);

            if (!to.HasValue)
                to = endOfYesterday.ToUnixTimeSeconds();

            if (!from.HasValue)
                from = new DateTimeOffset(DateTimeOffset.UtcNow.AddYears(-1).Date, TimeSpan.Zero).ToUnixTimeSeconds();

            if (from >= to)
                return BadRequest(new { message = "'from' must be earlier than 'to'." });

            var data = await _finnhub.GetCandlesAsync(symbol.ToUpper(), resolution, from.Value, to.Value);

            if (data == null ||
                (data.Value.TryGetProperty("chart", out var chart) &&
                 chart.TryGetProperty("result", out var result) &&
                 result.ValueKind == JsonValueKind.Null))
            {
                return NotFound(new
                {
                    message = "No candle data available for the requested period.",
                    symbol = symbol.ToUpper(),
                    resolution,
                    fromDate = DateTimeOffset.FromUnixTimeSeconds(from.Value).UtcDateTime,
                    toDate = DateTimeOffset.FromUnixTimeSeconds(to.Value).UtcDateTime,
                });
            }

            return Ok(data);
        }
    }
}