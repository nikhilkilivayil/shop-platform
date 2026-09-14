const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log("=== Testing Mobile Contract Endpoints ===");
  const phone = "9876543210";
  const deviceId = "TEST-DEV-1234";

  // 1. Send OTP
  console.log("\n1. Testing POST /api/auth/send-otp...");
  const sendOtpRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/send-otp',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { phone, device_id: deviceId });
  console.log("Status:", sendOtpRes.status, "Response:", sendOtpRes.data);
  if (!sendOtpRes.data.success) throw new Error("send-otp failed");

  const otp = sendOtpRes.data.otp;

  // 2. Verify OTP
  console.log("\n2. Testing POST /api/auth/verify-otp...");
  const verifyRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/verify-otp',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { phone, otp, name: "Test Mobile User", device_id: deviceId });
  console.log("Status:", verifyRes.status, "Token exists:", !!verifyRes.data.token);
  const token = verifyRes.data.token;

  // 3. Create Order
  console.log("\n3. Testing POST /api/orders (Checkout)...");
  const orderRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    customer_name: "Test Mobile User",
    customer_phone: phone,
    shipping_address: "123 Marine Drive",
    city: "Kochi",
    pincode: "682001",
    items: [
      { product_id: 1, product_name: "Fresh Kerala Banana", quantity: 2, unit_price: 50 }
    ],
    payment_method: "UPI"
  });

  console.log("Status:", orderRes.status);
  const order = orderRes.data.order;
  console.log("Order ID:", order.id, "(Type:", typeof order.id, ")");
  console.log("Order Number:", order.order_number);
  console.log("Order Delivery Address:", order.delivery_address);
  console.log("First Item:", order.items[0]);

  if (typeof order.id !== 'string') throw new Error("Order ID is not string!");
  if (order.items[0].price === undefined) throw new Error("Item price is missing!");
  if (order.items[0].unit_price === undefined) throw new Error("Item unit_price is missing!");
  if (order.items[0].total === undefined) throw new Error("Item total is missing!");
  if (order.items[0].total_price === undefined) throw new Error("Item total_price is missing!");
  console.log("✅ Checkout contract test PASSED: price, unit_price, total, total_price, and String id verified!");

  // 4. Fetch User Orders
  console.log("\n4. Testing GET /api/user/orders...");
  const userOrdersRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/user/orders',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log("Status:", userOrdersRes.status, "Orders count:", userOrdersRes.data.length);
  const firstUserOrder = userOrdersRes.data[0];
  if (!firstUserOrder.items || firstUserOrder.items.length === 0) throw new Error("No items in user order!");
  if (firstUserOrder.items[0].price === undefined) throw new Error("User order item price missing!");
  console.log("First User Order Item:", firstUserOrder.items[0]);
  console.log("✅ User orders contract test PASSED!");

  // 5. Fetch Order Details
  console.log("\n5. Testing GET /api/orders/:id...");
  const orderDetailRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/orders/${order.id}`,
    method: 'GET'
  });
  console.log("Status:", orderDetailRes.status, "Order Number:", orderDetailRes.data.order_number);
  console.log("Detail First Item:", orderDetailRes.data.items[0]);
  if (orderDetailRes.data.items[0].price === undefined) throw new Error("Order detail item price missing!");
  console.log("✅ Order detail contract test PASSED!");

  console.log("\n🎉 ALL MOBILE API CONTRACTS VERIFIED SUCCESSFULLY!");
}

run().catch(err => {
  console.error("❌ Test Failed:", err);
  process.exit(1);
});
