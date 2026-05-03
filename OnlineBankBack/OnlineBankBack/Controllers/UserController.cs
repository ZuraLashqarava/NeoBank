using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineBankBack.Data;
using System.Security.Claims;

namespace OnlineBankBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly DataContext _context;

        public UserController(DataContext context)
        {
            _context = context;
        }

        [HttpGet("lookup")]
        public async Task<IActionResult> Lookup([FromQuery] string personalNumber)
        {
            if (string.IsNullOrWhiteSpace(personalNumber))
                return BadRequest(new { message = "Personal number is required." });

            var user = await _context.Users
                .Where(u => u.PersonalNumber == personalNumber)
                .Select(u => new { fullName = u.FullName })
                .FirstOrDefaultAsync();

            if (user is null)
                return NotFound(new { message = "No user found with this personal number." });

            return Ok(user);
        }
    }
}