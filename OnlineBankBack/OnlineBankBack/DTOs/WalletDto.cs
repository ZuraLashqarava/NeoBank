namespace OnlineBankBack.DTOs
{
    public class WalletBalanceDto
    {
        public string Currency { get; set; } = string.Empty;
        public decimal Balance { get; set; }
    }

    public class WalletDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public List<WalletBalanceDto> Balances { get; set; } = new();
    }
}
