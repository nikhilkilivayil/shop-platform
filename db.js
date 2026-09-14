const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const crypto = require('node:crypto');

const fs = require('node:fs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'shop.db');
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for better concurrency
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL DEFAULT 'customer',
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_ml TEXT,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT DEFAULT '📦'
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      name_ml TEXT,
      description TEXT,
      price REAL NOT NULL,
      mrp REAL,
      unit TEXT DEFAULT 'item',
      stock INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      city TEXT DEFAULT 'Kochi',
      pincode TEXT,
      subtotal REAL NOT NULL,
      delivery_fee REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'PAID',
      payment_ref TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS support_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS support_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL REFERENCES support_threads(id) ON DELETE CASCADE,
      sender_role TEXT NOT NULL,
      sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      sender_name TEXT NOT NULL,
      message_type TEXT NOT NULL DEFAULT 'text',
      content TEXT NOT NULL,
      audio_duration REAL DEFAULT 0,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS support_calls (
      id TEXT PRIMARY KEY,
      thread_id INTEGER NOT NULL REFERENCES support_threads(id) ON DELETE CASCADE,
      caller_role TEXT NOT NULL,
      caller_name TEXT NOT NULL,
      call_type TEXT NOT NULL DEFAULT 'audio',
      status TEXT NOT NULL DEFAULT 'ringing',
      offer_sdp TEXT,
      answer_sdp TEXT,
      ice_candidates TEXT DEFAULT '[]',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME
    );
  `);


  // Auto-migrate users table columns
  const userColumns = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  if (!userColumns.includes("device_id")) {
    db.exec("ALTER TABLE users ADD COLUMN device_id TEXT;");
  }
  if (!userColumns.includes("is_blocked")) {
    db.exec("ALTER TABLE users ADD COLUMN is_blocked INTEGER DEFAULT 0;");
  }
  if (!userColumns.includes("otp_code")) {
    db.exec("ALTER TABLE users ADD COLUMN otp_code TEXT;");
  }
  if (!userColumns.includes("otp_expires_at")) {
    db.exec("ALTER TABLE users ADD COLUMN otp_expires_at INTEGER;");
  }
  if (!userColumns.includes("address")) {
    db.exec("ALTER TABLE users ADD COLUMN address TEXT;");
  }
  if (!userColumns.includes("city")) {
    db.exec("ALTER TABLE users ADD COLUMN city TEXT;");
  }
  if (!userColumns.includes("pincode")) {
    db.exec("ALTER TABLE users ADD COLUMN pincode TEXT;");
  }

  // Seed settings if empty
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
  if (settingsCount === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('shop_name', 'വിപണി സൂപ്പർമാർക്കറ്റ് (Vipani Store)');
    insertSetting.run('shop_tagline', 'ഗുണമേന്മയുള്ള സാധനങ്ങൾ, വേഗത്തിലുള്ള വിതരണം');
    insertSetting.run('shop_phone', '+91 98470 12345');
    insertSetting.run('shop_email', 'contact@vipanistore.com');
    insertSetting.run('shop_address', 'മാർക്കറ്റ് റോഡ്, എറണാകുളം, കേരളം - 682011');
    insertSetting.run('upi_id', 'vipanistore@okhdfcbank');
    insertSetting.run('free_delivery_threshold', '500');
    insertSetting.run('standard_delivery_fee', '40');
    insertSetting.run('currency_symbol', '₹');
  }

  // Seed default admin if empty
  const adminUser = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@shop.local');
  if (!adminUser) {
    const insertAdmin = db.prepare('INSERT INTO users (role, name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)');
    insertAdmin.run('admin', 'ഷോപ്പ് മാനേജർ (Admin)', 'admin@shop.local', hashPassword('admin123'), '+91 98470 12345');
  }

  // Seed default support executive if empty
  const supportUser = db.prepare('SELECT id FROM users WHERE email = ?').get('support@shop.local');
  if (!supportUser) {
    const insertSupport = db.prepare('INSERT INTO users (role, name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)');
    insertSupport.run('support', 'കസ്റ്റമർ കെയർ എക്സിക്യൂട്ടീവ് (Support Agent)', 'support@shop.local', hashPassword('support123'), '+91 98470 54321');
  }
}

module.exports = {
  db,
  initDatabase,
  hashPassword
};
