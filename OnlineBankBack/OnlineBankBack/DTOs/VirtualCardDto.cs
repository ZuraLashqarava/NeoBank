namespace OnlineBankBack.DTOs
{
    public class VirtualCardDto
    {
        public Guid Id { get; set; }
        public string CardNumber { get; set; } = string.Empty;
        public string CardHolderName { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty;
        public string Cvv { get; set; } = string.Empty;
        public string Nickname { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public string Network { get; set; } = string.Empty;
        public DateTime IssuedAt { get; set; }
        public decimal CurrentDailySpent { get; set; }
    }
}
