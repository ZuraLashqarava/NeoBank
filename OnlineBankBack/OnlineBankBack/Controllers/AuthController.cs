using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OnlineBankBack.Data;
using OnlineBankBack.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace OnlineBankBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(DataContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
                return Unauthorized(new { message = "Invalid email or password." });

            bool passwordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            if (!passwordValid)
                return Unauthorized(new { message = "Invalid email or password." });

            string token = GenerateJwtToken(user.Id, user.Email, user.FullName);

            return Ok(new
            {
                token,
                userId = user.Id,
                fullName = user.FullName,
                email = user.Email,
                currency = user.Currency
            });
        }

        private string GenerateJwtToken(Guid userId, string email, string fullName)
        {
            string jwtKey = _configuration["Jwt:Key"]!;
            string jwtIssuer = _configuration["Jwt:Issuer"]!;
            string jwtAudience = _configuration["Jwt:Audience"]!;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, email),
                new Claim(JwtRegisteredClaimNames.Name, fullName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}