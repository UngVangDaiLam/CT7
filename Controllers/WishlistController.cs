using bt1.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace bt1.Controllers
{
    public class WishlistController : Controller
    {
        private readonly ApplicationDbContext _context;

        public WishlistController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int? CurrentUserId() => HttpContext.Session.GetInt32("UserId");

        // Trang danh sách yêu thích
        public async Task<IActionResult> Index()
        {
            var userId = CurrentUserId();
            if (!userId.HasValue)
            {
                return RedirectToAction("Index", "Home");
            }

            var productIds = await _context.WishlistItems
                .Where(w => w.UserId == userId.Value)
                .OrderByDescending(w => w.CreatedAt)
                .Select(w => w.ProductId)
                .ToListAsync();

            var products = await _context.Products
                .Include(p => p.Images)
                .Include(p => p.Category)
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync();

            // Giữ đúng thứ tự mới thêm lên trước
            products = productIds
                .Select(id => products.FirstOrDefault(p => p.Id == id))
                .Where(p => p != null)
                .ToList()!;

            return View("Wishlist_Index", products);
        }

        // Thêm/bỏ yêu thích (AJAX) - dùng cho nút trái tim
        [HttpPost]
        public async Task<IActionResult> Toggle(int productId)
        {
            var userId = CurrentUserId();
            if (!userId.HasValue)
            {
                return Json(new { success = false, requireLogin = true, message = "Vui lòng đăng nhập để dùng yêu thích." });
            }

            var existing = await _context.WishlistItems
                .FirstOrDefaultAsync(w => w.UserId == userId.Value && w.ProductId == productId);

            bool added;
            if (existing != null)
            {
                _context.WishlistItems.Remove(existing);
                added = false;
            }
            else
            {
                _context.WishlistItems.Add(new WishlistItem
                {
                    UserId = userId.Value,
                    ProductId = productId
                });
                added = true;
            }

            await _context.SaveChangesAsync();

            var count = await _context.WishlistItems.CountAsync(w => w.UserId == userId.Value);
            return Json(new { success = true, added, count });
        }

        // Xóa khỏi yêu thích (AJAX) - dùng trong trang Wishlist
        [HttpPost]
        public async Task<IActionResult> Remove(int productId)
        {
            var userId = CurrentUserId();
            if (!userId.HasValue)
            {
                return Json(new { success = false, message = "Vui lòng đăng nhập." });
            }

            var item = await _context.WishlistItems
                .FirstOrDefaultAsync(w => w.UserId == userId.Value && w.ProductId == productId);

            if (item != null)
            {
                _context.WishlistItems.Remove(item);
                await _context.SaveChangesAsync();
            }

            var count = await _context.WishlistItems.CountAsync(w => w.UserId == userId.Value);
            return Json(new { success = true, count });
        }

        // Đếm số sản phẩm yêu thích (AJAX) - cho badge trên header
        [HttpGet]
        public async Task<IActionResult> Count()
        {
            var userId = CurrentUserId();
            if (!userId.HasValue)
            {
                return Json(new { count = 0 });
            }

            var count = await _context.WishlistItems.CountAsync(w => w.UserId == userId.Value);
            return Json(new { count });
        }

        // Lấy danh sách ProductId đã yêu thích (AJAX) - để tô đậm tim sản phẩm
        [HttpGet]
        public async Task<IActionResult> Ids()
        {
            var userId = CurrentUserId();
            if (!userId.HasValue)
            {
                return Json(new { ids = new int[0] });
            }

            var ids = await _context.WishlistItems
                .Where(w => w.UserId == userId.Value)
                .Select(w => w.ProductId)
                .ToListAsync();

            return Json(new { ids });
        }
    }
}
