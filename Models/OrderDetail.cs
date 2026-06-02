using System;
using bt1.Models;
using bt1.Helpers;
using ProductModel = bt1.Product.Product;  // ← THÊM DÒNG NÀY

namespace bt1.Models
{
    public class OrderDetail
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }

        public decimal TotalPrice => Price * Quantity;

        public Order Order { get; set; }
        public ProductModel Product { get; set; }  // ← Giờ OK
    }
}