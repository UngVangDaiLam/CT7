namespace bt1.Product
{
    public class MockProductRepository : IProductRepository
    {
        private static readonly List<Product> _products = new List<Product>
        {
            new Product
            {
                Id = 1,
                Name = "Áo Thun Premium Cotton",
                Price = 299000,
                Description = "Áo thun chất liệu cotton cao cấp, thoáng mát, phù hợp mọi dịp.",
                Image = "https://picsum.photos/seed/shirt1/400/300",
                Images = new List<string>
                {
                    "https://picsum.photos/seed/shirt1/400/300",
                    "https://picsum.photos/seed/shirt2/400/300",
                    "https://picsum.photos/seed/shirt3/400/300"
                },
                Thumbnail = 0,
                Badge = "Soon",
                Rating = 4,
                InStock = false,
                StockQty = 0,
                Status = "ComingSoon",
                CategoryId = 3


            }

        };

        public IEnumerable<Product> GetAll()
        {
            return _products;
        }

        public Product? GetById(int id)
        {
            return _products.FirstOrDefault(p => p.Id == id);
        }

        public void Add(Product product)
        {
            product.Id = _products.Any() ? _products.Max(p => p.Id) + 1 : 1;
            _products.Add(product);
        }

        public void Update(Product product)
        {
            var oldProduct = GetById(product.Id);

            if (oldProduct == null) return;

            oldProduct.Name = product.Name;
            oldProduct.Price = product.Price;
            oldProduct.Description = product.Description;
            oldProduct.Image = product.Image;
            oldProduct.Images = product.Images;
            oldProduct.Thumbnail = product.Thumbnail;
            oldProduct.Badge = product.Badge;
            oldProduct.Rating = product.Rating;
            oldProduct.InStock = product.InStock;
            oldProduct.StockQty = product.StockQty;
            oldProduct.CategoryId = product.CategoryId;
        }

        public void Delete(int id)
        {
            var product = GetById(id);

            if (product != null)
            {
                _products.Remove(product);
            }
        }
    }
}