using bt1.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductModel = bt1.Product.Product;
using ProductReviewModel = bt1.Product.ProductReview;

namespace bt1.Controllers
{
    public class ProductController : Controller
    {
        private readonly ApplicationDbContext _context;

        public ProductController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: /Product/Detail/5
        public async Task<IActionResult> Detail(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Include(p => p.Reviews)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return NotFound();
            }

            return View(product);
        }

        // POST: /Product/AddReview
        [HttpPost]
        public async Task<IActionResult> AddReview(int productId, string customerName, string customerEmail, int rating, string comment)
        {
            // Validation
            if (string.IsNullOrWhiteSpace(customerName))
            {
                return Json(new { success = false, message = "Tên khách hàng không được để trống" });
            }

            if (string.IsNullOrWhiteSpace(customerEmail) || !customerEmail.Contains("@"))
            {
                return Json(new { success = false, message = "Email không hợp lệ" });
            }

            if (rating < 1 || rating > 5)
            {
                return Json(new { success = false, message = "Đánh giá phải từ 1 đến 5 sao" });
            }

            if (string.IsNullOrWhiteSpace(comment) || comment.Length < 5)
            {
                return Json(new { success = false, message = "Bình luận phải từ 5 ký tự trở lên" });
            }

            var product = await _context.Products.FindAsync(productId);
            if (product == null)
            {
                return Json(new { success = false, message = "Sản phẩm không tồn tại" });
            }

            var review = new ProductReviewModel
            {
                ProductId = productId,
                CustomerName = customerName.Trim(),
                CustomerEmail = customerEmail.Trim(),
                Rating = rating,
                Comment = comment.Trim(),
                CreatedAt = DateTime.Now,
                IsApproved = true
            };

            _context.ProductReviews.Add(review);
            await _context.SaveChangesAsync();

            return Json(new { success = true, message = "Cảm ơn bạn đã đánh giá sản phẩm!" });
        }

        // GET: /Product/GetReviews/5
        public async Task<IActionResult> GetReviews(int productId, int page = 1, int pageSize = 5)
        {
            var reviews = await _context.ProductReviews
                .Where(r => r.ProductId == productId && r.IsApproved)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var totalCount = await _context.ProductReviews
                .CountAsync(r => r.ProductId == productId && r.IsApproved);

            return Json(new
            {
                reviews = reviews,
                totalCount = totalCount,
                page = page,
                pageSize = pageSize,
                totalPages = Math.Ceiling((double)totalCount / pageSize)
            });
        }

        // DELETE: /Product/DeleteImage/5
        [HttpPost]
        public async Task<IActionResult> DeleteImage(int imageId)
        {
            var image = await _context.ProductImages.FindAsync(imageId);
            if (image == null)
            {
                return Json(new { success = false, message = "Ảnh không tồn tại" });
            }

            try
            {
                // Xóa file từ server
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", image.Url.TrimStart('/'));
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }

                _context.ProductImages.Remove(image);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Ảnh đã được xóa" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }
    }
}