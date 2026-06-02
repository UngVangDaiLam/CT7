using bt1.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace bt1.Controllers
{
    public class AccountController : Controller
    {
        private readonly ApplicationDbContext _context;

        public AccountController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: /Account/Register
        public IActionResult Register()
        {
            return View();
        }

        // POST: /Account/Register
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(string username, string email, string password, string confirmPassword, string fullName)
        {
            // Validation
            if (string.IsNullOrWhiteSpace(username))
            {
                TempData["Error"] = "Tên đăng nhập không được để trống.";
                return RedirectToAction(nameof(Register));
            }

            if (username.Length < 3)
            {
                TempData["Error"] = "Tên đăng nhập phải từ 3 ký tự trở lên.";
                return RedirectToAction(nameof(Register));
            }

            if (string.IsNullOrWhiteSpace(email) || !email.Contains("@"))
            {
                TempData["Error"] = "Email không hợp lệ.";
                return RedirectToAction(nameof(Register));
            }

            if (string.IsNullOrWhiteSpace(password) || password.Length < 6)
            {
                TempData["Error"] = "Mật khẩu phải từ 6 ký tự trở lên.";
                return RedirectToAction(nameof(Register));
            }

            if (password != confirmPassword)
            {
                TempData["Error"] = "Mật khẩu và xác nhận mật khẩu không khớp.";
                return RedirectToAction(nameof(Register));
            }

            if (string.IsNullOrWhiteSpace(fullName))
            {
                TempData["Error"] = "Họ và tên không được để trống.";
                return RedirectToAction(nameof(Register));
            }

            // Kiểm tra username đã tồn tại
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username);

            if (existingUser != null)
            {
                TempData["Error"] = "Tên đăng nhập đã tồn tại.";
                return RedirectToAction(nameof(Register));
            }

            // Kiểm tra email đã tồn tại
            var existingEmail = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);

            if (existingEmail != null)
            {
                TempData["Error"] = "Email đã được đăng ký.";
                return RedirectToAction(nameof(Register));
            }

            // Tạo user mới
            var user = new User
            {
                Username = username.Trim(),
                Email = email.Trim().ToLower(),
                FullName = fullName.Trim(),
                PasswordHash = HashPassword(password),
                IsActive = true,
                Role = "User"
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            TempData["Success"] = "Đăng ký thành công! Vui lòng đăng nhập.";
            return RedirectToAction("Index", "Home");
        }

        // POST: /Account/Login
        [HttpPost]
        public async Task<IActionResult> Login(string username, string password)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                return Json(new { success = false, message = "Tên đăng nhập và mật khẩu không được để trống." });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user == null || !VerifyPassword(password, user.PasswordHash))
            {
                return Json(new { success = false, message = "Tên đăng nhập hoặc mật khẩu không chính xác." });
            }

            if (!user.IsActive)
            {
                return Json(new { success = false, message = "Tài khoản của bạn đã bị khóa." });
            }

            // Lưu session
            HttpContext.Session.SetInt32("UserId", user.Id);
            HttpContext.Session.SetString("Username", user.Username);
            HttpContext.Session.SetString("FullName", user.FullName);
            HttpContext.Session.SetString("Role", user.Role);

            return Json(new { success = true, message = "Đăng nhập thành công!", role = user.Role });
        }

        // POST: /Account/Logout
        [HttpPost]
        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("Index", "Home");
        }

        // GET: /Account/CheckAuth (dùng cho AJAX kiểm tra đăng nhập)
        [HttpGet]
        public IActionResult CheckAuth()
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            var role = HttpContext.Session.GetString("Role");

            if (userId.HasValue)
            {
                return Json(new
                {
                    isLoggedIn = true,
                    userId = userId,
                    username = HttpContext.Session.GetString("Username"),
                    fullName = HttpContext.Session.GetString("FullName"),
                    role = role
                });
            }

            return Json(new { isLoggedIn = false });
        }

        // Hàm mã hóa mật khẩu (sử dụng SHA256)
        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        // Hàm xác minh mật khẩu
        private bool VerifyPassword(string password, string hash)
        {
            var hashOfInput = HashPassword(password);
            return hashOfInput == hash;
        }
    }
}