namespace OnlineBankBack.DTOs
{
    public class TransactionResponseDto
    {
        public Guid Id { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string? RecipientName { get; set; }
        public string RecipientLabel { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
