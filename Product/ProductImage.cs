namespace bt1.Product
{
    public class ProductImage
    {
        public int Id { get; set; }

        public string Url { get; set; } = "";

        public int ProductId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public Product? Product { get; set; }
    }
}