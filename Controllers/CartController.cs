using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using bt1.Models;
using bt1.Helpers;

namespace bt1.Controllers
{
    public class CartController : Controller
    {
        private readonly ApplicationDbContext _context;

        public CartController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Trang giỏ hàng
        /// </summary>
        public IActionResult Index()
        {
            var cart = CartHelper.GetCart(HttpContext.Session);
            return View("Cart_Index", cart);
        }

        /// <summary>
        /// Thêm sản phẩm vào giỏ (AJAX)
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> AddToCart(int productId, int quantity = 1)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null)
            {
                return Json(new { success = false, message = "Sản phẩm không tồn tại." });
            }

            // Kiểm tra tồn kho
            if (product.StockQty < quantity)
            {
                return Json(new
                {
                    success = false,
                    message = $"Chỉ còn {product.StockQty} sản phẩm tồn kho."
                });
            }

            CartHelper.AddToCart(HttpContext.Session,
                product.Id,
                product.Name,
                product.Price,
                !string.IsNullOrEmpty(product.ImageUrl) ? product.ImageUrl : $"https://picsum.photos/seed/{product.Id}/400/300",
                quantity);

            var itemCount = CartHelper.GetItemCount(HttpContext.Session);

            return Json(new
            {
                success = true,
                message = $"Đã thêm {product.Name} vào giỏ hàng.",
                itemCount = itemCount
            });
        }

        /// <summary>
        /// Xóa sản phẩm khỏi giỏ (AJAX)
        /// </summary>
        [HttpPost]
        public IActionResult RemoveFromCart(int productId)
        {
            CartHelper.RemoveFromCart(HttpContext.Session, productId);
            var itemCount = CartHelper.GetItemCount(HttpContext.Session);
            var total = CartHelper.GetTotal(HttpContext.Session);

            return Json(new
            {
                success = true,
                itemCount = itemCount,
                total = total.ToString("N0")
            });
        }

        /// <summary>
        /// Cập nhật số lượng (AJAX)
        /// </summary>
        [HttpPost]
        public IActionResult UpdateQuantity(int productId, int quantity)
        {
            if (quantity <= 0)
            {
                CartHelper.RemoveFromCart(HttpContext.Session, productId);
            }
            else
            {
                CartHelper.UpdateQuantity(HttpContext.Session, productId, quantity);
            }

            var itemCount = CartHelper.GetItemCount(HttpContext.Session);
            var total = CartHelper.GetTotal(HttpContext.Session);

            return Json(new
            {
                success = true,
                itemCount = itemCount,
                total = total.ToString("N0")
            });
        }

        /// <summary>
        /// Xóa toàn bộ giỏ hàng
        /// </summary>
        [HttpPost]
        public IActionResult ClearCart()
        {
            CartHelper.ClearCart(HttpContext.Session);
            return Json(new { success = true });
        }

        /// <summary>
        /// Lấy số lượng giỏ hàng (AJAX)
        /// </summary>
        [HttpGet]
        public IActionResult GetCartCount()
        {
            var count = CartHelper.GetItemCount(HttpContext.Session);
            return Json(new { count = count });
        }
    }
}