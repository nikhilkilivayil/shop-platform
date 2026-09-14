const { db, initDatabase } = require('./db');

initDatabase();

// Seed Categories
const categories = [
  { name: 'Groceries & Provisions', name_ml: 'പലചരക്ക് & ധാന്യങ്ങൾ', slug: 'groceries', icon: '🌾' },
  { name: 'Fresh Vegetables & Fruits', name_ml: 'പച്ചക്കറികൾ & പഴങ്ങൾ', slug: 'fresh', icon: '🥬' },
  { name: 'Spices & Masalas', name_ml: 'സുഗന്ധവ്യഞ്ജനങ്ങൾ & മസാലകൾ', slug: 'spices', icon: '🌶️' },
  { name: 'Snacks & Beverages', name_ml: 'ലഘുഭക്ഷണങ്ങൾ & പാനീയങ്ങൾ', slug: 'snacks', icon: '☕' },
  { name: 'Dairy & Bakery', name_ml: 'പാൽ & ബേക്കറി', slug: 'dairy', icon: '🥛' },
  { name: 'Home Essentials', name_ml: 'വീട്ടുപകരണങ്ങൾ', slug: 'household', icon: '🏠' }
];

const insertCat = db.prepare('INSERT OR IGNORE INTO categories (id, name, name_ml, slug, icon) VALUES (?, ?, ?, ?, ?)');
categories.forEach((cat, idx) => {
  insertCat.run(idx + 1, cat.name, cat.name_ml, cat.slug, cat.icon);
});

// Helper for generating SVG Product Icons
function createSvgDataUri(bg, emoji, label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 240" width="100%" height="100%">
    <rect width="300" height="240" rx="16" fill="${bg}"/>
    <circle cx="150" cy="105" r="55" fill="rgba(255,255,255,0.2)"/>
    <text x="150" y="122" font-size="62" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    <rect x="30" y="180" width="240" height="34" rx="8" fill="rgba(0,0,0,0.18)"/>
    <text x="150" y="202" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">${label}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Seed Products
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
if (productCount === 0) {
  const products = [
    {
      cat_id: 1,
      name: 'Kerala Matta Rice Premium (5 Kg)',
      name_ml: 'കേരള മട്ട അരി (5 കി.ഗ്രാം)',
      desc: 'പരമ്പരാഗത ശൈലിയിൽ വിളവെടുത്ത പോഷകസമൃദ്ധമായ ഒറിജിനൽ പാലക്കാടൻ മട്ടയരി.',
      price: 295,
      mrp: 340,
      unit: '5 kg pack',
      stock: 35,
      image: createSvgDataUri('#8D3318', '🍚', 'Matta Rice (5Kg)')
    },
    {
      cat_id: 1,
      name: 'Pure Coconut Oil - Double Filtered (1 Litre)',
      name_ml: 'ശുദ്ധമായ വെളിച്ചെണ്ണ (1 ലിറ്റർ)',
      desc: '100% പ്രകൃതിദത്തമായ കൊപ്രയിൽ നിന്ന് ആട്ടിയ ശുദ്ധമായ നാടൻ വെളിച്ചെണ്ണ.',
      price: 235,
      mrp: 270,
      unit: '1 Litre Bottle',
      stock: 40,
      image: createSvgDataUri('#1E6F5C', '🥥', 'Pure Coconut Oil')
    },
    {
      cat_id: 1,
      name: 'Traditional Sona Masoori Rice (5 Kg)',
      name_ml: 'സോന മസൂരി റൈസ് (5 കി.ഗ്രാം)',
      desc: 'നല്ല വെളുത്ത മൃദുവായ ചോറിന് അനുയോജ്യമായ ഉയർന്ന നിലവാരമുള്ള അരി.',
      price: 320,
      mrp: 380,
      unit: '5 kg pack',
      stock: 25,
      image: createSvgDataUri('#2E4057', '🌾', 'Sona Masoori Rice')
    },
    {
      cat_id: 3,
      name: 'Wayanad Premium Black Pepper (250g)',
      name_ml: 'വയനാടൻ കുരുമുളക് (250 ഗ്രാം)',
      desc: 'വയനാടൻ മലനിരകളിൽ നിന്ന് നേരിട്ട് ശേഖരിച്ച എരിവും ഗുണവുമുള്ള കുരുമുളക്.',
      price: 210,
      mrp: 250,
      unit: '250g Pouch',
      stock: 50,
      image: createSvgDataUri('#3A3845', '🌱', 'Wayanad Black Pepper')
    },
    {
      cat_id: 3,
      name: 'Idukki Green Cardamom / ഏലയ്ക്ക (100g)',
      name_ml: 'ഇടുക്കി ഏലയ്ക്ക (100 ഗ്രാം)',
      desc: 'നല്ല സുഗന്ധവും വലിപ്പവുമുള്ള ഫ്രഷ് ഇടുക്കി ഏലയ്ക്ക.',
      price: 280,
      mrp: 350,
      unit: '100g Box',
      stock: 20,
      image: createSvgDataUri('#2D6A4F', '🌿', 'Idukki Cardamom')
    },
    {
      cat_id: 2,
      name: 'Fresh Nendran Banana / നേന്ത്രപ്പഴം (1 Kg)',
      name_ml: 'നാടൻ നേന്ത്രപ്പഴം (1 കി.ഗ്രാം)',
      desc: 'രുചികരമായ പ്രകൃതിദത്ത നാടൻ പഴുത്ത നേന്ത്രപ്പഴം.',
      price: 68,
      mrp: 80,
      unit: '1 Kg',
      stock: 60,
      image: createSvgDataUri('#E3A857', '🍌', 'Fresh Nendran Banana')
    },
    {
      cat_id: 2,
      name: 'Farm Fresh Coconut / നാളികേരം (Pack of 3)',
      name_ml: 'നാടൻ തേങ്ങ (3 എണ്ണം)',
      desc: 'വലിപ്പമുള്ള ഫ്രഷ് നാടൻ തേങ്ങ.',
      price: 105,
      mrp: 120,
      unit: 'Pack of 3',
      stock: 30,
      image: createSvgDataUri('#6B4423', '🥥', 'Farm Fresh Coconut')
    },
    {
      cat_id: 4,
      name: 'Crispy Kerala Banana Chips (250g)',
      name_ml: 'സ്വാദൂറുന്ന വാഴക്കായ വറുത്തത് (250 ഗ്രാം)',
      desc: 'ശുദ്ധമായ വെളിച്ചെണ്ണയിൽ വറുത്തെടുത്ത മൊരിഞ്ഞ നേന്ത്രക്കായ ഉപ്പേരി.',
      price: 110,
      mrp: 130,
      unit: '250g pack',
      stock: 45,
      image: createSvgDataUri('#D4A373', '🍟', 'Kerala Banana Chips')
    },
    {
      cat_id: 4,
      name: 'Malabar Strong Tea Powder (500g)',
      name_ml: 'മലബാർ സ്ട്രോങ്ങ് ടീ പൗഡർ (500 ഗ്രാം)',
      desc: 'നല്ല കൊഴുപ്പും കടുപ്പവുമുള്ള ഒറിജിനൽ തേയിലപ്പൊടി.',
      price: 195,
      mrp: 230,
      unit: '500g Pouch',
      stock: 35,
      image: createSvgDataUri('#A44A3F', '☕', 'Malabar Strong Tea')
    },
    {
      cat_id: 5,
      name: 'Farm Fresh Cow Milk (500 ml)',
      name_ml: 'ശുദ്ധമായ പശുവിൻ പാൽ (500 മി.ലി)',
      desc: 'ദിവസവും എത്തുന്ന പാസ്ചറൈസ് ചെയ്ത ശുദ്ധമായ പാൽ.',
      price: 28,
      mrp: 30,
      unit: '500ml Packet',
      stock: 25,
      image: createSvgDataUri('#4A90E2', '🥛', 'Fresh Cow Milk')
    },
    {
      cat_id: 6,
      name: 'Traditional Handmade Neem & Turmeric Soap (3x100g)',
      name_ml: 'ആര്യവേപ്പ് മഞ്ഞൾ ആയുർവേദ സോപ്പ് (3 എണ്ണം)',
      desc: 'ചർമ്മ സംരക്ഷണത്തിന് ഉത്തമമായ ആയുർവേദ സോപ്പ്.',
      price: 140,
      mrp: 180,
      unit: 'Pack of 3',
      stock: 40,
      image: createSvgDataUri('#588157', '🧼', 'Neem & Turmeric Soap')
    },
    {
      cat_id: 6,
      name: 'Multipurpose Kitchen Storage Jar Set (6 Pcs)',
      name_ml: 'കിച്ചൻ സ്റ്റോറേജ് ജാർ സെറ്റ് (6 എണ്ണം)',
      desc: 'ഭക്ഷ്യവസ്തുക്കൾ കേടാകാതെ സൂക്ഷിക്കാനുള്ള എയർടൈറ്റ് കണ്ടെയ്നറുകൾ.',
      price: 349,
      mrp: 499,
      unit: 'Set of 6',
      stock: 15,
      image: createSvgDataUri('#3D5A80', '🏺', 'Kitchen Storage Set')
    }
  ];

  const insertProd = db.prepare(`
    INSERT INTO products (category_id, name, name_ml, description, price, mrp, unit, stock, image_url, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  products.forEach(p => {
    insertProd.run(p.cat_id, p.name, p.name_ml, p.desc, p.price, p.mrp, p.unit, p.stock, p.image);
  });
  console.log('Seeded ' + products.length + ' products.');
}

// Seed a sample order if orders empty
const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
if (orderCount === 0) {
  const orderId = 'ORD-2026-1001';
  db.prepare(`
    INSERT INTO orders (id, customer_name, customer_email, customer_phone, shipping_address, city, pincode, subtotal, delivery_fee, discount, total_amount, payment_method, payment_status, payment_ref, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderId,
    'രാഹുൽ കൃഷ്ണൻ (Rahul Krishnan)',
    'rahul@example.com',
    '+91 94471 23456',
    'ഫ്ലാറ്റ് 4B, സ്കൈലൈൻ അപ്പാർട്ട്മെന്റ്സ്, എം.ജി റോഡ്',
    'Kochi',
    '682016',
    530,
    0,
    0,
    530,
    'UPI',
    'PAID',
    'UPI-REF-98471203',
    'Processing'
  );

  db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, total_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(orderId, 1, 'Kerala Matta Rice Premium (5 Kg)', 295, 1, 295);

  db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, total_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(orderId, 2, 'Pure Coconut Oil (1 Litre)', 235, 1, 235);

  console.log('Sample order created: ' + orderId);
}

console.log('Database initialization & seeding complete.');
