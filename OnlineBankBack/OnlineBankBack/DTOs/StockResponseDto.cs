namespace OnlineBankBack.DTOs
{
    public class StockQuoteResponseDto
    {
        public string Symbol { get; set; } = string.Empty;
        public decimal CurrentPrice { get; set; }            
        public decimal Change { get; set; }                  
        public decimal PercentChange { get; set; }          
        public decimal HighPrice { get; set; }             
        public decimal LowPrice { get; set; }               
        public decimal OpenPrice { get; set; }              
        public decimal PreviousClose { get; set; }          
    }
    public class StockSearchResultDto
    {
        public string Symbol { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
    }

    public class PortfolioItemDto
    {
        public string Symbol { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal AverageBuyPrice { get; set; }
        public decimal CurrentPrice { get; set; }
        public decimal TotalValue { get; set; }
        public decimal ProfitLoss { get; set; }
        public decimal ProfitLossPercent { get; set; }
    }

    public class StockTransactionHistoryDto
    {
        public Guid Id { get; set; }
        public string Symbol { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal PriceAtTransaction { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
