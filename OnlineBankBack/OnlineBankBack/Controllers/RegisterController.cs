using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OnlineBankBack.Data;
using OnlineBankBack.DTOs;
using OnlineBankBack.Models;
using OnlineBankBack.Security;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace OnlineBankBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RegisterController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly EmailSender _emailSender;
        private readonly IConfiguration _configuration;

        public RegisterController(DataContext context, EmailSender emailSender, IConfiguration configuration)
        {
            _context = context;
            _emailSender = emailSender;
            _configuration = configuration;
        }

        [HttpPost]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            bool emailExists = await _context.Users.AnyAsync(u => u.Email == dto.Email);
            if (emailExists)
                return Conflict(new { message = "Email is already registered." });

            bool personalNumberExists = await _context.Users.AnyAsync(u => u.PersonalNumber == dto.PersonalNumber);
            if (personalNumberExists)
                return Conflict(new { message = "Personal number is already registered." });

            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = dto.FullName,
                Email = dto.Email,
                PersonalNumber = dto.PersonalNumber,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                CreatedAt = DateTime.UtcNow,
                Currency = "USD"
            };

            var wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Balances = new List<WalletBalance>
                {
                    new WalletBalance
                    {
                        Id = Guid.NewGuid(),
                        Currency = "USD",
                        Balance = 500.00m
                    }
                }
            };

            var externalCard = new ExternalCard
            {
                Id = Guid.NewGuid(),
                CardHolderName = dto.CardHolderName,
                LastFour = dto.CardNumber[^4..],
                UserId = user.Id
            };

            var rng = new Random();
            string pinCode = rng.Next(1000, 10000).ToString();
            var virtualCard = GenerateVirtualCard(user.Id, user.FullName, pinCode);

            await _context.Users.AddAsync(user);
            await _context.Wallets.AddAsync(wallet);
            await _context.ExternalCards.AddAsync(externalCard);
            await _context.VirtualCards.AddAsync(virtualCard);
            await _context.SaveChangesAsync();

            await _emailSender.SendPinCodeEmailAsync(user.Email, user.FullName, pinCode, virtualCard.CardNumber[^4..]);

            string token = GenerateJwtToken(user.Id, user.Email, user.FullName);

            return Ok(new
            {
                message = "Registration successful.",
                token,
                userId = user.Id,
                fullName = user.FullName,
                email = user.Email,
                currency = user.Currency,
                virtualCard = new VirtualCardDto
                {
                    Id = virtualCard.Id,
                    CardNumber = virtualCard.CardNumber,
                    CardHolderName = virtualCard.CardHolderName,
                    ExpiryDate = virtualCard.ExpiryDate,
                    Cvv = virtualCard.CVV,
                    Nickname = virtualCard.Nickname,
                    IsActive = virtualCard.IsActive,
                    Network = virtualCard.Network,
                    IssuedAt = virtualCard.IssuedAt,
                    CurrentDailySpent = virtualCard.CurrentDailySpent
                }
            });
        }

        private static VirtualCard GenerateVirtualCard(Guid userId, string fullName, string pinCode)
        {
            var rng = new Random();
            string randomDigits = string.Concat(Enumerable.Range(0, 12).Select(_ => rng.Next(0, 10).ToString()));
            string cardNumber = "9999" + randomDigits;
            string cvv = rng.Next(100, 1000).ToString();
            string expiryDate = DateTime.UtcNow.AddYears(4).ToString("MM/yy");

            return new VirtualCard
            {
                Id = Guid.NewGuid(),
                CardNumber = cardNumber,
                CardHolderName = fullName,
                ExpiryDate = expiryDate,
                CVV = cvv,
                PinCode = pinCode,
                Nickname = "Main Virtual Card",
                IsActive = true,
                Network = "NeoBank",
                UserId = userId,
                IssuedAt = DateTime.UtcNow,
                CurrentDailySpent = 0.00m
            };
        }

        private string GenerateJwtToken(Guid userId, string email, string fullName)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, email),
                new Claim(JwtRegisteredClaimNames.Name, fullName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}