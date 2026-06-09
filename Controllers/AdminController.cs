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
        // QUẢN LÝ SẢN PHẨM
        // ====================================================

        public async Task<IActionResult> Index(int? editId, string search = "", int page = 1,
            string catSearch = "", int catPage = 1, int? editCatId = null)
        {
            if (!IsAdmin())
            {
                return RedirectToAction("Index", "Home");
            }

            const int pageSize = 10;
            search = (search ?? "").Trim();

            var query = _context.Products
                .Include(p => p.Images)
                .Include(p => p.Category)
                .Include(p => p.Reviews)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p => p.Name.Contains(search));
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)System.Math.Ceiling(totalCount / (double)pageSize);
            if (page < 1) page = 1;
            if (totalPages > 0 && page > totalPages) page = totalPages;

            var products = await query
                .OrderByDescending(p => p.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var categories = await _context.Categories
                .OrderBy(c => c.Name)
                .ToListAsync();

            ViewBag.Products = products;
            ViewBag.Categories = categories;
            ViewBag.Search = search;
            ViewBag.CurrentPage = page;
            ViewBag.TotalPages = totalPages;
            ViewBag.TotalCount = totalCount;

            // ----- DANH MỤC (tìm kiếm + phân trang riêng) -----
            catSearch = (catSearch ?? "").Trim();

            var catQuery = _context.Categories
                .Include(c => c.Products)
                .AsQueryable();

            if (!string.IsNullOrEmpty(catSearch))
            {
                catQuery = catQuery.Where(c => c.Name.Contains(catSearch));
            }

            var catTotalCount = await catQuery.CountAsync();
            var catTotalPages = (int)System.Math.Ceiling(catTotalCount / (double)pageSize);
            if (catPage < 1) catPage = 1;
            if (catTotalPages > 0 && catPage > catTotalPages) catPage = catTotalPages;

            var categoriesPaged = await catQuery
                .OrderBy(c => c.Name)
                .Skip((catPage - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            ViewBag.CategoriesPaged = categoriesPaged;
            ViewBag.CatSearch = catSearch;
            ViewBag.CatCurrentPage = catPage;
            ViewBag.CatTotalPages = catTotalPages;
            ViewBag.CatTotalCount = catTotalCount;

            if (editCatId.HasValue)
            {
                ViewBag.EditCategory = await _context.Categories
                    .FirstOrDefaultAsync(c => c.Id == editCatId.Value);
            }

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
            List<IFormFile>? imageFiles,
            List<int>? keepImageIds)
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

            // Ảnh cũ nào còn trong keepImageIds thì giữ lại.
            // Ảnh cũ nào đã bấm dấu X trên giao diện thì không gửi keepImageIds nữa,
            // nên sẽ bị xóa khỏi database và xóa file vật lý.
            keepImageIds ??= new List<int>();

            if (product.Images != null && product.Images.Any())
            {
                var imagesToRemove = product.Images
                    .Where(img => !keepImageIds.Contains(img.Id))
                    .ToList();

                foreach (var image in imagesToRemove)
                {
                    DeletePhysicalImage(image.Url);
                    _context.ProductImages.Remove(image);
                }
            }

            // Thêm ảnh mới còn lại trong input imageFiles
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
            }

            await _context.SaveChangesAsync();

            var updatedProduct = await _context.Products
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (updatedProduct != null)
            {
                updatedProduct.ImageUrl = updatedProduct.Images != null && updatedProduct.Images.Any()
                    ? updatedProduct.Images.First().Url
                    : "";

                await _context.SaveChangesAsync();
            }

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
        // DASHBOARD - THỐNG KÊ
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
        // QUẢN LÝ ĐƠN HÀNG
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
        // QUẢN LÝ USER
        // ====================================================
        /// <summary>
        /// Mở trang Quản lý danh sách người dùng
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ManageUsers()
        {
            if (!IsAdmin())
            {
                return RedirectToAction("Index", "Home");
            }

            var users = await _context.Users
                .OrderByDescending(u => u.Role == "Admin")
                .ThenBy(u => u.Username)
                .ToListAsync();

            return View("~/Views/Admin/ManageUsers.cshtml", users);
        }

        /// <summary>
        /// Thay đổi quyền User/Admin
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> ChangeRole(int id, string newRole)
        {
            if (!IsAdmin())
            {
                return Json(new { success = false, message = "Bạn không có quyền thực hiện thao tác này." });
            }

            if (newRole != "User" && newRole != "Admin")
            {
                return Json(new { success = false, message = "Quyền không hợp lệ." });
            }

            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return Json(new { success = false, message = "Không tìm thấy người dùng." });
            }

            var currentUserId = HttpContext.Session.GetInt32("UserId");

            if (currentUserId.HasValue && currentUserId.Value == user.Id && newRole != "Admin")
            {
                return Json(new
                {
                    success = false,
                    message = "Bạn không thể tự hạ quyền Admin của chính mình."
                });
            }

            user.Role = newRole;
            user.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            var roleText = newRole == "Admin" ? "Quản trị viên" : "Khách hàng";

            return Json(new
            {
                success = true,
                message = $"Đã đổi quyền tài khoản {user.Username} thành {roleText}."
            });
        }

        // ====================================================
        // XEM REVIEW
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
        // QUẢN LÝ DANH MỤC (THỂ LOẠI)
        // ====================================================

        // Trang danh mục đã gộp vào Admin/Index. Giữ action này để link cũ không lỗi.
        public IActionResult Categories(string search = "", int page = 1, int? editId = null)
        {
            return RedirectToAction(nameof(Index), new { catSearch = search, catPage = page, editCatId = editId });
        }

        [HttpPost]
        public async Task<IActionResult> AddCategory(string name)
        {
            if (!IsAdmin())
                return RedirectToAction("Index", "Home");

            name = (name ?? "").Trim();

            if (string.IsNullOrEmpty(name))
            {
                TempData["CatError"] = "Tên thể loại không được để trống.";
                return RedirectToAction(nameof(Index));
            }

            var exists = await _context.Categories
                .AnyAsync(c => c.Name == name);

            if (exists)
            {
                TempData["CatError"] = "Thể loại \"" + name + "\" đã tồn tại.";
                return RedirectToAction(nameof(Index));
            }

            _context.Categories.Add(new CategoryModel { Name = name });
            await _context.SaveChangesAsync();

            TempData["CatSuccess"] = "Đã thêm thể loại \"" + name + "\".";
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        public async Task<IActionResult> EditCategory(int id, string name)
        {
            if (!IsAdmin())
                return RedirectToAction("Index", "Home");

            name = (name ?? "").Trim();

            if (string.IsNullOrEmpty(name))
            {
                TempData["CatError"] = "Tên thể loại không được để trống.";
                return RedirectToAction(nameof(Index));
            }

            var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == id);
            if (category == null)
            {
                TempData["CatError"] = "Không tìm thấy thể loại.";
                return RedirectToAction(nameof(Index));
            }

            var duplicate = await _context.Categories
                .AnyAsync(c => c.Name == name && c.Id != id);
            if (duplicate)
            {
                TempData["CatError"] = "Đã có thể loại khác tên \"" + name + "\".";
                return RedirectToAction(nameof(Index));
            }

            category.Name = name;
            await _context.SaveChangesAsync();

            TempData["CatSuccess"] = "Đã cập nhật thể loại.";
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            if (!IsAdmin())
                return RedirectToAction("Index", "Home");

            var category = await _context.Categories
                .Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
            {
                TempData["CatError"] = "Không tìm thấy thể loại.";
                return RedirectToAction(nameof(Index));
            }

            var productCount = category.Products != null ? category.Products.Count : 0;
            if (productCount > 0)
            {
                TempData["CatError"] = "Không thể xóa \"" + category.Name + "\" vì đang có "
                    + productCount + " sản phẩm thuộc thể loại này.";
                return RedirectToAction(nameof(Index));
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            TempData["CatSuccess"] = "Đã xóa thể loại.";
            return RedirectToAction(nameof(Index));
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

            var relativePath = imageUrl
                .TrimStart('/')
                .Replace("/", Path.DirectorySeparatorChar.ToString());

            var fullPath = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot",
                relativePath
            );

            if (System.IO.File.Exists(fullPath))
            {
                try
                {
                    System.IO.File.Delete(fullPath);
                }
                catch
                {
                    // Không chặn cập nhật/xóa sản phẩm nếu xóa file vật lý bị lỗi
                }
            }
        }
    }
}