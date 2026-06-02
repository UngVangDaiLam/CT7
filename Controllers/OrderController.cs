using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using bt1.Models;
using bt1.Helpers;

namespace bt1.Controllers
{
    public class OrderController : Controller
    {
        private readonly ApplicationDbContext _context;

        public OrderController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lịch sử đơn hàng
        /// </summary>
        public async Task<IActionResult> Index()
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (!userId.HasValue)
            {
                return RedirectToAction("Index", "Home");
            }

            var orders = await _context.Orders
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate)
                .Include(o => o.OrderDetails)
                .ToListAsync();

            return View("Order_Index", orders);
        }

        /// <summary>
        /// Chi tiết đơn hàng
        /// </summary>
        public async Task<IActionResult> Details(int id)
        {
            var order = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderDetails)
                .ThenInclude(od => od.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
                return NotFound();

            // Kiểm tra quyền (chỉ user sở hữu hoặc admin)
            var userId = HttpContext.Session.GetInt32("UserId");
            var userRole = HttpContext.Session.GetString("Role");

            if (order.UserId != userId && userRole != "Admin")
                return Unauthorized();

            return View("Detail_Index", order);
        }

        /// <summary>
        /// Tạo đơn hàng từ giỏ hàng (AJAX)
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateOrder(string shippingAddress, string phoneNumber, string notes = "")
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (!userId.HasValue)
            {
                return Json(new { success = false, message = "Vui lòng đăng nhập." });
            }

            var cart = CartHelper.GetCart(HttpContext.Session);
            if (!cart.Any())
            {
                return Json(new { success = false, message = "Giỏ hàng trống." });
            }

            if (string.IsNullOrWhiteSpace(shippingAddress))
            {
                return Json(new { success = false, message = "Vui lòng nhập địa chỉ giao hàng." });
            }

            if (string.IsNullOrWhiteSpace(phoneNumber))
            {
                return Json(new { success = false, message = "Vui lòng nhập số điện thoại." });
            }

            try
            {
                var order = new Order
                {
                    UserId = userId.Value,
                    OrderDate = DateTime.Now,
                    Status = "Pending",
                    ShippingAddress = shippingAddress.Trim(),
                    PhoneNumber = phoneNumber.Trim(),
                    Notes = notes.Trim(),
                    TotalAmount = cart.Sum(c => c.TotalPrice)
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // Thêm chi tiết đơn hàng
                foreach (var cartItem in cart)
                {
                    var product = await _context.Products.FindAsync(cartItem.ProductId);
                    if (product == null) continue;

                    // Trừ tồn kho
                    product.StockQty -= cartItem.Quantity;

                    var orderDetail = new OrderDetail
                    {
                        OrderId = order.Id,
                        ProductId = cartItem.ProductId,
                        ProductName = cartItem.ProductName,
                        Price = cartItem.Price,
                        Quantity = cartItem.Quantity
                    };

                    _context.OrderDetails.Add(orderDetail);
                }

                await _context.SaveChangesAsync();

                // Xóa giỏ hàng
                CartHelper.ClearCart(HttpContext.Session);

                return Json(new
                {
                    success = true,
                    message = "Đơn hàng tạo thành công!",
                    orderId = order.Id
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Lỗi: " + ex.Message });
            }
        }

        /// <summary>
        /// Hủy đơn hàng
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var order = await _context.Orders
                .Include(o => o.OrderDetails)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
                return Json(new { success = false, message = "Đơn hàng không tồn tại." });

            // Kiểm tra quyền
            var userId = HttpContext.Session.GetInt32("UserId");
            if (order.UserId != userId)
                return Json(new { success = false, message = "Bạn không có quyền hủy đơn hàng này." });

            // Chỉ hủy được nếu status là Pending
            if (order.Status != "Pending")
                return Json(new { success = false, message = "Chỉ có thể hủy đơn hàng chưa được xác nhận." });

            try
            {
                order.Status = "Cancelled";

                // Hoàn lại tồn kho
                foreach (var detail in order.OrderDetails)
                {
                    var product = await _context.Products.FindAsync(detail.ProductId);
                    if (product != null)
                    {
                        product.StockQty += detail.Quantity;
                    }
                }

                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Đơn hàng đã bị hủy." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Lỗi: " + ex.Message });
            }
        }
    }
}