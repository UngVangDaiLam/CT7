using bt1.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductModel = bt1.Product.Product;
using ProductImageModel = bt1.Product.ProductImage;
using CategoryModel = bt1.Category.Category;

namespace bt1.Controllers
{
    public class AdminController : Controller
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ====================================================
        // QUẢN LÝ SẢN PHẨM (giữ nguyên)
        // ====================================================

        public async Task<IActionResult> Index(int? editId)
        {
            var products = await _context.Products
                .Include(p => p.Images)
                .Include(p => p.Category)
                .Include(p => p.Reviews)
                .OrderByDescending(p => p.Id)
                .ToListAsync();

            var categories = await _context.Categories
                .OrderBy(c => c.Name)
                .ToListAsync();

            ViewBag.Products = products;
            ViewBag.Categories = categories;

            if (editId.HasValue)
            {
                var editProduct = await _context.Products
                    .Include(p => p.Images)
                    .Include(p => p.Category)
                    .FirstOrDefaultAsync(p => p.Id == editId.Value);

                if (editProduct == null)
                {
                    TempData["Error"] = "Không tìm thấy sản phẩm cần sửa.";
                    return RedirectToAction(nameof(Index));
                }

                ViewBag.EditProduct = editProduct;
            }

            return View("Admin_Index");
        }

        public IActionResult EditProduct(int id)
        {
            return RedirectToAction(nameof(Index), new { editId = id });
        }

        [HttpPost]
        public async Task<IActionResult> AddProduct(
            string name,
            decimal price,
            int? categoryId,
            string description,
            string? status,
            int stockQty,
            string? badge,
            int rating,
            List<IFormFile>? imageFiles)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                TempData["Error"] = "Tên sản phẩm không được để trống.";
                return RedirectToAction(nameof(Index));
            }

            if (price <= 0)
            {
                TempData["Error"] = "Giá sản phẩm phải lớn hơn 0.";
                return RedirectToAction(nameof(Index));
            }

            status = string.IsNullOrWhiteSpace(status) ? "InStock" : status;

            if (status == "InStock" && stockQty <= 0)
            {
                TempData["Error"] = "Sản phẩm còn hàng thì số lượng tồn kho phải lớn hơn 0.";
                return RedirectToAction(nameof(Index));
            }

            if (status == "ComingSoon")
            {
                badge = "Soon";
                stockQty = 0;
            }

            if (status == "OutOfStock")
            {
                stockQty = 0;
            }

            var category = await GetOrCreateCategory(categoryId);

            var product = new ProductModel
            {
                Name = name,
                Price = price,
                Description = description,
                Status = status,
                StockQty = stockQty,
                Badge = badge,
                Rating = rating > 0 ? rating : 5,
                CategoryId = category.Id,
                Images = new List<ProductImageModel>()
            };

            if (imageFiles != null && imageFiles.Count > 0)
            {
                foreach (var file in imageFiles)
                {
                    if (file.Length <= 0)
                    {
                        continue;
                    }

                    var imagePath = await SaveImage(file);

                    product.Images.Add(new ProductImageModel
                    {
                        Url = imagePath
                    });
                }

                if (product.Images.Any())
                {
                    product.ImageUrl = product.Images.First().Url;
                }
            }

            if (string.IsNullOrWhiteSpace(product.ImageUrl))
            {
                product.ImageUrl = "https://picsum.photos/seed/" + DateTime.Now.Ticks + "/400/300";
            }

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            TempData["Success"] = "Thêm sản phẩm thành công.";

            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        public async Task<IActionResult> EditProduct(
            int id,
            string name,
            decimal price,
            int? categoryId,
            string description,
            string? status,
            int stockQty,
            string? badge,
            int rating,
            List<IFormFile>? imageFiles)
        {
            var product = await _context.Products
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                TempData["Error"] = "Không tìm thấy sản phẩm cần cập nhật.";
                return RedirectToAction(nameof(Index));
            }

            if (string.IsNullOrWhiteSpace(name))
            {
                TempData["Error"] = "Tên sản phẩm không được để trống.";
                return RedirectToAction(nameof(Index), new { editId = id });
            }

            if (price <= 0)
            {
                TempData["Error"] = "Giá sản phẩm phải lớn hơn 0.";
                return RedirectToAction(nameof(Index), new { editId = id });
            }

            status = string.IsNullOrWhiteSpace(status) ? "InStock" : status;

            if (status == "InStock" && stockQty <= 0)
            {
                TempData["Error"] = "Sản phẩm còn hàng thì số lượng tồn kho phải lớn hơn 0.";
                return RedirectToAction(nameof(Index), new { editId = id });
            }

            if (status == "ComingSoon")
            {
                badge = "Soon";
                stockQty = 0;
            }

            if (status == "OutOfStock")
            {
                stockQty = 0;
            }

            var category = await GetOrCreateCategory(categoryId);

            product.Name = name;
            product.Price = price;
            product.Description = description;
            product.Status = status;
            product.StockQty = stockQty;
            product.Badge = badge;
            product.Rating = rating > 0 ? rating : 5;
            product.CategoryId = category.Id;

            if (imageFiles != null && imageFiles.Count > 0)
            {
                if (product.Images == null)
                {
                    product.Images = new List<ProductImageModel>();
                }

                foreach (var file in imageFiles)
                {
                    if (file.Length <= 0)
                    {
                        continue;
                    }

                    var imagePath = await SaveImage(file);

                    product.Images.Add(new ProductImageModel
                    {
                        Url = imagePath,
                        ProductId = product.Id
                    });
                }

                if (product.Images.Any())
                {
                    product.ImageUrl = product.Images.First().Url;
                }
            }

            await _context.SaveChangesAsync();

            TempData["Success"] = "Cập nhật sản phẩm thành công.";

            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products
                .Include(p => p.Images)
                .Include(p => p.Reviews)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                TempData["Error"] = "Không tìm thấy sản phẩm.";
                return RedirectToAction(nameof(Index));
            }

            if (product.Images != null)
            {
                foreach (var image in product.Images)
                {
                    DeletePhysicalImage(image.Url);
                }
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            TempData["Success"] = "Đã xóa sản phẩm.";

            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [Route("/Admin/DeleteImage")]
        public async Task<IActionResult> DeleteImage(int imageId, int productId)
        {
            var image = await _context.ProductImages
                .FirstOrDefaultAsync(i => i.Id == imageId && i.ProductId == productId);

            if (image == null)
            {
                return Json(new
                {
                    success = false,
                    message = "Không tìm thấy ảnh cần xóa."
                });
            }

            DeletePhysicalImage(image.Url);

            _context.ProductImages.Remove(image);
            await _context.SaveChangesAsync();

            var product = await _context.Products
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product != null)
            {
                product.ImageUrl = product.Images != null && product.Images.Any()
                    ? product.Images.First().Url
                    : "";

                await _context.SaveChangesAsync();
            }

            return Json(new
            {
                success = true,
                message = "Đã xóa ảnh."
            });
        }

        // ====================================================
        // DASHBOARD - THỐNG KÊ (mới)
        // ====================================================

        public async Task<IActionResult> Dashboard()
        {
            if (!IsAdmin())
                return RedirectToAction("Index", "Home");

            var totalOrders = await _context.Orders.CountAsync();
            var totalRevenue = await _context.Orders.SumAsync(o => o.TotalAmount);
            var totalProducts = await _context.Products.CountAsync();
            var totalUsers = await _context.Users.CountAsync();

            var recentOrders = await _context.Orders
                .OrderByDescending(o => o.OrderDate)
                .Take(5)
                .Include(o => o.User)
                .ToListAsync();

            var viewModel = new
            {
                TotalOrders = totalOrders,
                TotalRevenue = totalRevenue,
                TotalProducts = totalProducts,
                TotalUsers = totalUsers,
                RecentOrders = recentOrders
            };

            return View(viewModel);
        }

        // ====================================================
        // QUẢN LÝ ĐƠN HÀNG (mới)
        // ====================================================

        public async Task<IActionResult> Orders(string status = "")
        {
            if (!IsAdmin())
                return RedirectToAction("Index", "Home");

            var query = _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderDetails)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(o => o.Status == status);
            }

            var orders = await query.OrderByDescending(o => o.OrderDate).ToListAsync();

            ViewBag.Status = status;
            return View(orders);
        }

        [HttpPost]
        public async Task<IActionResult> UpdateOrderStatus(int orderId, string status)
        {
            if (!IsAdmin())
                return Json(new { success = false, message = "Không có quyền." });

            var order = await _context.Orders.FindAsync(orderId);
            if (order == null)
                return Json(new { success = false, message = "Đơn hàng không tồn tại." });

            order.Status = status;
            await _context.SaveChangesAsync();

            return Json(new { success = true, message = "Cập nhật thành công!" });
        }

        // ====================================================
        // QUẢN LÝ USER (mới)
        // ====================================================

        public async Task<IActionResult> Users()
        {
            if (!IsAdmin())
                return RedirectToAction("Index", "Home");

            var users = await _context.Users.ToListAsync();
            return View(users);
        }

        [HttpPost]
        public async Task<IActionResult> ChangeUserRole(int userId, string role)
        {
            if (!IsAdmin())
                return Json(new { success = false, message = "Không có quyền." });

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return Json(new { success = false, message = "User không tồn tại." });

            user.Role = role;
            await _context.SaveChangesAsync();

            return Json(new { success = true, message = "Cập nhật role thành công!" });
        }

        // ====================================================
        // XEM REVIEW (mới - chỉ xem)
        // ====================================================

        public async Task<IActionResult> Reviews()
        {
            if (!IsAdmin())
                return RedirectToAction("Index", "Home");

            var reviews = await _context.ProductReviews
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return View(reviews);
        }

        // ====================================================
        // HELPER METHODS
        // ====================================================

        private bool IsAdmin()
        {
            var role = HttpContext.Session.GetString("Role");
            return role == "Admin";
        }

        private async Task<CategoryModel> GetOrCreateCategory(int? categoryId)
        {
            if (categoryId.HasValue && categoryId.Value > 0)
            {
                var existingCategory = await _context.Categories
                    .FirstOrDefaultAsync(c => c.Id == categoryId.Value);

                if (existingCategory != null)
                {
                    return existingCategory;
                }
            }

            var defaultCategory = await _context.Categories
                .FirstOrDefaultAsync(c => c.Name == "Mặc định");

            if (defaultCategory != null)
            {
                return defaultCategory;
            }

            defaultCategory = new CategoryModel
            {
                Name = "Mặc định"
            };

            _context.Categories.Add(defaultCategory);
            await _context.SaveChangesAsync();

            return defaultCategory;
        }

        private async Task<string> SaveImage(IFormFile imageFile)
        {
            var folderPath = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot",
                "images",
                "products"
            );

            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            var fileName = Guid.NewGuid() + Path.GetExtension(imageFile.FileName);
            var filePath = Path.Combine(folderPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await imageFile.CopyToAsync(stream);
            }

            return "/images/products/" + fileName;
        }

        private void DeletePhysicalImage(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
            {
                return;
            }

            if (imageUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var relativePath = imageUrl.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString());

            var fullPath = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot",
                relativePath
            );

            if (System.IO.File.Exists(fullPath))
            {
                System.IO.File.Delete(fullPath);
            }
        }
    }
}