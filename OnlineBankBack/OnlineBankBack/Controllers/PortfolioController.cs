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
    public class PortfolioController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly FinnhubService _finnhub;

        public PortfolioController(DataContext context, FinnhubService finnhub)
        {
            _context = context;
            _finnhub = finnhub;
        }

        [HttpGet]
        public async Task<IActionResult> GetPortfolio()
        {
            Guid userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Invalid token." });

            var holdings = await _context.Portfolios
                .Where(p => p.UserId == userId)
                .OrderBy(p => p.TickerSymbol)
                .ToListAsync();

            if (!holdings.Any())
                return Ok(new List<PortfolioItemDto>());

            var result = new List<PortfolioItemDto>();

            foreach (var holding in holdings)
            {
                var quote = await _finnhub.GetQuoteAsync(holding.TickerSymbol);
                decimal currentPrice = 0;

                if (quote.HasValue && quote.Value.TryGetProperty("c", out var cp))
                    currentPrice = cp.GetDecimal();

                var totalValue = holding.Quantity * currentPrice;
                var costBasis = holding.Quantity * holding.AveragePurchasePrice;

                result.Add(new PortfolioItemDto
                {
                    Symbol = holding.TickerSymbol,
                    CompanyName = holding.CompanyName,
                    Quantity = holding.Quantity,
                    AverageBuyPrice = holding.AveragePurchasePrice,
                    CurrentPrice = currentPrice,
                    TotalValue = totalValue,
                    ProfitLoss = totalValue - costBasis,
                    ProfitLossPercent = costBasis > 0
                        ? Math.Round((totalValue - costBasis) / costBasis * 100, 2)
                        : 0
                });
            }

            return Ok(result);
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            Guid userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Invalid token." });

            var holdings = await _context.Portfolios
                .Where(p => p.UserId == userId)
                .ToListAsync();

            if (!holdings.Any())
                return Ok(new { totalValue = 0m, totalCost = 0m, totalProfitLoss = 0m, totalProfitLossPercent = 0m, holdingsCount = 0 });

            decimal totalValue = 0;
            decimal totalCost = 0;

            foreach (var holding in holdings)
            {
                var quote = await _finnhub.GetQuoteAsync(holding.TickerSymbol);
                decimal currentPrice = 0;

                if (quote.HasValue && quote.Value.TryGetProperty("c", out var cp))
                    currentPrice = cp.GetDecimal();

                totalValue += holding.Quantity * currentPrice;
                totalCost += holding.Quantity * holding.AveragePurchasePrice;
            }

            decimal profitLoss = totalValue - totalCost;
            decimal profitLossPercent = totalCost > 0
                ? Math.Round(profitLoss / totalCost * 100, 2)
                : 0;

            return Ok(new
            {
                totalValue = Math.Round(totalValue, 2),
                totalCost = Math.Round(totalCost, 2),
                totalProfitLoss = Math.Round(profitLoss, 2),
                totalProfitLossPercent = profitLossPercent,
                holdingsCount = holdings.Count
            });
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetTransactionHistory()
        {
            Guid userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Invalid token." });

            var history = await _context.StockTransactions
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .Take(50)
                .Select(t => new StockTransactionHistoryDto
                {
                    Id = t.Id,
                    Symbol = t.Symbol,
                    Type = t.Type.ToString(),
                    Quantity = t.Quantity,
                    PriceAtTransaction = t.PriceAtTransaction,
                    TotalAmount = t.TotalAmount,
                    CreatedAt = t.CreatedAt
                })
                .ToListAsync();

            return Ok(history);
        }

        [HttpGet("{symbol}")]
        public async Task<IActionResult> GetHolding(string symbol)
        {
            Guid userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Invalid token." });

            var holding = await _context.Portfolios
                .FirstOrDefaultAsync(p => p.UserId == userId && p.TickerSymbol == symbol.ToUpper());

            if (holding is null)
                return NotFound(new { message = $"No holding found for {symbol.ToUpper()}." });

            var quote = await _finnhub.GetQuoteAsync(holding.TickerSymbol);
            decimal currentPrice = 0;

            if (quote.HasValue && quote.Value.TryGetProperty("c", out var cp))
                currentPrice = cp.GetDecimal();

            var totalValue = holding.Quantity * currentPrice;
            var costBasis = holding.Quantity * holding.AveragePurchasePrice;

            return Ok(new PortfolioItemDto
            {
                Symbol = holding.TickerSymbol,
                CompanyName = holding.CompanyName,
                Quantity = holding.Quantity,
                AverageBuyPrice = holding.AveragePurchasePrice,
                CurrentPrice = currentPrice,
                TotalValue = totalValue,
                ProfitLoss = totalValue - costBasis,
                ProfitLossPercent = costBasis > 0
                    ? Math.Round((totalValue - costBasis) / costBasis * 100, 2)
                    : 0
            });
        }

        private Guid GetUserId()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                   ?? User.FindFirstValue("sub");
            return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
        }
    }
}
