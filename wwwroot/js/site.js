//site.js

/**
 * ShopEasy – site.js (Single-Page / SPA version)
 * Tất cả logic: auth, products, cart, admin CRUD
 * Không dùng window.location.href – chỉ dùng showPage()
 */


// ============================================================
// AUTH FUNCTIONS
// ============================================================

// Kiểm tra trạng thái đăng nhập khi load trang
function checkAuthStatus() {
    fetch('/Account/CheckAuth')
        .then(r => r.json())
        .then(data => {
            const loginWrap = document.getElementById('nav-login-wrap');
            const logoutWrap = document.getElementById('nav-logout-wrap');

            if (data.isLoggedIn) {
                if (loginWrap) loginWrap.style.display = 'none';
                if (logoutWrap) {
                    logoutWrap.style.display = 'flex';
                    const usernameStat = document.getElementById('nav-username');
                    if (usernameStat) {
                        usernameStat.textContent = '👤 ' + data.fullName;
                    }
                }
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('username', data.username);
                localStorage.setItem('fullName', data.fullName);
                localStorage.setItem('role', data.role);
            } else {
                if (loginWrap) loginWrap.style.display = 'block';
                if (logoutWrap) logoutWrap.style.display = 'none';
                localStorage.removeItem('userId');
                localStorage.removeItem('username');
                localStorage.removeItem('fullName');
                localStorage.removeItem('role');
            }
        })
        .catch(err => console.error('Lỗi kiểm tra đăng nhập:', err));
}

// Chuyển tab login/register
function switchLoginTab(tabName) {
    console.log('Switching to tab:', tabName);

    // Ẩn tất cả tab content
    const allTabs = document.querySelectorAll('.login-tab-content');
    allTabs.forEach(tab => {
        tab.style.display = 'none';
        console.log('Hiding tab:', tab.id);
    });

    // Xóa active style từ tất cả button
    const allBtns = document.querySelectorAll('.login-tab-btn');
    allBtns.forEach(btn => {
        btn.classList.remove('active');
        btn.style.borderBottomColor = 'transparent';
        btn.style.color = '#999';
    });

    // Hiển thị tab được chọn
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.style.display = 'block';
        console.log('Tab displayed:', tabName);
    } else {
        console.warn('Tab not found:', tabName);
    }

    // Thêm active style cho button
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.borderBottomColor = '#ff6b9d';
        activeBtn.style.color = '#ff6b9d';
        console.log('Button activated:', tabName);
    } else {
        console.warn('Button not found:', tabName);
    }
}

// Xử lý Login (modal)
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) {
        console.warn('Login form not found');
        return;
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');

        if (!username || !password) {
            errorDiv.textContent = 'Vui lòng nhập tên đăng nhập và mật khẩu.';
            errorDiv.style.color = '#c33';
            return;
        }

        fetch('/Account/Login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    errorDiv.textContent = '';
                    closeLoginModal();
                    setTimeout(() => {
                        checkAuthStatus();
                        location.reload();
                    }, 300);
                } else {
                    errorDiv.textContent = data.message || 'Đăng nhập thất bại.';
                    errorDiv.style.color = '#c33';
                }
            })
            .catch(err => {
                errorDiv.textContent = 'Lỗi kết nối. Vui lòng thử lại.';
                console.error('Login error:', err);
            });
    });
}

// Xử lý Register (modal)
function setupRegisterForm() {
    const registerForm = document.getElementById('quick-register-form');
    if (!registerForm) {
        console.warn('Register form not found');
        return;
    }

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const fullName = document.getElementById('reg-fullname').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        const errorDiv = document.getElementById('register-error');

        // Validation
        if (!username || username.length < 3) {
            errorDiv.textContent = 'Tên đăng nhập phải từ 3 ký tự trở lên.';
            errorDiv.style.color = '#c33';
            return;
        }

        if (!email || !email.includes('@')) {
            errorDiv.textContent = 'Email không hợp lệ.';
            errorDiv.style.color = '#c33';
            return;
        }

        if (!fullName) {
            errorDiv.textContent = 'Họ và tên không được để trống.';
            errorDiv.style.color = '#c33';
            return;
        }

        if (!password || password.length < 6) {
            errorDiv.textContent = 'Mật khẩu phải từ 6 ký tự trở lên.';
            errorDiv.style.color = '#c33';
            return;
        }

        if (password !== confirmPassword) {
            errorDiv.textContent = 'Mật khẩu không khớp.';
            errorDiv.style.color = '#c33';
            return;
        }

        fetch('/Account/Register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&fullName=${encodeURIComponent(fullName)}&password=${encodeURIComponent(password)}&confirmPassword=${encodeURIComponent(confirmPassword)}`
        })
            .then(r => r.text())
            .then(html => {
                if (html.includes('Success') || html.includes('thành công')) {
                    errorDiv.textContent = '✓ Đăng ký thành công! Vui lòng đăng nhập.';
                    errorDiv.style.color = '#0a0';
                    setTimeout(() => {
                        registerForm.reset();
                        switchLoginTab('login-form-tab');
                    }, 1500);
                } else {
                    errorDiv.textContent = 'Đăng ký thất bại. Tên đăng nhập hoặc email có thể đã tồn tại.';
                    errorDiv.style.color = '#c33';
                }
            })
            .catch(err => {
                errorDiv.textContent = 'Lỗi kết nối. Vui lòng thử lại.';
                console.error('Register error:', err);
            });
    });
}

// Xử lý Logout
function setupLogoutBtn() {
    const logoutBtn = document.getElementById('user-logout-btn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', () => {
        fetch('/Account/Logout', { method: 'POST' })
            .then(() => {
                localStorage.clear();
                location.reload();
            })
            .catch(err => console.error('Logout error:', err));
    });
}

// Modal Login
function openLoginModal() {
    const modal = document.getElementById('login-modal-overlay');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal-overlay');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Clear form
        const form = document.getElementById('login-form');
        if (form) form.reset();
        const form2 = document.getElementById('quick-register-form');
        if (form2) form2.reset();
    }
}

// ============================================================
// INIT - Chạy khi DOM load xong
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing auth...');

    checkAuthStatus();
    setupLoginForm();
    setupRegisterForm();
    setupLogoutBtn();

    // Setup tab buttons - KỲ LẠ QUAN TRỌNG
    const tabBtns = document.querySelectorAll('.login-tab-btn');
    console.log('Found tab buttons:', tabBtns.length);

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Tab button clicked:', btn.dataset.tab);
            switchLoginTab(btn.dataset.tab);
        });
    });

    // Nút đăng nhập - mở modal
    const navLoginBtn = document.getElementById('nav-login-btn');
    if (navLoginBtn) {
        navLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openLoginModal();
        });
    }

    // Nút đóng modal
    const modalClose = document.getElementById('login-modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', (e) => {
            e.preventDefault();
            closeLoginModal();
        });
    }

    // Đóng modal khi click overlay
    const modalOverlay = document.getElementById('login-modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeLoginModal();
            }
        });
    }

    console.log('Auth initialization complete');
});
// ============================================================
// INIT - Chạy khi DOM load xong
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing auth...');

    checkAuthStatus();
    setupLoginForm();
    setupRegisterForm();
    setupLogoutBtn();

    // Setup tab buttons - QUAN TRỌNG
    const tabBtns = document.querySelectorAll('.login-tab-btn');
    console.log('Found tab buttons:', tabBtns.length);

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = btn.getAttribute('data-tab');
            console.log('Tab button clicked:', tabName);
            switchLoginTab(tabName);
        });
    });

    // Nút đăng nhập - mở modal
    const navLoginBtn = document.getElementById('nav-login-btn');
    if (navLoginBtn) {
        navLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openLoginModal();
        });
    }

    // Nút đóng modal
    const modalClose = document.getElementById('login-modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', (e) => {
            e.preventDefault();
            closeLoginModal();
        });
    }

    // Đóng modal khi click overlay
    const modalOverlay = document.getElementById('login-modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeLoginModal();
            }
        });
    }

    // Đăng xuất
    document.getElementById('user-logout-btn')?.addEventListener('click', handleLogout);
    document.getElementById('admin-logout-btn')?.addEventListener('click', handleLogout);
    document.getElementById('sidebar-logout')?.addEventListener('click', handleLogout);

    // Hero CTA scroll
    document.getElementById('hero-cta')?.addEventListener('click', () => {
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Nav products link
    document.getElementById('nav-products')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Cart drawer events
    const cartBtn = document.querySelector('.nav-cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openCartDrawer();
        });
    }

    document.getElementById('cart-drawer-close')?.addEventListener('click', closeCartDrawer);
    document.getElementById('cart-drawer-overlay')?.addEventListener('click', closeCartDrawer);
    document.getElementById('btn-checkout')?.addEventListener('click', checkoutCart);

    // Login modal – form submit
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);

    // Khởi tạo trang
    const isAdminPage = document.getElementById('admin-page') !== null;
    const isUserPage = document.getElementById('user-page') !== null;

    if (isAdminPage) {
        showPage('admin');
        return;
    }

    if (isUserPage) {
        showPage('user');
        return;
    }

    console.log('Auth initialization complete');
});

// ===========================
// CONSTANTS & CONFIG
// ===========================
const STORAGE_KEYS = {
    products: 'HNTS_products',
    user: 'HNTS_user',
    cart: 'HNTS_cart',
    reviews: 'HNTS_reviews',
};



// Sản phẩm mẫu mặc định – có thêm images[], inStock, stockQty, thumbnail
const DEFAULT_PRODUCTS = [
    {
        id: 1, name: 'Áo Thun Premium Cotton', price: 299000,
        description: 'Áo thun chất liệu cotton cao cấp, thoáng mát, phù hợp mọi dịp.',
        image: 'https://picsum.photos/seed/shirt1/400/300',
        images: ['https://picsum.photos/seed/shirt1/400/300', 'https://picsum.photos/seed/shirt2/400/300', 'https://picsum.photos/seed/shirt3/400/300'],
        thumbnail: 0, badge: 'Hot', rating: 5, inStock: true, stockQty: 50
    },

    {
        id: 2, name: 'Giày Sneaker Classic', price: 890000,
        description: 'Giày sneaker thiết kế cổ điển, êm ái, bền đẹp theo thời gian.',
        image: 'https://picsum.photos/seed/shoe1/400/300',
        images: ['https://picsum.photos/seed/shoe1/400/300', 'https://picsum.photos/seed/shoe2/400/300'],
        thumbnail: 0, badge: 'New', rating: 4, inStock: true, stockQty: 20
    },

    {
        id: 3, name: 'Túi Tote Canvas', price: 199000,
        description: 'Túi tote vải canvas chắc chắn, phong cách tối giản, đa năng.',
        image: 'https://picsum.photos/seed/bag1/400/300',
        images: ['https://picsum.photos/seed/bag1/400/300'],
        thumbnail: 0, badge: 'Sale', rating: 4, inStock: false, stockQty: 0
    },

    {
        id: 4, name: 'Đồng Hồ Minimalist', price: 1250000,
        description: 'Đồng hồ thiết kế tối giản, mặt kính sapphire chống xước.',
        image: 'https://picsum.photos/seed/watch1/400/300',
        images: ['https://picsum.photos/seed/watch1/400/300', 'https://picsum.photos/seed/watch2/400/300', 'https://picsum.photos/seed/watch3/400/300'],
        thumbnail: 0, badge: 'Hot', rating: 5, inStock: true, stockQty: 8
    },

    {
        id: 5, name: 'Kính Mát UV400', price: 450000,
        description: 'Kính mát chống tia UV400, gọng nhẹ, phù hợp mọi khuôn mặt.',
        image: 'https://picsum.photos/seed/glass1/400/300',
        images: ['https://picsum.photos/seed/glass1/400/300'],
        thumbnail: 0, badge: 'New', rating: 4, inStock: true, stockQty: 30
    },

    {
        id: 6, name: 'Balo Laptop 15"', price: 650000,
        description: 'Balo chống thấm nước, ngăn đựng laptop có đệm bảo vệ.',
        image: 'https://picsum.photos/seed/backpack1/400/300',
        images: ['https://picsum.photos/seed/backpack1/400/300', 'https://picsum.photos/seed/backpack2/400/300'],
        thumbnail: 0, badge: 'Sale', rating: 5, inStock: false, stockQty: 0
    },

    {
        id: 7, name: 'Nón Bucket Trendy', price: 175000,
        description: 'Nón bucket phong cách streetwear, chất liệu vải dù nhẹ.',
        image: 'https://picsum.photos/seed/hat1/400/300',
        images: ['https://picsum.photos/seed/hat1/400/300'],
        thumbnail: 0, badge: 'New', rating: 3, inStock: true, stockQty: 100
    },

    {
        id: 8, name: 'Áo Khoác Denim', price: 780000,
        description: 'Áo khoác denim dày dặn, wash màu vintage, bền đẹp theo năm tháng.',
        image: 'https://picsum.photos/seed/jacket1/400/300',
        images: ['https://picsum.photos/seed/jacket1/400/300', 'https://picsum.photos/seed/jacket2/400/300'],
        thumbnail: 0, badge: 'Hot', rating: 5, inStock: true, stockQty: 15
    },
];

// ===========================
// SPA – HIỂN THỊ MÀN HÌNH
// ===========================

/**
 * showPage(page)
 * Ẩn tất cả section, sau đó hiện section tương ứng.
 * Trang chủ mặc định là user page (không cần đăng nhập).
 */
function showPage(page) {
    const loginPageEl = document.getElementById('login-page');
    const userPageEl = document.getElementById('user-page');
    const adminPageEl = document.getElementById('admin-page');

    if (loginPageEl) {
        loginPageEl.style.display = 'none';
    }

    if (userPageEl) {
        userPageEl.classList.remove('d-none');

        initProducts().then(() => {
            renderUserProducts(getProducts());
            updateCartCount();
            initNavbarScroll();
            initHamburger();
            updateNavbarAuthState();
        });
    }

    if (adminPageEl) {
        adminPageEl.classList.remove('d-none');

        // Trang admin bây giờ render bằng C# MVC trong Views/Admin/Index.cshtml
        // Không gọi renderAdminProducts()
        // Không gọi updateStats()
        // Không gọi API JavaScript
    }
}

// ===========================
// PRODUCT MANAGEMENT - SQL SERVER
// ===========================

const PRODUCT_API_URL = '/api/admin-products';

let productsCache = [];

async function initProducts() {
    await loadProductsFromSql();
}

async function loadProductsFromSql() {
    try {
        const response = await fetch(PRODUCT_API_URL);

        if (!response.ok) {
            throw new Error('Không thể tải sản phẩm từ SQL Server.');
        }

        const products = await response.json();

        productsCache = products.map(normalizeProduct);

        return productsCache;
    } catch (error) {
        console.error(error);
        showToast?.('❌ Không thể tải sản phẩm từ SQL Server.', 'error');
        productsCache = [];
        return [];
    }
}

function normalizeProduct(product) {
    const images = product.images && product.images.length > 0
        ? product.images
        : product.image
            ? [product.image]
            : [];

    const status = product.status || (product.inStock === false ? 'OutOfStock' : 'InStock');

    return {
        id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        description: product.description || '',
        image: product.image || product.imageUrl || images[0] || '',
        images: images,
        thumbnail: product.thumbnail ?? 0,
        badge: product.badge || '',
        status: status,
        inStock: status === 'InStock',
        stockQty: Number(product.stockQty) || 0,
        rating: Number(product.rating) || 5,
        categoryId: product.categoryId || 0
    };
}

function getProducts() {
    return productsCache;
}

function saveProducts(products) {
    productsCache = products;
}

function generateId() {
    const products = getProducts();
    return products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
}

// ===========================
// FORMAT UTILITIES
// ===========================

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency', currency: 'VND', maximumFractionDigits: 0,
    }).format(amount);
}

function renderStars(rating) {
    return Array.from({ length: 5 }, (_, i) =>
        `<span class="star ${i < rating ? 'filled' : ''}">★</span>`
    ).join('');
}

function badgeClass(badge) {
    const map = {
        'Hot': 'badge-hot',
        'Sale': 'badge-sale',
        'New': 'badge-new',
        'Soon': 'badge-soon'
    };

    return map[badge] || 'badge-default';
}

// ===========================
// AUTH & LOGIN MODAL
// ===========================

/** Mở modal đăng nhập */
function showLoginModal() {
    const modal = document.getElementById('login-modal-overlay');
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Reset form và lỗi
    document.getElementById('login-form')?.reset();
    const err = document.getElementById('login-error');
    if (err) { err.textContent = ''; err.classList.remove('show'); }
}

/** Đóng modal đăng nhập */
function hideLoginModal() {
    const modal = document.getElementById('login-modal-overlay');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * handleLogin(event)
 * Xử lý đăng nhập: kiểm tra tài khoản, lưu sessionStorage, đóng modal
 */
function handleLogin(event) {
    if (event) event.preventDefault();

    const username = document.getElementById('username')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const errorEl = document.getElementById('login-error');

    if (!username || !password) {
        showLoginError('Vui lòng nhập đầy đủ thông tin.', errorEl);
        return;
    }

    fetch('/Account/Login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                hideLoginModal();

                if (data.role === 'Admin') {
                    window.location.href = '/Admin';
                } else {
                    window.location.href = '/User';
                }
            } else {
                showLoginError(data.message || 'Đăng nhập thất bại.', errorEl);
            }
        })
        .catch(err => {
            console.error('Login error:', err);
            showLoginError('Lỗi kết nối. Vui lòng thử lại.', errorEl);
        });
}

function showLoginError(msg, el) {
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3500);
}

// Setup tab buttons
const tabBtns = document.querySelectorAll('.login-tab-btn');
tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = btn.getAttribute('data-tab');
        console.log('Tab clicked:', tabName);
        switchLoginTab(tabName);
    });
});

/**
 * handleLogout()
 * Xóa session, quay về user page (không redirect đến login)
 */
function handleLogout() {
    // Xoa trang thai client (ca 2 he thong)
    sessionStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('fullName');
    localStorage.removeItem('role');

    // Xoa session phia server roi ve trang chu
    fetch('/Account/Logout', { method: 'POST' })
        .catch(function () { })
        .finally(function () {
            window.location.href = '/';
        });
}

/** Lấy thông tin user đang đăng nhập */
function getCurrentUser() {
    // 1) Thử hệ thống cũ (sessionStorage)
    try {
        var u = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.user));
        if (u) return u;
    } catch { }

    // 2) Fallback: đăng nhập qua server (checkAuthStatus lưu vào localStorage)
    var sid = localStorage.getItem('userId');
    if (sid) {
        return {
            id: parseInt(sid),
            userId: parseInt(sid),
            username: localStorage.getItem('username') || '',
            fullName: localStorage.getItem('fullName') || '',
            role: localStorage.getItem('role') || 'User'
        };
    }
    return null;
}

/**
 * updateNavbarAuthState()
 * Cập nhật hiển thị nút đăng nhập / đăng xuất + tên user trên navbar
 */
function updateNavbarAuthState() {
    // Uu tien trang thai dang nhap THAT tu server (checkAuthStatus luu vao localStorage)
    const serverUserId = localStorage.getItem('userId');
    const serverName = localStorage.getItem('fullName') || localStorage.getItem('username');
    const user = getCurrentUser();

    const loginWrap = document.getElementById('nav-login-wrap');
    const logoutWrap = document.getElementById('nav-logout-wrap');
    const usernameEl = document.getElementById('nav-username');

    if (serverUserId || user) {
        if (loginWrap) loginWrap.style.display = 'none';
        if (logoutWrap) logoutWrap.style.display = 'flex';
        if (usernameEl) usernameEl.textContent = '👤 ' + (serverName || (user && user.username) || '');
    } else {
        if (loginWrap) loginWrap.style.display = '';
        if (logoutWrap) logoutWrap.style.display = 'none';
    }
}

// ===========================
// CART
// ===========================

function getCart() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.cart)) || []; }
    catch { return []; }
}

function saveCart(cart) {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
}

/**
 * addToCart(productId)
 * Không thêm được nếu hết hàng
 */
function addToCart(productId) {
    const product = getProducts().find(p => p.id === productId);
    if (!product || product.inStock === false) return;

    const cart = getCart();
    const existing = cart.find(c => c.id === productId);

    // Kiểm tra số lượng tồn kho
    const currentQty = existing ? existing.qty : 0;
    const maxQty = product.stockQty ?? 999;
    if (currentQty >= maxQty) {
        showToast(`⚠️ Không thể thêm! Cửa hàng chỉ còn ${maxQty} sản phẩm tồn kho.`, 'error');
        return;
    }

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id: productId, qty: 1 });
    }
    saveCart(cart);
    updateCartCount();
    renderCartDrawer();
    openCartDrawer();
}

/** Cập nhật badge số lượng giỏ hàng trên navbar */
function updateCartCount() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;
    const total = getCart().reduce((sum, c) => sum + c.qty, 0);
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
}

/** Mở Drawer Giỏ hàng */
function openCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer && overlay) {
        renderCartDrawer();
        drawer.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/** Đóng Drawer Giỏ hàng */
function closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer && overlay) {
        drawer.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/** Render danh sách sản phẩm trong Drawer Giỏ hàng */
function renderCartDrawer() {
    const itemsContainer = document.getElementById('cart-drawer-items');
    const totalPriceEl = document.getElementById('cart-total-price');
    if (!itemsContainer || !totalPriceEl) return;

    const cart = getCart();
    const products = getProducts();

    if (cart.length === 0) {
        itemsContainer.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <p>Giỏ hàng của bạn đang trống.</p>
                <button class="btn-shop-now" onclick="closeCartDrawer()">Mua sắm ngay</button>
            </div>
        `;
        totalPriceEl.textContent = '0đ';
        return;
    }

    let totalPrice = 0;
    itemsContainer.innerHTML = cart.map(item => {
        const prod = products.find(p => p.id === item.id);
        if (!prod) return '';

        const itemPrice = prod.price * item.qty;
        totalPrice += itemPrice;
        const thumbnail = getProductThumbnail(prod);

        return `
            <div class="cart-item">
                <img class="cart-item-img" src="${thumbnail}" alt="${prod.name}" onerror="this.src='https://picsum.photos/seed/${prod.id}/100/100'">
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${prod.name}</h4>
                    <span class="cart-item-price">${formatCurrency(prod.price)}</span>
                    <div class="cart-item-qty-wrap">
                        <button class="qty-btn minus" onclick="updateCartDrawerQty(${item.id}, -1)">-</button>
                        <span class="qty-val">${item.qty}</span>
                        <button class="qty-btn plus" onclick="updateCartDrawerQty(${item.id}, 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Xóa sản phẩm">✕</button>
            </div>
        `;
    }).join('');

    totalPriceEl.textContent = formatCurrency(totalPrice);
}

/** Cập nhật số lượng sản phẩm trực tiếp trong Drawer */
function updateCartDrawerQty(productId, delta) {
    const cart = getCart();
    const existing = cart.find(c => c.id === productId);
    if (!existing) return;

    const product = getProducts().find(p => p.id === productId);
    if (!product) return;

    const newQty = existing.qty + delta;
    if (newQty <= 0) {
        removeFromCart(productId);
        return;
    }

    // Kiểm tra số lượng tồn kho
    const maxQty = product.stockQty ?? 999;
    if (delta > 0 && newQty > maxQty) {
        showToast(`⚠️ Cửa hàng chỉ còn ${maxQty} sản phẩm tồn kho cho mặt hàng này.`, 'error');
        return;
    }

    existing.qty = newQty;
    saveCart(cart);
    updateCartCount();
    renderCartDrawer();
}

/** Xóa sản phẩm khỏi giỏ */
function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(c => c.id !== productId);
    saveCart(cart);
    updateCartCount();
    renderCartDrawer();
    showToast('🗑️ Đã xóa sản phẩm khỏi giỏ hàng.', 'error');
}

/** Thanh toán đơn hàng */
function checkoutCart() {
    const cart = getCart();
    if (cart.length === 0) {
        showToast('⚠️ Giỏ hàng trống!', 'error');
        return;
    }

    const products = getProducts();

    // Kiểm tra lại tồn kho một lần nữa trước khi thanh toán
    for (const item of cart) {
        const prod = products.find(p => p.id === item.id);
        if (!prod) continue;
        if (prod.inStock === false || (prod.stockQty !== undefined && prod.stockQty < item.qty)) {
            showToast(`⚠️ Sản phẩm "${prod.name}" không đủ số lượng tồn kho hoặc đã hết hàng.`, 'error');
            return;
        }
    }

    // Trừ tồn kho
    cart.forEach(item => {
        const prod = products.find(p => p.id === item.id);
        if (prod) {
            if (prod.stockQty !== undefined) {
                prod.stockQty = Math.max(0, prod.stockQty - item.qty);
                if (prod.stockQty === 0) {
                    prod.inStock = false;
                }
            }
        }
    });

    saveProducts(products);
    saveCart([]); // Làm trống giỏ
    updateCartCount();
    closeCartDrawer();

    // Render lại giao diện
    const user = getCurrentUser();

    const isAdminPage = document.getElementById('admin-page') !== null;
    const isUserPage = document.getElementById('user-page') !== null;
    const isLoginPage = document.getElementById('login-form') !== null && !isAdminPage && !isUserPage;

    if (isAdminPage) {
        if (!user || user.role !== 'admin') {
            window.location.href = '/';
            return;
        }

        showPage('admin');
    }

    if (isUserPage) {
        if (!user) {
            window.location.href = '/';
            return;
        }

        showPage('user');
    }

    if (isLoginPage) {
        if (user && user.role === 'admin') {
            window.location.href = '/admin';
            return;
        }

        if (user && user.role === 'user') {
            window.location.href = '/user';
            return;
        }
    }

    showToast('🎉 Đặt hàng thành công! Cảm ơn bạn đã mua sắm tại HNTS.', 'success');
}

// ===========================
// PRODUCT REVIEWS & COMMENTS
// ===========================

let reviewingProductId = null;

function getReviews() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.reviews)) || [];
    } catch {
        return [];
    }
}

function saveReviews(reviews) {
    localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews));
}

function getProductReviews(productId) {
    return getReviews().filter(r => r.productId === productId);
}

function getAverageRating(productId) {
    const reviews = getProductReviews(productId);

    if (reviews.length === 0) {
        return null;
    }

    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return total / reviews.length;
}

function openReviewModal(productId) {
    const user = getCurrentUser();

    if (!user) {
        showToast('🔒 Vui lòng đăng nhập để đánh giá sản phẩm.', 'error');
        showLoginModal();
        return;
    }

    reviewingProductId = productId;

    const product = getProducts().find(p => p.id === productId);
    const modal = document.getElementById('review-modal-overlay');

    if (!modal || !product) return;

    document.getElementById('review-product-name').textContent = product.name;
    document.getElementById('review-rating').value = '5';
    document.getElementById('review-comment').value = '';

    renderReviewList(productId);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeReviewModal() {
    const modal = document.getElementById('review-modal-overlay');

    if (modal) {
        modal.classList.remove('active');
    }

    document.body.style.overflow = '';
    reviewingProductId = null;
}

function submitReview() {
    const user = getCurrentUser();

    if (!user) {
        showToast('🔒 Vui lòng đăng nhập để đánh giá.', 'error');
        return;
    }

    if (!reviewingProductId) return;

    const rating = parseInt(document.getElementById('review-rating')?.value) || 5;
    const comment = document.getElementById('review-comment')?.value?.trim();

    if (!comment) {
        showToast('⚠️ Vui lòng nhập nội dung bình luận.', 'error');
        return;
    }

    const reviews = getReviews();

    reviews.push({
        id: Date.now(),
        productId: reviewingProductId,
        username: user.username,
        rating: rating,
        comment: comment,
        createdAt: new Date().toLocaleString('vi-VN')
    });

    saveReviews(reviews);

    renderReviewList(reviewingProductId);
    renderUserProducts(getProducts());

    document.getElementById('review-comment').value = '';
    document.getElementById('review-rating').value = '5';

    showToast('✅ Cảm ơn bạn đã đánh giá sản phẩm!', 'success');
}

function renderReviewList(productId) {
    const wrap = document.getElementById('review-list');
    if (!wrap) return;

    const reviews = getProductReviews(productId);

    if (reviews.length === 0) {
        wrap.innerHTML = `
            <div class="review-empty">
                Chưa có đánh giá nào cho sản phẩm này.
            </div>
        `;
        return;
    }

    wrap.innerHTML = reviews.map(r => `
        <div class="review-item">
            <div class="review-head">
                <strong>👤 ${r.username}</strong>
                <span>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
            </div>
            <div class="review-comment">${r.comment}</div>
            <div class="review-date">${r.createdAt}</div>
        </div>
    `).join('');
}

// ===========================
// THUMBNAIL HELPER
// ===========================

/** Lấy URL ảnh thumbnail của sản phẩm */
function getProductThumbnail(product) {
    if (product.images && product.images.length > 0) {
        const idx = product.thumbnail ?? 0;
        return product.images[Math.min(idx, product.images.length - 1)] || product.images[0];
    }
    return product.image || `https://picsum.photos/seed/${product.id}/400/300`;
}

/** Đổi ảnh chính của card sản phẩm khi click vào ảnh nhỏ phụ */
function changeCardThumbnail(imgEl, newSrc) {
    const card = imgEl.closest('.product-card');
    if (!card) return;
    const mainThumb = card.querySelector('.product-thumbnail');
    if (mainThumb) {
        mainThumb.src = newSrc;
    }
    // Thêm class active cho ảnh nhỏ này và bỏ ở các ảnh khác cùng strip
    const strip = imgEl.closest('.img-hover-strip');
    if (strip) {
        strip.querySelectorAll('img').forEach(img => img.classList.remove('active'));
    }
    imgEl.classList.add('active');
}

// ===========================
// USER PAGE – RENDER PRODUCTS
// ===========================

/**
 * renderUserProducts(products)
 * Hiển thị sản phẩm dạng card grid cho trang User
 * – Dùng thumbnail riêng cho từng sản phẩm
 * – Hiển thị trạng thái hết hàng, disable nút Mua ngay
 */
function renderUserProducts(products) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🛍️</div>
        <p>Chưa có sản phẩm nào.</p>
      </div>`;
        return;
    }

    grid.innerHTML = products.map(product => {
        const thumbnail = getProductThumbnail(product);

        const status = product.status || (product.inStock === false ? 'OutOfStock' : 'InStock');
        const isComingSoon = status === 'ComingSoon';
        const isOutOfStock = status === 'OutOfStock';
        const canBuy = status === 'InStock';

        const allImgs = (product.images && product.images.length > 0)
            ? product.images.slice(0, 5)
            : [thumbnail];

        return `
    <div class="col" role="listitem">
      <article class="product-card h-100${!canBuy ? ' out-of-stock' : ''}" data-id="${product.id}">
        <div class="product-img-wrap">
          <img src="${thumbnail}" alt="${product.name}" loading="lazy"
               onerror="this.src='https://picsum.photos/seed/${product.id}/400/300'" class="product-thumbnail">

          ${product.badge
                ? `<span class="product-badge ${badgeClass(product.badge)}">${product.badge}</span>`
                : ''}

          ${isComingSoon
                ? `<div class="out-of-stock-overlay coming-soon-overlay"><span>SẮP VỀ HÀNG</span></div>`
                : isOutOfStock
                    ? `<div class="out-of-stock-overlay"><span>HẾT HÀNG</span></div>`
                    : ''}

          ${allImgs.length > 1 && canBuy
                ? `<div class="img-hover-strip">${allImgs.map(img => {
                    const isActive = img === thumbnail;
                    return `<img src="${img}" alt="${product.name}" loading="lazy" class="${isActive ? 'active' : ''}"
                          onclick="changeCardThumbnail(this, '${img}')"
                          onerror="this.src='https://picsum.photos/seed/${product.id}/400/300'">`;
                }).join('')}</div>`
                : ''}
        </div>

        <div class="product-body">
          <div class="product-rating">${renderStars(product.rating || 0)}</div>
          <h3 class="product-name">${product.name}</h3>
          <p class="product-desc">${product.description}</p>

          <div class="product-footer">
            <span class="product-price">${formatCurrency(product.price)}</span>

            <button class="btn-buy${!canBuy ? ' btn-buy-disabled' : ''}"
                    data-product-id="${product.id}"
                    ${!canBuy ? 'disabled' : ''}>
              ${isComingSoon ? '⏳ Sắp về hàng' : isOutOfStock ? '🚫 Hết hàng' : 'Mua ngay'}
            </button>
          </div>

          ${canBuy && product.stockQty !== undefined && product.stockQty > 0 && product.stockQty <= 10
                ? `<div class="stock-low">⚠️ Chỉ còn ${product.stockQty} sản phẩm!</div>`
                : ''}
        </div>
     
        <div class="product-review-summary">
            ${(() => {
                const avg = getAverageRating(product.id);
                const count = getProductReviews(product.id).length;

                if (!avg) {
                    return `<span>Chưa có đánh giá</span>`;
                }

                return `<span>⭐ ${avg.toFixed(1)}/5 (${count} đánh giá)</span>`;
            })()}
        </div>

        <button class="btn-review" type="button" onclick="openReviewModal(${product.id})">
            💬 Đánh giá
        </button>

      </article>
    </div>`;
    }).join('');

    grid.querySelectorAll('.btn-buy:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.productId);
            const user = getCurrentUser();

            if (!user) {
                showToast('🔒 Vui lòng đăng nhập để mua hàng!', 'error');
                showLoginModal();
                return;
            }

            addToCart(id);

            const product = getProducts().find(p => p.id === id);
            showToast(`🛒 Đã thêm "${product?.name}" vào giỏ hàng!`, 'success');

            btn.textContent = '✓ Đã thêm';
            btn.style.background = '#22c55e';

            setTimeout(() => {
                btn.textContent = 'Mua ngay';
                btn.style.background = '';
            }, 1500);
        });
    });

    observeCards();
}

/** Scroll reveal cho product cards */
function observeCards() {
    const cards = document.querySelectorAll('#product-grid .col');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    entry.target.style.animationDelay = (i * 0.07) + 's';
                    entry.target.querySelector('.product-card')?.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08 });
        cards.forEach(card => observer.observe(card));
    } else {
        cards.forEach(col => col.querySelector('.product-card')?.classList.add('visible'));
    }
}

// ===========================
// ADMIN PAGE – RENDER PRODUCTS
// ===========================

/**
 * renderAdminProducts(filter)
 * Hiển thị bảng sản phẩm admin – có cột thumbnail, ảnh phụ, tồn kho
 */
function renderAdminProducts(filter) {
    const tbody = document.getElementById('admin-products-body');
    if (!tbody) return;

    let products = getProducts();
    if (filter) {
        const q = filter.toLowerCase();
        products = products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            (p.badge || '').toLowerCase().includes(q)
        );
    }

    if (products.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-icon">📦</div>
            <p>Không có sản phẩm nào${filter ? ' khớp với tìm kiếm' : ''}.</p>
          </div>
        </td>
      </tr>`;
    } else {
        tbody.innerHTML = products.map(product => {
            const thumbnail = getProductThumbnail(product);
            const imgCount = (product.images || [product.image]).filter(Boolean).length;
            const status = product.status || (product.inStock === false ? 'OutOfStock' : 'InStock');
            const isComingSoon = status === 'ComingSoon';
            const isOutOfStock = status === 'OutOfStock';
            return `
      <tr data-id="${product.id}"${isOutOfStock ? ' class="row-out-of-stock"' : ''}>
        <td>
          <div class="table-img-wrap">
            <img class="table-img" src="${thumbnail}" alt="${product.name}"
                 onerror="this.src='https://picsum.photos/seed/${product.id}/100/100'">
            ${imgCount > 1 ? `<span class="img-count-badge">+${imgCount - 1}</span>` : ''}
          </div>
        </td>
        <td class="table-name">${product.name}</td>
        <td class="table-price">${formatCurrency(product.price)}</td>
        <td class="table-desc">${product.description}</td>
        <td><span class="product-badge ${badgeClass(product.badge)}">${product.badge || '—'}</span></td>
        <td>
         ${isComingSoon
                    ? `<span class="stock-badge stock-coming">🟡 Sắp về hàng</span>`
                    : isOutOfStock
                        ? `<span class="stock-badge stock-out">🔴 Hết hàng</span>`
                        : `<span class="stock-badge stock-in">🟢 Còn hàng</span>
           ${product.stockQty !== undefined
                            ? `<small class="stock-qty">(${product.stockQty} cái)</small>`
                            : ''}`
                }
        </td>
        <td>
          <button class="btn-edit" onclick="editProduct(${product.id})">✏️ Sửa</button>
          <button class="btn-delete" onclick="deleteProduct(${product.id})">🗑 Xóa</button>
        </td>
      </tr>`;
        }).join('');
    }
    updateStats();
}

// ===========================
// ADMIN – STATS
// ===========================

/** Cập nhật 4 ô thống kê */
function updateStats() {
    const products = getProducts();
    const totalEl = document.getElementById('stat-total');
    const maxPriceEl = document.getElementById('stat-max-price');
    const totalValEl = document.getElementById('stat-total-value');
    const outStockEl = document.getElementById('stat-out-of-stock');

    if (totalEl) totalEl.textContent = products.length;
    if (maxPriceEl) maxPriceEl.textContent = products.length
        ? formatCurrency(Math.max(...products.map(p => p.price))) : '—';
    if (totalValEl) totalValEl.textContent = products.length
        ? formatCurrency(products.reduce((s, p) => s + p.price, 0)) : '—';
    if (outStockEl) outStockEl.textContent = products.filter(p => p.inStock === false).length;
}

// ===========================
// ADMIN – CRUD
// ===========================

let editingId = null;
let adminImages = []; // Mảng ảnh hiện tại của sản phẩm đang thêm/sửa

/** Thêm sản phẩm mới */
async function addProduct() {
    const data = getFormData();
    if (!data) return;

    try {
        const response = await fetch(PRODUCT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...data,
                rating: 5,
                categoryId: data.categoryId || 0
            })
        });

        if (!response.ok) {
            throw new Error('Không thể thêm sản phẩm vào SQL Server.');
        }

        await loadProductsFromSql();

        resetForm();
        renderAdminProducts(getSearchValue());
        renderUserProducts(getProducts());
        showToast('✅ Đã thêm sản phẩm vào SQL Server!', 'success');
    } catch (error) {
        console.error(error);
        showToast('❌ Lỗi khi thêm sản phẩm vào SQL Server.', 'error');
    }
}

/**
 * editProduct(id)
 * Điền thông tin sản phẩm vào form, chuyển sang chế độ chỉnh sửa
 */
function editProduct(id) {
    const product = getProducts().find(p => p.id === id);
    if (!product) return;

    editingId = id;
    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-price').value = product.price;
    document.getElementById('prod-desc').value = product.description;
    document.getElementById('prod-badge').value = product.badge || '';

    // Stock fields
    const statusEl = document.getElementById('prod-status');
    const stockQtyEl = document.getElementById('prod-stock-qty');

    if (statusEl) {
        statusEl.value = product.status || (product.inStock === false ? 'OutOfStock' : 'InStock');
    }

    if (stockQtyEl) {
        stockQtyEl.value = product.stockQty ?? '';
    }

    toggleStockQty();

    // Multi-image
    adminImages = (product.images && product.images.length > 0)
        ? [...product.images]
        : (product.image ? [product.image] : []);
    renderAdminImagePreview(product.thumbnail ?? 0);

    document.getElementById('btn-add')?.classList.add('hidden');
    document.getElementById('btn-update')?.classList.remove('hidden');
    document.getElementById('btn-cancel')?.classList.remove('hidden');

    document.getElementById('product-form-section')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('prod-name')?.focus();

    const formTitle = document.getElementById('form-title');
    if (formTitle) formTitle.textContent = 'Chỉnh sửa sản phẩm';
}

/** Cập nhật sản phẩm đang sửa */
async function updateProduct() {
    if (!editingId) return;

    const data = getFormData();
    if (!data) return;

    try {
        const oldProduct = getProducts().find(p => p.id === editingId);

        const response = await fetch(`${PRODUCT_API_URL}/${editingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...oldProduct,
                ...data,
                id: editingId,
                categoryId: oldProduct?.categoryId || data.categoryId || 0
            })
        });

        if (!response.ok) {
            throw new Error('Không thể cập nhật sản phẩm trong SQL Server.');
        }

        await loadProductsFromSql();

        resetForm();
        renderAdminProducts(getSearchValue());
        renderUserProducts(getProducts());
        showToast('✅ Đã cập nhật sản phẩm trong SQL Server!', 'success');
    } catch (error) {
        console.error(error);
        showToast('❌ Lỗi khi cập nhật sản phẩm trong SQL Server.', 'error');
    }
}

/** Xóa sản phẩm sau khi xác nhận */
function deleteProduct(id) {
    const product = getProducts().find(p => p.id === id);
    if (!product) return;
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${product.name}"?`)) return;

    const products = getProducts().filter(p => p.id !== id);
    saveProducts(products);
    renderAdminProducts(getSearchValue());
    showToast('🗑️ Đã xóa sản phẩm.', 'error');
}

/** Hủy chỉnh sửa */
function cancelEdit() { resetForm(); }

/** Lấy dữ liệu từ form (bao gồm multi-image và stock) */
function getFormData() {
    const name = document.getElementById('prod-name')?.value?.trim();
    const price = parseFloat(document.getElementById('prod-price')?.value);
    const desc = document.getElementById('prod-desc')?.value?.trim();
    const badge = document.getElementById('prod-badge')?.value;
    const status = document.getElementById('prod-status')?.value || 'InStock';
    const stockQty = parseInt(document.getElementById('prod-stock-qty')?.value) || 0;

    const thumbEl = document.querySelector('.admin-img-item.is-thumbnail');
    const thumbIdx = parseInt(thumbEl?.dataset?.index ?? '0') || 0;

    if (!name) {
        showToast('⚠️ Vui lòng nhập tên sản phẩm.', 'error');
        return null;
    }

    if (!price || isNaN(price) || price <= 0) {
        showToast('⚠️ Giá bán không hợp lệ.', 'error');
        return null;
    }

    if (!desc) {
        showToast('⚠️ Vui lòng nhập mô tả sản phẩm.', 'error');
        return null;
    }

    if (status === 'InStock' && stockQty <= 0) {
        showToast('⚠️ Sản phẩm còn hàng thì số lượng tồn kho phải lớn hơn 0.', 'error');
        return null;
    }

    const images = adminImages.length > 0
        ? adminImages
        : [`https://picsum.photos/seed/${Date.now()}/400/300`];

    const safeThumbIdx = Math.min(thumbIdx, images.length - 1);

    return {
        name,
        price,
        description: desc,
        image: images[safeThumbIdx] || images[0],
        images,
        thumbnail: safeThumbIdx,
        badge: status === 'ComingSoon' ? 'Soon' : badge,
        status: status,
        inStock: status === 'InStock',
        stockQty: status === 'InStock' ? stockQty : 0,
    };
}

/**
 * resetForm()
 * Reset về trạng thái Thêm mới
 */
function resetForm() {
    editingId = null;
    adminImages = [];

    ['prod-name', 'prod-price', 'prod-desc', 'prod-img-file'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const badgeEl = document.getElementById('prod-badge');
    if (badgeEl) badgeEl.value = 'Hot';

    const inStockEl = document.getElementById('prod-in-stock');
    if (inStockEl) inStockEl.checked = true;

    const stockQtyEl = document.getElementById('prod-stock-qty');
    if (stockQtyEl) stockQtyEl.value = '';
    toggleStockQty();

    // Clear image previews
    const previewWrap = document.getElementById('admin-img-preview-wrap');
    if (previewWrap) previewWrap.innerHTML = '';

    document.getElementById('btn-add')?.classList.remove('hidden');
    document.getElementById('btn-update')?.classList.add('hidden');
    document.getElementById('btn-cancel')?.classList.add('hidden');

    const formTitle = document.getElementById('form-title');
    if (formTitle) formTitle.textContent = 'Thêm sản phẩm mới';
}

/** Toggle hiển thị input số lượng tồn kho theo trạng thái checkbox */
function toggleStockQty() {
    const statusEl = document.getElementById('prod-status');
    const qtyWrap = document.getElementById('stock-qty-wrap');

    const status = statusEl?.value || 'InStock';

    if (qtyWrap) {
        qtyWrap.style.display = status === 'InStock' ? '' : 'none';
    }
}

/** Render preview ảnh trong admin form */
function renderAdminImagePreview(thumbnailIdx = 0) {
    const wrap = document.getElementById('admin-img-preview-wrap');
    if (!wrap) return;
    if (adminImages.length === 0) { wrap.innerHTML = ''; return; }

    wrap.innerHTML = adminImages.map((img, i) => `
        <div class="admin-img-item${i === thumbnailIdx ? ' is-thumbnail' : ''}" data-index="${i}">
            <img src="${img}" alt="Ảnh ${i + 1}" loading="lazy">
            ${i === thumbnailIdx ? '<span class="thumb-label">★ Thumbnail</span>' : ''}
            <div class="admin-img-actions">
                <button type="button" class="img-set-thumb-btn"
                        onclick="setAdminThumbnail(${i})"
                        title="${i === thumbnailIdx ? 'Đang là thumbnail' : 'Đặt làm thumbnail'}">
                    ${i === thumbnailIdx ? '★' : '☆'}
                </button>
                <button type="button" class="img-remove-btn"
                        onclick="removeAdminImage(${i})" title="Xóa ảnh">✕</button>
            </div>
        </div>`
    ).join('');
}

/** Xóa ảnh khỏi danh sách */
function removeAdminImage(idx) {
    const currentThumb = parseInt(
        document.querySelector('.admin-img-item.is-thumbnail')?.dataset?.index ?? '0'
    ) || 0;
    adminImages.splice(idx, 1);
    const newThumb = Math.min(currentThumb, Math.max(0, adminImages.length - 1));
    renderAdminImagePreview(newThumb);
}

/** Đặt thumbnail cho sản phẩm */
function setAdminThumbnail(idx) {
    renderAdminImagePreview(idx);
}

function getSearchValue() {
    return document.getElementById('search-products')?.value?.trim() || '';
}

// ===========================
// TOAST NOTIFICATION
// ===========================

function showToast(message, type = 'success') {
    let toast = document.getElementById('toast-custom');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-custom';
        toast.className = 'toast-custom';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast-custom ${type}`;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===========================
// NAVBAR SCROLL EFFECT
// ===========================

function initNavbarScroll() {
    const navbar = document.querySelector('#user-page .navbar');
    if (!navbar) return;
    const wrap = document.getElementById('user-scroll-wrap');
    if (!wrap) return;
    const onScroll = () => navbar.classList.toggle('scrolled', wrap.scrollTop > 20);
    wrap.removeEventListener('scroll', wrap._scrollHandler);
    wrap._scrollHandler = onScroll;
    wrap.addEventListener('scroll', onScroll, { passive: true });
}

// ===========================
// HAMBURGER MENU
// ===========================

function initHamburger() {
    const btn = document.getElementById('hamburger');
    const links = document.getElementById('nav-links');
    if (!btn || !links) return;
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => {
        links.classList.toggle('open');
        newBtn.setAttribute('aria-expanded', links.classList.contains('open'));
    });
    links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => links.classList.remove('open'));
    });
}

// ===========================
// HELPER: scroll top user page
// ===========================
function scrollUserTop() {
    document.getElementById('user-scroll-wrap')?.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===========================
// PAGE INIT (DOMContentLoaded)
// ===========================

document.addEventListener('DOMContentLoaded', () => {

    // Login modal – form submit
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);

    // Đóng modal khi click backdrop
    document.getElementById('login-modal-overlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) hideLoginModal();
    });

    // Nút X đóng modal
    document.getElementById('login-modal-close')?.addEventListener('click', hideLoginModal);

    // Nút Đăng nhập trên navbar user
    document.getElementById('nav-login-btn')?.addEventListener('click', showLoginModal);

    // Đăng xuất
    document.getElementById('user-logout-btn')?.addEventListener('click', handleLogout);
    document.getElementById('admin-logout-btn')?.addEventListener('click', handleLogout);
    document.getElementById('sidebar-logout')?.addEventListener('click', handleLogout);

    // Hero CTA scroll
    document.getElementById('hero-cta')?.addEventListener('click', () => {
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Nav products link
    document.getElementById('nav-products')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Cart drawer events
    const cartBtn = document.querySelector('.nav-cart-btn');

    if (cartBtn) {
        cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openCartDrawer();
        });
    }

    document.getElementById('cart-drawer-close')?.addEventListener('click', closeCartDrawer);
    document.getElementById('cart-drawer-overlay')?.addEventListener('click', closeCartDrawer);
    document.getElementById('btn-checkout')?.addEventListener('click', checkoutCart);

    // Khởi tạo trang
    const isAdminPage = document.getElementById('admin-page') !== null;
    const isUserPage = document.getElementById('user-page') !== null;

    if (isAdminPage) {
        showPage('admin');
        return;
    }

    if (isUserPage) {
        showPage('user');
        return;
    }

});
/* ============================================================
   ĐỔI MẬT KHẨU + WISHLIST (bổ sung)
   ============================================================ */
(function () {
    document.addEventListener('DOMContentLoaded', function () {

        // ----- Modal đổi mật khẩu -----
        var openBtn = document.getElementById('open-change-pw');
        var overlay = document.getElementById('change-pw-overlay');
        var closeBtn = document.getElementById('close-change-pw');
        var submitBtn = document.getElementById('submit-change-pw');
        var msg = document.getElementById('change-pw-msg');

        function showMsg(text, ok) {
            if (!msg) return;
            msg.style.display = 'block';
            msg.textContent = text;
            msg.style.color = ok ? '#0f766e' : '#dc2626';
            msg.style.background = ok ? '#ecfdf5' : '#fef2f2';
        }

        if (openBtn && overlay) {
            openBtn.addEventListener('click', function () {
                overlay.style.display = 'flex';
                if (msg) msg.style.display = 'none';
            });
        }
        if (closeBtn && overlay) {
            closeBtn.addEventListener('click', function () { overlay.style.display = 'none'; });
        }
        if (overlay) {
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) overlay.style.display = 'none';
            });
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', function () {
                var oldPw = document.getElementById('cp-old').value;
                var newPw = document.getElementById('cp-new').value;
                var confirmPw = document.getElementById('cp-confirm').value;

                if (!oldPw || !newPw) { showMsg('Vui lòng nhập đầy đủ thông tin.', false); return; }
                if (newPw.length < 6) { showMsg('Mật khẩu mới phải từ 6 ký tự.', false); return; }
                if (newPw !== confirmPw) { showMsg('Xác nhận mật khẩu không khớp.', false); return; }

                fetch('/Account/ChangePassword', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'oldPassword=' + encodeURIComponent(oldPw) +
                        '&newPassword=' + encodeURIComponent(newPw) +
                        '&confirmPassword=' + encodeURIComponent(confirmPw)
                })
                    .then(function (r) { return r.json(); })
                    .then(function (data) {
                        showMsg(data.message, data.success);
                        if (data.success) {
                            document.getElementById('cp-old').value = '';
                            document.getElementById('cp-new').value = '';
                            document.getElementById('cp-confirm').value = '';
                            setTimeout(function () { if (overlay) overlay.style.display = 'none'; }, 1200);
                        }
                    })
                    .catch(function () { showMsg('Lỗi kết nối, vui lòng thử lại.', false); });
            });
        }

        // ----- Badge wishlist -----
        refreshWishlistCount();
    });
})();

// Cập nhật số lượng yêu thích trên header (badge)
function refreshWishlistCount() {
    var badge = document.getElementById('wishlist-count');
    if (!badge) return;
    fetch('/Wishlist/Count')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            var n = data.count || 0;
            if (n > 0) {
                badge.textContent = n;
                badge.style.display = 'grid';
            } else {
                badge.style.display = 'none';
            }
        })
        .catch(function () { });
}

// Thêm/bỏ yêu thích (gọi từ nút trái tim ở sản phẩm nếu có)
function toggleWishlist(productId, btn) {
    fetch('/Wishlist/Toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'productId=' + productId
    })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (data.requireLogin) {
                alert('Vui lòng đăng nhập để dùng yêu thích.');
                return;
            }
            if (data.success && btn) {
                btn.classList.toggle('active', data.added);
                btn.textContent = data.added ? '❤️' : '♡';
            }
            refreshWishlistCount();
        })
        .catch(function () { alert('Lỗi kết nối.'); });
}