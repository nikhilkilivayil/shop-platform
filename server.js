const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { db, initDatabase, hashPassword } = require("./db");

initDatabase();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_DIR = path.join(__dirname, "public");

// Session store for active tokens
const sessions = new Map();

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function normalizePhone(phone) {
  if (!phone) return "";
  let p = phone.replace(/[^0-9+]/g, "");
  if (p.length === 10) return "+91 " + p;
  if (p.startsWith("+91") && p.length === 13) {
    return "+91 " + p.slice(3);
  }
  return p;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 2e7) {
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  });
  res.end(JSON.stringify(data));
}

function getAuthUser(req) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const sessionUser = sessions.get(token);
  if (!sessionUser) return null;

  // Refresh user state from database to catch immediate blocks/status updates
  const fresh = db.prepare("SELECT id, role, name, email, phone, is_blocked, device_id, address, city, pincode FROM users WHERE id = ?").get(sessionUser.id);
  if (!fresh) {
    sessions.delete(token);
    return null;
  }
  return fresh;
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".webm": "audio/webm",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".aac": "audio/aac",
  ".mp4": "video/mp4"
};

const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
const UPLOADS_AUDIO_DIR = path.join(UPLOADS_DIR, "audio");
if (!fs.existsSync(UPLOADS_AUDIO_DIR)) {
  fs.mkdirSync(UPLOADS_AUDIO_DIR, { recursive: true });
}

function serveStatic(req, res, pathname) {
  let cleanPath = pathname === "/" ? "/index.html" : pathname;
  if (cleanPath === "/support" || cleanPath === "/support/") {
    cleanPath = "/support.html";
  }
  if (cleanPath === "/call" || cleanPath === "/call/") {
    cleanPath = "/call.html";
  }
  let filePath = path.join(PUBLIC_DIR, cleanPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      if (!path.extname(pathname)) {
        filePath = path.join(PUBLIC_DIR, "index.html");
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("File Not Found");
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

async function handleRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  const pathname = parsedUrl.pathname;

  try {
    if (pathname === "/health" || pathname === "/api/health") {
      return sendJson(res, 200, { status: "ok", serverTime: new Date().toISOString() });
    }

    if (pathname.startsWith("/api/")) {

      // Settings
      if (pathname === "/api/settings" && req.method === "GET") {
        const rows = db.prepare("SELECT key, value FROM settings").all();
        const settings = {};
        rows.forEach(r => { settings[r.key] = r.value; });
        return sendJson(res, 200, settings);
      }

      if (pathname === "/api/admin/settings" && req.method === "POST") {
        const user = getAuthUser(req);
        if (!user || user.role !== "admin") {
          return sendJson(res, 403, { error: "Admin access required" });
        }
        const body = await parseJsonBody(req);
        const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
        for (const [k, v] of Object.entries(body)) {
          stmt.run(k, String(v));
        }
        return sendJson(res, 200, { success: true, message: "Settings updated successfully" });
      }

      // Customer Mobile OTP Authentication
      if (pathname === "/api/auth/send-otp" && req.method === "POST") {
        const { phone, device_id } = await parseJsonBody(req);
        const normalized = normalizePhone(phone);
        if (!normalized || normalized.length < 10) {
          return sendJson(res, 400, { error: "Valid 10-digit mobile number is required" });
        }

        // Check if user is blocked
        let user = db.prepare("SELECT * FROM users WHERE phone = ?").get(normalized);
        if (user && user.is_blocked === 1) {
          return sendJson(res, 403, { error: "ഈ അക്കൗണ്ട് അഡ്മിൻ താല്കാലികമായി ബ്ലോക്ക് ചെയ്തിരിക്കുകയാണ്. ഷോപ്പുമായി ബന്ധപ്പെടുക." });
        }

        // Generate 4-digit OTP
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

        if (!user) {
          const fakeEmail = normalized.replace(/[^0-9]/g, "") + "@customer.local";
          const info = db.prepare(`
            INSERT INTO users (role, name, email, password_hash, phone, device_id, is_blocked, otp_code, otp_expires_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
          `).run("customer", "Customer", fakeEmail, "OTP_LOGIN", normalized, device_id || "", otpCode, expiresAt);
          user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
        } else {
          db.prepare(`
            UPDATE users SET otp_code = ?, otp_expires_at = ?, device_id = COALESCE(?, device_id)
            WHERE id = ?
          `).run(otpCode, expiresAt, device_id || "", user.id);
        }

        const hasSavedName = !!(user && user.name && user.name !== "Customer" && user.name.trim());
        return sendJson(res, 200, {
          success: true,
          message: "OTP sent successfully to " + normalized,
          phone: normalized,
          otp: otpCode,
          expires_in: 300,
          has_name: hasSavedName,
          user_name: hasSavedName ? user.name : ""
        });
      }

      if (pathname === "/api/auth/verify-otp" && req.method === "POST") {
        const { phone, otp, device_id, name } = await parseJsonBody(req);
        const normalized = normalizePhone(phone);
        if (!normalized || !otp) {
          return sendJson(res, 400, { error: "Phone number and OTP code are required" });
        }

        const user = db.prepare("SELECT * FROM users WHERE phone = ?").get(normalized);
        if (!user) {
          return sendJson(res, 404, { error: "User not found. Please request a new OTP." });
        }
        if (user.is_blocked === 1) {
          return sendJson(res, 403, { error: "നിങ്ങളുടെ അക്കൗണ്ട് ബ്ലോക്ക് ചെയ്തിരിക്കുന്നു." });
        }

        if (user.otp_code !== String(otp).trim()) {
          return sendJson(res, 400, { error: "തെറ്റായ ഒടിപി (Invalid OTP code). വീണ്ടും ശ്രമിക്കുക." });
        }
        if (Date.now() > user.otp_expires_at) {
          return sendJson(res, 400, { error: "ഒടിപിയുടെ കാലാവധി കഴിഞ്ഞു (OTP expired). പുതിയ ഒടിപി എടുക്കുക." });
        }

        // Clear OTP and update user details
        let newName = user.name;
        if (name && name.trim()) {
          newName = name.trim();
        }
        db.prepare(`
          UPDATE users SET otp_code = NULL, otp_expires_at = NULL, name = ?, device_id = COALESCE(?, device_id)
          WHERE id = ?
        `).run(newName, device_id || "", user.id);

        const updatedUser = db.prepare("SELECT id, role, name, email, phone, device_id, is_blocked, address, city, pincode FROM users WHERE id = ?").get(user.id);
        const token = generateToken();
        sessions.set(token, updatedUser);

        return sendJson(res, 200, {
          success: true,
          token,
          user: updatedUser,
          message: "OTP verified successfully"
        });
      }

      // Customer Profile Endpoints
      if (pathname === "/api/user/profile" && req.method === "GET") {
        const user = getAuthUser(req);
        if (!user) return sendJson(res, 401, { error: "Not authenticated" });
        return sendJson(res, 200, { user, ...user });
      }

      if (pathname === "/api/user/profile" && req.method === "PUT") {
        const user = getAuthUser(req);
        if (!user) return sendJson(res, 401, { error: "Not authenticated" });
        const body = await parseJsonBody(req);
        const { name, address, city, pincode, device_id } = body;

        db.prepare(`
          UPDATE users
          SET name = COALESCE(?, name),
              address = COALESCE(?, address),
              city = COALESCE(?, city),
              pincode = COALESCE(?, pincode),
              device_id = COALESCE(?, device_id)
          WHERE id = ?
        `).run(
          name ? name.trim() : null,
          address ? address.trim() : null,
          city ? city.trim() : null,
          pincode ? pincode.trim() : null,
          device_id || null,
          user.id
        );

        const freshUser = db.prepare("SELECT id, role, name, email, phone, device_id, is_blocked, address, city, pincode FROM users WHERE id = ?").get(user.id);
        return sendJson(res, 200, { success: true, user: freshUser, ...freshUser });
      }

      // Customer Orders History
      if (pathname === "/api/user/orders" && req.method === "GET") {
        const user = getAuthUser(req);
        if (!user) return sendJson(res, 401, { error: "Not authenticated" });

        const cleanPhone = (user.phone || "").replace(/[^0-9]/g, "").slice(-10);
        const orders = db.prepare(`
          SELECT * FROM orders
          WHERE user_id = ? 
             OR (LENGTH(?) = 10 AND REPLACE(customer_phone, ' ', '') LIKE '%' || ?)
          ORDER BY created_at DESC
        `).all(user.id, cleanPhone, cleanPhone);

        for (const ord of orders) {
          ord.items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(ord.id);
          for (const item of ord.items) {
            item.price = item.unit_price != null ? item.unit_price : item.price;
            item.total = item.total_price != null ? item.total_price : item.total;
          }
          ord.order_number = ord.id;
          ord.total = ord.total_amount;
          ord.delivery_address = ord.shipping_address;
        }

        return sendJson(res, 200, orders);
      }

      // Admin Login
      if (pathname === "/api/auth/login" && req.method === "POST") {
        const { email, password } = await parseJsonBody(req);
        if (!email || !password) {
          return sendJson(res, 400, { error: "Email and password are required" });
        }
        const hash = hashPassword(password);
        const user = db.prepare("SELECT id, role, name, email, phone FROM users WHERE email = ? AND password_hash = ?").get(email, hash);
        if (!user) {
          return sendJson(res, 401, { error: "Invalid email or password" });
        }
        const token = generateToken();
        sessions.set(token, user);
        return sendJson(res, 200, { token, user });
      }

      if (pathname === "/api/auth/me" && req.method === "GET") {
        const user = getAuthUser(req);
        if (!user) return sendJson(res, 401, { error: "Not authenticated" });
        return sendJson(res, 200, { user });
      }

      if (pathname === "/api/auth/logout" && req.method === "POST") {
        const authHeader = req.headers["authorization"];
        if (authHeader && authHeader.startsWith("Bearer ")) {
          sessions.delete(authHeader.slice(7));
        }
        return sendJson(res, 200, { success: true });
      }

      // Admin Users Management
      if (pathname === "/api/admin/users" && req.method === "GET") {
        const user = getAuthUser(req);
        if (!user || user.role !== "admin") {
          return sendJson(res, 403, { error: "Admin access required" });
        }

        const usersList = db.prepare(`
          SELECT 
            u.id, u.name, u.phone, u.email, u.device_id, u.is_blocked, u.address, u.city, u.pincode, u.created_at,
            COUNT(o.id) as total_orders,
            COALESCE(SUM(o.total_amount), 0) as total_spent
          FROM users u
          LEFT JOIN orders o ON o.user_id = u.id OR o.customer_phone = u.phone
          WHERE u.role = 'customer'
          GROUP BY u.id
          ORDER BY u.id DESC
        `).all();

        return sendJson(res, 200, usersList);
      }

      // Admin Block / Unblock User
      const blockMatch = pathname.match(/^\/api\/admin\/users\/(\d+)\/block$/);
      if (blockMatch && req.method === "PATCH") {
        const user = getAuthUser(req);
        if (!user || user.role !== "admin") {
          return sendJson(res, 403, { error: "Admin access required" });
        }
        const targetUserId = Number(blockMatch[1]);
        const body = await parseJsonBody(req);
        const isBlocked = body.is_blocked ? 1 : 0;

        db.prepare("UPDATE users SET is_blocked = ? WHERE id = ?").run(isBlocked, targetUserId);

        // If blocked, remove active sessions for this user
        if (isBlocked === 1) {
          for (const [t, sUser] of sessions.entries()) {
            if (sUser.id === targetUserId) {
              sessions.delete(t);
            }
          }
        }

        return sendJson(res, 200, {
          success: true,
          user_id: targetUserId,
          is_blocked: isBlocked,
          message: isBlocked ? "User has been blocked" : "User has been unblocked"
        });
      }

      // Categories
      if (pathname === "/api/categories" && req.method === "GET") {
        const categories = db.prepare(`
          SELECT c.*, COUNT(p.id) as product_count
          FROM categories c
          LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
          GROUP BY c.id
          ORDER BY c.id ASC
        `).all();
        return sendJson(res, 200, categories);
      }

      // Products (Public)
      if (pathname === "/api/products" && req.method === "GET") {
        const categorySlug = parsedUrl.searchParams.get("category");
        const search = parsedUrl.searchParams.get("search");
        const inStockOnly = parsedUrl.searchParams.get("in_stock") === "true";
        const sort = parsedUrl.searchParams.get("sort") || "newest";

        let query = `
          SELECT p.*, c.name as category_name, c.name_ml as category_name_ml, c.slug as category_slug
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.is_active = 1
        `;
        const params = [];

        if (categorySlug && categorySlug !== "all") {
          query += " AND c.slug = ?";
          params.push(categorySlug);
        }

        if (search) {
          query += " AND (p.name LIKE ? OR p.name_ml LIKE ? OR p.description LIKE ?)";
          const term = "%" + search + "%";
          params.push(term, term, term);
        }

        if (inStockOnly) {
          query += " AND p.stock > 0";
        }

        if (sort === "price_asc") {
          query += " ORDER BY p.price ASC";
        } else if (sort === "price_desc") {
          query += " ORDER BY p.price DESC";
        } else if (sort === "name") {
          query += " ORDER BY p.name ASC";
        } else {
          query += " ORDER BY p.id DESC";
        }

        const products = db.prepare(query).all(...params);
        return sendJson(res, 200, products);
      }

      // Single Product
      const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);
      if (productMatch && req.method === "GET") {
        const prodId = productMatch[1];
        const product = db.prepare(`
          SELECT p.*, c.name as category_name, c.name_ml as category_name_ml
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = ?
        `).get(prodId);
        if (!product) return sendJson(res, 404, { error: "Product not found" });
        return sendJson(res, 200, product);
      }

      // Admin Products CRUD
      if (pathname === "/api/admin/products" && req.method === "POST") {
        const user = getAuthUser(req);
        if (!user || user.role !== "admin") {
          return sendJson(res, 403, { error: "Admin access required" });
        }
        const body = await parseJsonBody(req);
        const { category_id, name, name_ml, description, price, mrp, unit, stock, image_url } = body;
        if (!name || price == null) {
          return sendJson(res, 400, { error: "Product name and price are required" });
        }

        const insert = db.prepare(`
          INSERT INTO products (category_id, name, name_ml, description, price, mrp, unit, stock, image_url, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `);
        const info = insert.run(
          category_id ? Number(category_id) : null,
          name.trim(),
          (name_ml || "").trim(),
          (description || "").trim(),
          Number(price),
          mrp ? Number(mrp) : Number(price),
          unit || "item",
          Number(stock || 0),
          image_url || ""
        );
        const newProduct = db.prepare("SELECT * FROM products WHERE id = ?").get(info.lastInsertRowid);
        return sendJson(res, 201, newProduct);
      }

      const adminProductMatch = pathname.match(/^\/api\/admin\/products\/(\d+)$/);
      if (adminProductMatch) {
        const user = getAuthUser(req);
        if (!user || user.role !== "admin") {
          return sendJson(res, 403, { error: "Admin access required" });
        }
        const prodId = Number(adminProductMatch[1]);

        if (req.method === "PUT") {
          const body = await parseJsonBody(req);
          const { category_id, name, name_ml, description, price, mrp, unit, stock, image_url, is_active } = body;
          
          db.prepare(`
            UPDATE products
            SET category_id = ?, name = ?, name_ml = ?, description = ?, price = ?, mrp = ?, unit = ?, stock = ?, image_url = ?, is_active = ?
            WHERE id = ?
          `).run(
            category_id ? Number(category_id) : null,
            name,
            name_ml || "",
            description || "",
            Number(price),
            mrp ? Number(mrp) : Number(price),
            unit || "item",
            Number(stock || 0),
            image_url || "",
            is_active != null ? Number(is_active) : 1,
            prodId
          );
          const updated = db.prepare("SELECT * FROM products WHERE id = ?").get(prodId);
          return sendJson(res, 200, updated);
        }

        if (req.method === "DELETE") {
          db.prepare("UPDATE products SET is_active = 0 WHERE id = ?").run(prodId);
          return sendJson(res, 200, { success: true, message: "Product deactivated" });
        }
      }

      const stockMatch = pathname.match(/^\/api\/admin\/products\/(\d+)\/stock$/);
      if (stockMatch && req.method === "PATCH") {
        const user = getAuthUser(req);
        if (!user || user.role !== "admin") {
          return sendJson(res, 403, { error: "Admin access required" });
        }
        const prodId = Number(stockMatch[1]);
        const body = await parseJsonBody(req);
        const newStock = Number(body.stock);
        if (isNaN(newStock) || newStock < 0) {
          return sendJson(res, 400, { error: "Valid stock quantity required" });
        }
        db.prepare("UPDATE products SET stock = ? WHERE id = ?").run(newStock, prodId);
        return sendJson(res, 200, { success: true, stock: newStock });
      }

      // Orders: Place Order
      if (pathname === "/api/orders" && req.method === "POST") {
        const authUser = getAuthUser(req);

        // If customer is authenticated and blocked, prevent order
        if (authUser && authUser.is_blocked === 1) {
          return sendJson(res, 403, { error: "നിങ്ങളുടെ അക്കൗണ്ട് ബ്ലോക്ക് ചെയ്തിരിക്കുന്നതിനാൽ ഓർഡർ സമർപ്പിക്കാൻ സാധിക്കില്ല. ഷോപ്പുമായി ബന്ധപ്പെടുക." });
        }

        const body = await parseJsonBody(req);
        const customer_name = body.customer_name;
        const customer_phone = body.customer_phone;
        const customer_email = body.customer_email;
        const shipping_address = body.shipping_address || body.delivery_address || body.address;
        const city = body.city;
        const pincode = body.pincode;
        const items = body.items;
        const payment_method = body.payment_method;
        const notes = body.notes;

        const normalizedPhone = normalizePhone(customer_phone);

        // Check if phone belongs to a blocked user
        if (normalizedPhone) {
          const userCheck = db.prepare("SELECT is_blocked FROM users WHERE phone = ?").get(normalizedPhone);
          if (userCheck && userCheck.is_blocked === 1) {
            return sendJson(res, 403, { error: "ഈ മൊബൈൽ നമ്പർ ബ്ലോക്ക് ചെയ്തിരിക്കുന്നതിനാൽ ഓർഡർ സ്വീകരിക്കാൻ സാധിക്കില്ല." });
          }
        }

        if (!customer_name || !normalizedPhone || !shipping_address) {
          return sendJson(res, 400, { error: "Customer name, phone number, and address are required" });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
          return sendJson(res, 400, { error: "Cart is empty" });
        }

        let subtotal = 0;
        const verifiedItems = [];

        for (const item of items) {
          const prod = db.prepare("SELECT id, name, price, stock, is_active FROM products WHERE id = ?").get(item.product_id);
          if (!prod || !prod.is_active) {
            return sendJson(res, 400, { error: "Item " + (item.product_name || item.product_id) + " is not available." });
          }
          if (prod.stock < item.quantity) {
            return sendJson(res, 400, { error: "Only " + prod.stock + " left for " + prod.name });
          }
          const itemTotal = prod.price * item.quantity;
          subtotal += itemTotal;
          verifiedItems.push({
            product_id: prod.id,
            product_name: prod.name,
            unit_price: prod.price,
            quantity: item.quantity,
            total_price: itemTotal
          });
        }

        const freeDelRow = db.prepare("SELECT value FROM settings WHERE key = ?").get("free_delivery_threshold");
        const minFreeDelivery = freeDelRow ? Number(freeDelRow.value) : 500;
        const stdFeeRow = db.prepare("SELECT value FROM settings WHERE key = ?").get("standard_delivery_fee");
        const standardFee = stdFeeRow ? Number(stdFeeRow.value) : 40;
        const deliveryFee = subtotal >= minFreeDelivery ? 0 : standardFee;
        const discount = body.discount ? Number(body.discount) : 0;
        const totalAmount = Math.max(0, subtotal + deliveryFee - discount);

        const orderId = "ORD-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
        const paymentRef = (payment_method === "COD") 
          ? "COD-PAYABLE-ON-DELIVERY" 
          : "TXN-" + crypto.randomBytes(6).toString("hex").toUpperCase();

        const userId = authUser ? authUser.id : (db.prepare("SELECT id FROM users WHERE phone = ?").get(normalizedPhone)?.id || null);

        db.exec("BEGIN TRANSACTION;");
        try {
          db.prepare(`
            INSERT INTO orders (
              id, user_id, customer_name, customer_email, customer_phone,
              shipping_address, city, pincode, subtotal, delivery_fee, discount,
              total_amount, payment_method, payment_status, payment_ref, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            orderId, userId, customer_name.trim(), customer_email || "", normalizedPhone,
            shipping_address.trim(), city || "Kochi", pincode || "",
            subtotal, deliveryFee, discount, totalAmount,
            payment_method || "UPI",
            payment_method === "COD" ? "PENDING" : "PAID",
            paymentRef,
            "Pending",
            notes || ""
          );

          const insertItem = db.prepare(`
            INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, total_price)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          const deductStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

          for (const item of verifiedItems) {
            insertItem.run(orderId, item.product_id, item.product_name, item.unit_price, item.quantity, item.total_price);
            deductStock.run(item.quantity, item.product_id);
          }

          // If customer is logged in, automatically save their address to profile if empty
          if (authUser) {
            db.prepare(`
              UPDATE users
              SET address = CASE WHEN address IS NULL OR address = '' THEN ? ELSE address END,
                  city = CASE WHEN city IS NULL OR city = '' THEN ? ELSE city END,
                  pincode = CASE WHEN pincode IS NULL OR pincode = '' THEN ? ELSE pincode END
              WHERE id = ?
            `).run(shipping_address.trim(), city || "Kochi", pincode || "", authUser.id);
          }

          db.exec("COMMIT;");
        } catch (txErr) {
          db.exec("ROLLBACK;");
          console.error("Order transaction error:", txErr);
          return sendJson(res, 500, { error: "Failed to complete order" });
        }

        const savedOrder = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
        const savedItems = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId);
        for (const item of savedItems) {
          item.price = item.unit_price != null ? item.unit_price : (item.price != null ? item.price : 0);
          item.total = item.total_price != null ? item.total_price : (item.total != null ? item.total : item.price * (item.quantity || 1));
          item.unit_price = item.price;
          item.total_price = item.total;
        }
        savedOrder.order_number = savedOrder.id;
        savedOrder.total = savedOrder.total_amount;
        savedOrder.delivery_address = savedOrder.shipping_address;
        savedOrder.items = savedItems;
        
        return sendJson(res, 201, {
          success: true,
          order: savedOrder,
          items: savedItems,
          message: "Order placed successfully!"
        });
      }

      if (pathname === "/api/orders" && req.method === "GET") {
        const user = getAuthUser(req);
        const phone = parsedUrl.searchParams.get("phone");
        const searchId = parsedUrl.searchParams.get("order_id");

        let orders = [];

        if (phone || searchId) {
          let q = "SELECT * FROM orders WHERE 1=1";
          const p = [];
          if (phone) {
            const clean = phone.replace(/[^0-9]/g, "").slice(-10);
            q += " AND (REPLACE(customer_phone, ' ', '') LIKE '%' || ?)";
            p.push(clean);
          }
          if (searchId) {
            q += " AND id = ?";
            p.push(searchId);
          }
          q += " ORDER BY created_at DESC";
          orders = db.prepare(q).all(...p);
        } else if (user && user.role === "customer") {
          const clean = (user.phone || "").replace(/[^0-9]/g, "").slice(-10);
          orders = db.prepare(`
            SELECT * FROM orders
            WHERE user_id = ? 
               OR (LENGTH(?) = 10 AND REPLACE(customer_phone, ' ', '') LIKE '%' || ?)
            ORDER BY created_at DESC
          `).all(user.id, clean, clean);
        } else if (user && user.role === "admin") {
          orders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
        } else {
          return sendJson(res, 401, { error: "Authentication or phone search query required" });
        }

        // Attach items to all orders
        for (const ord of orders) {
          ord.items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(ord.id);
          for (const item of ord.items) {
            item.price = item.unit_price != null ? item.unit_price : (item.price != null ? item.price : 0);
            item.total = item.total_price != null ? item.total_price : (item.total != null ? item.total : item.price * (item.quantity || 1));
            item.unit_price = item.price;
            item.total_price = item.total;
          }
          ord.order_number = ord.id;
          ord.total = ord.total_amount;
          ord.delivery_address = ord.shipping_address;
        }

        return sendJson(res, 200, orders);
      }

      const singleOrderMatch = pathname.match(/^\/api\/orders\/([A-Za-z0-9\-]+)$/);
      if (singleOrderMatch && req.method === "GET") {
        const orderId = singleOrderMatch[1];
        const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
        if (!order) return sendJson(res, 404, { error: "Order not found" });
        const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId);
        for (const item of items) {
          item.price = item.unit_price != null ? item.unit_price : (item.price != null ? item.price : 0);
          item.total = item.total_price != null ? item.total_price : (item.total != null ? item.total : item.price * (item.quantity || 1));
          item.unit_price = item.price;
          item.total_price = item.total;
        }
        order.order_number = order.id;
        order.total = order.total_amount;
        order.delivery_address = order.shipping_address;
        order.items = items;
        const settingsRows = db.prepare("SELECT key, value FROM settings").all();
        const settings = {};
        settingsRows.forEach(r => { settings[r.key] = r.value; });

        return sendJson(res, 200, { order, items, settings, ...order });
      }

      const statusMatch = pathname.match(/^\/api\/admin\/orders\/([A-Za-z0-9\-]+)\/status$/);
      if (statusMatch && req.method === "PUT") {
        const user = getAuthUser(req);
        if (!user || user.role !== "admin") {
          return sendJson(res, 403, { error: "Admin access required" });
        }
        const orderId = statusMatch[1];
        const { status, payment_status } = await parseJsonBody(req);
        
        let q = "UPDATE orders SET status = ?";
        const params = [status];
        if (payment_status) {
          q += ", payment_status = ?";
          params.push(payment_status);
        }
        q += " WHERE id = ?";
        params.push(orderId);

        db.prepare(q).run(...params);
        return sendJson(res, 200, { success: true, status, payment_status });
      }

      if (pathname === "/api/admin/stats" && req.method === "GET") {
        const user = getAuthUser(req);
        if (!user || user.role !== "admin") {
          return sendJson(res, 403, { error: "Admin access required" });
        }

        const totalSalesRow = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = \x27PAID\x27").get();
        const totalOrdersRow = db.prepare("SELECT COUNT(*) as count FROM orders").get();
        const pendingOrdersRow = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = \x27Pending\x27").get();
        const activeProductsRow = db.prepare("SELECT COUNT(*) as count FROM products WHERE is_active = 1").get();
        const lowStockRow = db.prepare("SELECT COUNT(*) as count FROM products WHERE is_active = 1 AND stock <= 5").get();
        const totalUsersRow = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = \x27customer\x27").get();

        const recentOrders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 8").all();
        const lowStockItems = db.prepare("SELECT id, name, stock, unit FROM products WHERE is_active = 1 AND stock <= 5 ORDER BY stock ASC LIMIT 8").all();

        return sendJson(res, 200, {
          totalRevenue: totalSalesRow.total,
          totalOrders: totalOrdersRow.count,
          pendingOrders: pendingOrdersRow.count,
          totalProducts: activeProductsRow.count,
          lowStockCount: lowStockRow.count,
          totalUsers: totalUsersRow.count,
          recentOrders,
          lowStockItems
        });
      }

      // ==========================================
      // Customer Care Support & Omnichannel Routes
      // ==========================================

      // Get or Create Support Thread
      if (pathname === "/api/support/threads" && req.method === "POST") {
        const authUser = getAuthUser(req);
        const body = await parseJsonBody(req);
        const customer_name = (authUser ? authUser.name : body.name) || "Customer";
        const customer_phone = normalizePhone((authUser ? authUser.phone : body.phone) || "");
        const user_id = authUser ? authUser.id : null;

        // Check for existing open thread
        let thread = null;
        if (user_id) {
          thread = db.prepare("SELECT * FROM support_threads WHERE user_id = ? AND status = 'open' ORDER BY updated_at DESC LIMIT 1").get(user_id);
        }
        if (!thread && customer_phone) {
          thread = db.prepare("SELECT * FROM support_threads WHERE customer_phone = ? AND status = 'open' ORDER BY updated_at DESC LIMIT 1").get(customer_phone);
        }

        if (!thread) {
          const info = db.prepare(`
            INSERT INTO support_threads (user_id, customer_name, customer_phone, status, created_at, updated_at)
            VALUES (?, ?, ?, 'open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).run(user_id, customer_name, customer_phone);
          const threadId = info.lastInsertRowid;
          thread = db.prepare("SELECT * FROM support_threads WHERE id = ?").get(threadId);

          // Seed default welcome message
          db.prepare(`
            INSERT INTO support_messages (thread_id, sender_role, sender_id, sender_name, message_type, content, is_read)
            VALUES (?, 'support', NULL, 'വിപണി സപ്പോർട്ട് (Vipani Care)', 'text', 'നമസ്കാരം! വിപണി കസ്റ്റമർ കെയറിലേക്ക് സ്വാഗതം. താങ്കളെ എങ്ങനെയാണ് സഹായിക്കേണ്ടത്? (Welcome to Vipani Care! How may we assist you today?)', 0)
          `).run(threadId);
        }

        return sendJson(res, 200, { success: true, thread });
      }

      // List all threads for Support Agent / Admin
      if (pathname === "/api/support/threads" && req.method === "GET") {
        const authUser = getAuthUser(req);
        if (!authUser || (authUser.role !== "support" && authUser.role !== "admin")) {
          return sendJson(res, 403, { error: "Support Executive or Admin access required" });
        }

        const threads = db.prepare(`
          SELECT t.*, u.email as user_email, u.device_id
          FROM support_threads t
          LEFT JOIN users u ON u.id = t.user_id
          ORDER BY t.updated_at DESC
        `).all();

        for (const t of threads) {
          const lastMsg = db.prepare("SELECT * FROM support_messages WHERE thread_id = ? ORDER BY created_at DESC LIMIT 1").get(t.id);
          const unread = db.prepare("SELECT COUNT(*) as count FROM support_messages WHERE thread_id = ? AND sender_role = 'customer' AND is_read = 0").get(t.id);
          t.last_message = lastMsg || null;
          t.unread_count = unread ? unread.count : 0;
        }

        return sendJson(res, 200, { success: true, threads });
      }

      // Thread Messages (Get & Post)
      const threadMsgMatch = pathname.match(/^\/api\/support\/threads\/(\d+)\/messages$/);
      if (threadMsgMatch) {
        const threadId = Number(threadMsgMatch[1]);

        if (req.method === "GET") {
          const authUser = getAuthUser(req);
          // Mark messages as read for receiver
          if (authUser && (authUser.role === "support" || authUser.role === "admin")) {
            db.prepare("UPDATE support_messages SET is_read = 1 WHERE thread_id = ? AND sender_role = 'customer' AND is_read = 0").run(threadId);
          } else {
            db.prepare("UPDATE support_messages SET is_read = 1 WHERE thread_id = ? AND sender_role = 'support' AND is_read = 0").run(threadId);
          }

          const thread = db.prepare("SELECT * FROM support_threads WHERE id = ?").get(threadId);
          if (!thread) {
            return sendJson(res, 404, { error: "Support thread not found" });
          }

          const messages = db.prepare("SELECT * FROM support_messages WHERE thread_id = ? ORDER BY created_at ASC").all(threadId);
          return sendJson(res, 200, { success: true, thread, messages });
        }

        if (req.method === "POST") {
          const authUser = getAuthUser(req);
          const body = await parseJsonBody(req);
          const messageType = body.message_type === "audio" ? "audio" : "text";
          const content = body.content ? String(body.content).trim() : "";
          const audioDuration = Number(body.audio_duration || 0);

          if (!content) {
            return sendJson(res, 400, { error: "Message content cannot be empty" });
          }

          let senderRole = "customer";
          let senderName = "Customer";
          let senderId = null;

          if (authUser) {
            senderId = authUser.id;
            if (authUser.role === "support" || authUser.role === "admin") {
              senderRole = "support";
              senderName = authUser.name || "സപ്പോർട്ട് എക്സിക്യൂട്ടീവ്";
            } else {
              senderRole = "customer";
              senderName = authUser.name || "Customer";
            }
          } else {
            senderRole = body.sender_role === "support" ? "support" : "customer";
            senderName = body.sender_name || (senderRole === "support" ? "സപ്പോർട്ട് എക്സിക്യൂട്ടീവ്" : "Customer");
          }

          const info = db.prepare(`
            INSERT INTO support_messages (thread_id, sender_role, sender_id, sender_name, message_type, content, audio_duration, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
          `).run(threadId, senderRole, senderId, senderName, messageType, content, audioDuration);

          db.prepare("UPDATE support_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(threadId);

          const insertedMsg = db.prepare("SELECT * FROM support_messages WHERE id = ?").get(info.lastInsertRowid);
          return sendJson(res, 201, { success: true, message: insertedMsg });
        }
      }

      // Audio Upload (Voice Notes)
      if (pathname === "/api/support/upload-audio" && req.method === "POST") {
        const body = await parseJsonBody(req);
        let audioData = body.audio_data || body.audio || body.data;
        const format = (body.format || "webm").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!audioData) {
          return sendJson(res, 400, { error: "Audio data is required (base64)" });
        }

        // Strip data:audio/...;base64, prefix if present
        if (audioData.includes(",")) {
          audioData = audioData.split(",")[1];
        }

        const buffer = Buffer.from(audioData, "base64");
        const ext = format === "wav" ? "wav" : format === "m4a" ? "m4a" : format === "mp3" ? "mp3" : format === "ogg" ? "ogg" : "webm";
        const filename = `voice_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${ext}`;
        const filePath = path.join(UPLOADS_AUDIO_DIR, filename);

        await fs.promises.writeFile(filePath, buffer);
        const audioUrl = `/uploads/audio/${filename}`;

        return sendJson(res, 200, {
          success: true,
          audio_url: audioUrl,
          duration: Number(body.duration || 0),
          size: buffer.length
        });
      }

      // Start Call
      if (pathname === "/api/support/call/start" && req.method === "POST") {
        const authUser = getAuthUser(req);
        const body = await parseJsonBody(req);
        const thread_id = Number(body.thread_id);
        const call_type = body.call_type === "video" ? "video" : "audio";
        const caller_role = (authUser && (authUser.role === "support" || authUser.role === "admin")) ? "support" : (body.caller_role || "customer");
        const caller_name = (authUser ? authUser.name : body.caller_name) || (caller_role === "support" ? "വിപണി സപ്പോർട്ട്" : "Customer");
        const offer_sdp = body.offer_sdp ? (typeof body.offer_sdp === "object" ? JSON.stringify(body.offer_sdp) : String(body.offer_sdp)) : null;

        if (!thread_id) {
          return sendJson(res, 400, { error: "Thread ID is required" });
        }

        // Cancel previous pending calls for thread
        db.prepare("UPDATE support_calls SET status = 'ended', ended_at = CURRENT_TIMESTAMP WHERE thread_id = ? AND status = 'ringing'").run(thread_id);

        const call_id = crypto.randomUUID();
        db.prepare(`
          INSERT INTO support_calls (id, thread_id, caller_role, caller_name, call_type, status, offer_sdp, ice_candidates, started_at)
          VALUES (?, ?, ?, ?, ?, 'ringing', ?, '[]', CURRENT_TIMESTAMP)
        `).run(call_id, thread_id, caller_role, caller_name, call_type, offer_sdp);

        // Post notice in chat
        const callIcon = call_type === "video" ? "📹" : "📞";
        const callTypeLabel = call_type === "video" ? "വീഡിയോ കോൾ (Video Call)" : "ഓഡിയോ കോൾ (Audio Call)";
        db.prepare(`
          INSERT INTO support_messages (thread_id, sender_role, sender_name, message_type, content, is_read)
          VALUES (?, ?, ?, 'text', ?, 1)
        `).run(thread_id, caller_role, caller_name, `${callIcon} ${callTypeLabel} ആരംഭിച്ചു (${caller_name})`);
        db.prepare("UPDATE support_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(thread_id);

        return sendJson(res, 200, {
          success: true,
          call_id,
          thread_id,
          call_type,
          caller_role,
          caller_name,
          status: "ringing"
        });
      }

      // Check Active Call for thread
      if (pathname === "/api/support/call/active" && req.method === "GET") {
        const thread_id = Number(parsedUrl.searchParams.get("thread_id"));
        if (!thread_id) {
          return sendJson(res, 400, { error: "Thread ID is required" });
        }

        // Clean up stale ringing calls older than 45s
        db.prepare("UPDATE support_calls SET status = 'ended', ended_at = CURRENT_TIMESTAMP WHERE status = 'ringing' AND (strftime('%s', 'now') - strftime('%s', started_at)) > 45").run();

        const call = db.prepare("SELECT * FROM support_calls WHERE thread_id = ? AND status IN ('ringing', 'connected') ORDER BY started_at DESC LIMIT 1").get(thread_id);
        return sendJson(res, 200, {
          active: !!call,
          call: call || null
        });
      }

      // Answer Call
      if (pathname === "/api/support/call/answer" && req.method === "POST") {
        const { call_id, answer_sdp } = await parseJsonBody(req);
        if (!call_id) {
          return sendJson(res, 400, { error: "Call ID is required" });
        }

        const answerJson = typeof answer_sdp === "object" ? JSON.stringify(answer_sdp) : String(answer_sdp || "");
        db.prepare("UPDATE support_calls SET status = 'connected', answer_sdp = ? WHERE id = ?").run(answerJson, call_id);
        return sendJson(res, 200, { success: true, status: "connected" });
      }

      // ICE Candidates Exchange
      if (pathname === "/api/support/call/ice" && req.method === "POST") {
        const { call_id, candidate, sender_role } = await parseJsonBody(req);
        if (!call_id || !candidate) {
          return sendJson(res, 400, { error: "Call ID and candidate are required" });
        }

        const call = db.prepare("SELECT ice_candidates FROM support_calls WHERE id = ?").get(call_id);
        if (call) {
          let candidates = [];
          try { candidates = JSON.parse(call.ice_candidates || "[]"); } catch (e) { candidates = []; }
          candidates.push({ candidate, sender_role: sender_role || "unknown", time: Date.now() });
          db.prepare("UPDATE support_calls SET ice_candidates = ? WHERE id = ?").run(JSON.stringify(candidates), call_id);
        }
        return sendJson(res, 200, { success: true });
      }

      // Get Call Status & Signaling Info
      const callStatusMatch = pathname.match(/^\/api\/support\/call\/([a-zA-Z0-9\-]+)\/status$/);
      if (callStatusMatch && req.method === "GET") {
        const callId = callStatusMatch[1];
        const call = db.prepare("SELECT * FROM support_calls WHERE id = ?").get(callId);
        if (!call) {
          return sendJson(res, 404, { error: "Call not found" });
        }
        return sendJson(res, 200, { success: true, call });
      }

      // End Call
      if (pathname === "/api/support/call/end" && req.method === "POST") {
        const { call_id, status } = await parseJsonBody(req);
        if (!call_id) {
          return sendJson(res, 400, { error: "Call ID is required" });
        }
        const finalStatus = status === "declined" ? "declined" : "ended";
        db.prepare("UPDATE support_calls SET status = ?, ended_at = CURRENT_TIMESTAMP WHERE id = ?").run(finalStatus, call_id);
        return sendJson(res, 200, { success: true, status: finalStatus });
      }

      return sendJson(res, 404, { error: "API route not found" });
    }

    serveStatic(req, res, pathname);

  } catch (err) {
    console.error("Server error on " + req.method + " " + pathname + ":", err);
    sendJson(res, 500, { error: "Internal Server Error" });
  }
}

const server = http.createServer(handleRequest);

function startServer(port = Number(PORT)) {
  server.removeAllListeners("error");
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error("Server error:", err);
    }
  });

  server.listen(port, HOST, () => {
    console.log(`\n🚀 Shop Platform Server is LIVE and running at:\n👉 http://${HOST}:${port}\n`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  server,
  handleRequest,
  sessions
};
