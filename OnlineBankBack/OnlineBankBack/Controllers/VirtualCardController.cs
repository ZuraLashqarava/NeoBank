using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineBankBack.Data;
using OnlineBankBack.Models;
using OnlineBankBack.Security;
using System.Security.Claims;

namespace OnlineBankBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class VirtualCardController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly EmailSender _emailSender;

        public VirtualCardController(DataContext context, EmailSender emailSender)
        {
            _context = context;
            _emailSender = emailSender;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyVirtualCards()
        {
            Guid userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Invalid token." });

            var cards = await _context.VirtualCards
                .Where(c => c.UserId == userId)
                .OrderBy(c => c.IssuedAt)
                .Select(c => new
                {
                    id = c.Id,
                    cardNumber = c.CardNumber,
                    cardHolderName = c.CardHolderName,
                    expiryDate = c.ExpiryDate,
                    cvv = c.CVV,
                    nickname = c.Nickname,
                    isActive = c.IsActive,
                    network = c.Network,
                    issuedAt = c.IssuedAt,
                    currentDailySpent = c.CurrentDailySpent
                })
                .ToListAsync();

            if (!cards.Any())
                return NotFound(new { message = "No virtual cards found." });

            return Ok(cards);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetVirtualCard(Guid id)
        {
            Guid userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Invalid token." });

            var card = await _context.VirtualCards
                .Where(c => c.Id == id && c.UserId == userId)
                .Select(c => new
                {
                    id = c.Id,
                    cardNumber = c.CardNumber,
                    cardHolderName = c.CardHolderName,
                    expiryDate = c.ExpiryDate,
                    cvv = c.CVV,
                    nickname = c.Nickname,
                    isActive = c.IsActive,
                    network = c.Network,
                    issuedAt = c.IssuedAt,
                    currentDailySpent = c.CurrentDailySpent
                })
                .FirstOrDefaultAsync();

            if (card is null)
                return NotFound(new { message = "Card not found." });

            return Ok(card);
        }

        [HttpPost("{id:guid}/renew-pin")]
        public async Task<IActionResult> RenewPin(Guid id)
        {
            Guid userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Invalid token." });

            var card = await _context.VirtualCards
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (card is null)
                return NotFound(new { message = "Card not found." });

            var user = await _context.Users.FindAsync(userId);
            if (user is null)
                return NotFound(new { message = "User not found." });

            var rng = new Random();
            string newPin = rng.Next(1000, 10000).ToString();
            card.PinCode = newPin;
            await _context.SaveChangesAsync();

            await _emailSender.SendPinCodeEmailAsync(user.Email, user.FullName, newPin, card.CardNumber[^4..]);

            return Ok(new { message = "PIN renewed and sent to your email." });
        }

        [HttpGet("spending-week")]
        public async Task<IActionResult> GetWeeklySpending()
        {
            Guid userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Invalid token." });

            var today = DateTime.UtcNow.Date;
            var weekStart = today.AddDays(-6);

            var dailyTotals = await _context.Transactions
                .Where(t =>
                    t.SenderId == userId &&
                    t.RecipientId != userId &&
                    t.CreatedAt.Date >= weekStart &&
                    t.CreatedAt.Date <= today)
                .GroupBy(t => t.CreatedAt.Date)
                .Select(g => new { Date = g.Key, Total = g.Sum(t => (double)t.Amount) })
                .ToListAsync();

            var result = Enumerable.Range(0, 7).Select(i =>
            {
                var date = weekStart.AddDays(i);
                var match = dailyTotals.FirstOrDefault(d => d.Date == date);
                return new
                {
                    label = date.ToString("ddd"),
                    date = date.ToString("yyyy-MM-dd"),
                    amount = match?.Total ?? 0.0
                };
            });

            return Ok(result);
        }

        private Guid GetUserId()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                   ?? User.FindFirstValue("sub");
            return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
        }
    }
}