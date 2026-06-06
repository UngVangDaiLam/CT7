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
        public async Task<IActionResult> Register(string username, string email, string password, string confirmPassword, string fullName)
        {
            // Validation
            if (string.IsNullOrWhiteSpace(username))
            {
                return Json(new { success = false, message = "Tên đăng nhập không được để trống." });
            }

            if (username.Length < 3)
            {
                return Json(new { success = false, message = "Tên đăng nhập phải từ 3 ký tự trở lên." });
            }

            if (string.IsNullOrWhiteSpace(email) || !email.Contains("@"))
            {
                return Json(new { success = false, message = "Email không hợp lệ." });
            }

            if (string.IsNullOrWhiteSpace(password) || password.Length < 6)
            {
                return Json(new { success = false, message = "Mật khẩu phải từ 6 ký tự trở lên." });
            }

            if (password != confirmPassword)
            {
                return Json(new { success = false, message = "Mật khẩu và xác nhận mật khẩu không khớp." });
            }

            if (string.IsNullOrWhiteSpace(fullName))
            {
                return Json(new { success = false, message = "Họ và tên không được để trống." });
            }

            // Chuẩn hóa giống lúc lưu để kiểm tra trùng cho chính xác
            var uname = username.Trim();
            var mail = email.Trim().ToLower();

            // Kiểm tra username đã tồn tại
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == uname);

            if (existingUser != null)
            {
                return Json(new { success = false, message = "Tên đăng nhập đã tồn tại." });
            }

            // Kiểm tra email đã tồn tại
            var existingEmail = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == mail);

            if (existingEmail != null)
            {
                return Json(new { success = false, message = "Email đã được đăng ký." });
            }

            // Tạo user mới
            var user = new User
            {
                Username = uname,
                Email = mail,
                FullName = fullName.Trim(),
                PasswordHash = HashPassword(password),
                IsActive = true,
                Role = "User"
            };

            _context.Users.Add(user);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Phòng trường hợp trùng do unique index (username/email)
                return Json(new { success = false, message = "Tên đăng nhập hoặc email đã tồn tại." });
            }

            return Json(new { success = true, message = "Đăng ký thành công! Vui lòng đăng nhập." });
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

        // POST: /Account/ChangePassword (AJAX) - đổi mật khẩu cho user đang đăng nhập
        [HttpPost]
        public async Task<IActionResult> ChangePassword(string oldPassword, string newPassword, string confirmPassword)
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (!userId.HasValue)
            {
                return Json(new { success = false, message = "Vui lòng đăng nhập." });
            }

            if (string.IsNullOrWhiteSpace(oldPassword) || string.IsNullOrWhiteSpace(newPassword))
            {
                return Json(new { success = false, message = "Vui lòng nhập đầy đủ thông tin." });
            }

            if (newPassword.Length < 6)
            {
                return Json(new { success = false, message = "Mật khẩu mới phải từ 6 ký tự trở lên." });
            }

            if (newPassword != confirmPassword)
            {
                return Json(new { success = false, message = "Xác nhận mật khẩu không khớp." });
            }

            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null)
            {
                return Json(new { success = false, message = "Không tìm thấy tài khoản." });
            }

            if (!VerifyPassword(oldPassword, user.PasswordHash))
            {
                return Json(new { success = false, message = "Mật khẩu cũ không chính xác." });
            }

            user.PasswordHash = HashPassword(newPassword);
            user.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Json(new { success = true, message = "Đổi mật khẩu thành công!" });
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