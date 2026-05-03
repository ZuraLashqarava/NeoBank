using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineBankBack.Services;

namespace OnlineBankBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CountryController : ControllerBase
    {
        private readonly RestCountriesService _countriesService;

        public CountryController(RestCountriesService countriesService)
        {
            _countriesService = countriesService;
        }

        [HttpGet("calling-codes")]
        public async Task<IActionResult> GetCallingCodes()
        {
            var codes = await _countriesService.GetCallingCodesAsync();
            if (!codes.Any())
                return StatusCode(503, new { message = "Could not fetch country data." });

            return Ok(codes);
        }
    }
}