using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineBankBack.Data;
using OnlineBankBack.DTOs;
using OnlineBankBack.Models;
using System.Security.Claims;

namespace OnlineBankBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TransactionController : ControllerBase
    {
        private readonly DataContext _context;

        public TransactionController(DataContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyTransactions()
        {
            Guid userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Invalid token." });

            var transactions = await _context.Transactions
                .Where(t => t.SenderId == userId || t.RecipientId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .Take(50)
                .Select(t => new TransactionResponseDto
                {
                    Id = t.Id,
                    SenderName = t.Sender.FullName,
                    RecipientName = t.Recipient != null ? t.Recipient.FullName : null,
                    RecipientLabel = t.RecipientLabel,
                    Amount = t.Amount,
                    Category = t.Category.ToString(),
                    Description = t.Description,
                    Status = t.Status.ToString(),
                    CreatedAt = t.CreatedAt
                })
                .ToListAsync();

            return Ok(transactions);
        }

        [HttpPost("transfer/person")]
        public async Task<IActionResult> TransferToPerson([FromBody] TransferToPersonDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            Guid senderId = GetUserId();
            if (senderId == Guid.Empty)
                return Unauthorized(new { message = "Invalid token." });

            var senderCard = await _context.VirtualCards
                .FirstOrDefaultAsync(c => c.UserId == senderId && c.IsActive);

            if (senderCard is null)
                return NotFound(new { message = "No active virtual card found." });

            if (senderCard.PinCode != dto.PinCode)
                return BadRequest(new { message = "Incorrect PIN." });

            var senderWallet = await _context.Wallets
                .Include(w => w.Balances)
                .FirstOrDefaultAsync(w => w.UserId == senderId);

            if (senderWallet is null)
                return NotFound(new { message = "Sender wallet not found." });

            var senderBalance = senderWallet.Balances.FirstOrDefault(b => b.Currency == "USD");
            if (senderBalance is null || senderBalance.Balance < dto.Amount)
                return BadRequest(new { message = "Insufficient USD balance." });

            var recipient = await _context.Users
                .FirstOrDefaultAsync(u => u.PersonalNumber == dto.RecipientPersonalNumber);

            if (recipient is null)
                return NotFound(new { message = "Recipient not found." });

            if (recipient.Id == senderId)
                return BadRequest(new { message = "Cannot transfer to yourself. Use Own Account instead." });

            var recipientWallet = await _context.Wallets
                .Include(w => w.Balances)
                .FirstOrDefaultAsync(w => w.UserId == recipient.Id);

            if (recipientWallet is null)
                return NotFound(new { message = "Recipient wallet not found." });

            senderBalance.Balance -= dto.Amount;

            var recipientBalance = recipientWallet.Balances.FirstOrDefault(b => b.Currency == "USD");
            if (recipientBalance is null)
            {
                recipientBalance = new WalletBalance
                {
                    Id = Guid.NewGuid(),
                    WalletId = recipientWallet.Id,
                    Currency = "USD",
                    Balance = dto.Amount
                };
                await _context.WalletBalances.AddAsync(recipientBalance);
            }
            else
            {
                recipientBalance.Balance += dto.Amount;
            }

            senderCard.CurrentDailySpent += dto.Amount;

            var tx = new Transaction
            {
                SenderId = senderId,
                RecipientId = recipient.Id,
                Amount = dto.Amount,
                Category = TransactionCategory.OtherPerson,
                RecipientLabel = recipient.FullName,
                Description = dto.Description,
                Status = TransactionStatus.Completed
            };

            await _context.Transactions.AddAsync(tx);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Successfully transferred ${dto.Amount:F2} to {recipient.FullName}.",
                newBalance = senderBalance.Balance,
                transactionId = tx.Id
            });
        }

        [HttpPost("transfer/own-account")]
        public async Task<IActionResult> TransferToOwnAccount([FromBody] TransferToOwnAccountDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            Guid userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Invalid token." });

            var wallet = await _context.Wallets
                .Include(w => w.Balances)
                .FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet is null)
                return NotFound(new { message = "Wallet not found." });

            var balance = wallet.Balances.FirstOrDefault(b => b.Currency == "USD");
            if (balance is null)
                return NotFound(new { message = "USD balance not found." });

            balance.Balance += dto.Amount;

            var tx = new Transaction
            {
                SenderId = userId,
                RecipientId = userId,
                Amount = dto.Amount,
                Category = TransactionCategory.OwnAccount,
                RecipientLabel = "Own Account",
                Description = string.IsNullOrWhiteSpace(dto.Description) ? "Own account transfer" : dto.Description,
                Status = TransactionStatus.Completed
            };

            await _context.Transactions.AddAsync(tx);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Successfully added ${dto.Amount:F2} to your account.",
                newBalance = balance.Balance,
                transactionId = tx.Id
            });
        }

        [HttpPost("pay")]
        public async Task<IActionResult> GeneralPayment([FromBody] GeneralPaymentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            Guid userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Invalid token." });

            var card = await _context.VirtualCards
                .FirstOrDefaultAsync(c => c.UserId == userId && c.IsActive);

            if (card is null)
                return NotFound(new { message = "No active virtual card found." });

            if (card.PinCode != dto.PinCode)
                return BadRequest(new { message = "Incorrect PIN." });

            var wallet = await _context.Wallets
                .Include(w => w.Balances)
                .FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet is null)
                return NotFound(new { message = "Wallet not found." });

            var balance = wallet.Balances.FirstOrDefault(b => b.Currency == "USD");
            if (balance is null || balance.Balance < dto.Amount)
                return BadRequest(new { message = "Insufficient USD balance." });

            balance.Balance -= dto.Amount;
            card.CurrentDailySpent += dto.Amount;

            var tx = new Transaction
            {
                SenderId = userId,
                RecipientId = null,
                Amount = dto.Amount,
                Category = dto.Category,
                RecipientLabel = dto.RecipientLabel,
                Description = dto.Description,
                Status = TransactionStatus.Completed
            };

            await _context.Transactions.AddAsync(tx);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Payment of ${dto.Amount:F2} to {dto.RecipientLabel} completed.",
                newBalance = balance.Balance,
                transactionId = tx.Id
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