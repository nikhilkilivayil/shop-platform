const { Readable, Writable } = require("node:stream");
const assert = require("node:assert");
const { handleRequest } = require("./server");
const { db } = require("./db");

function simulateRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const method = options.method || "GET";
    const headers = options.headers || {};
    const bodyData = options.body ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body)) : "";

    const req = new Readable({
      read() {
        if (bodyData) {
          this.push(bodyData);
        }
        this.push(null);
      }
    });
    req.method = method;
    req.url = path;
    req.headers = { host: "localhost:3000", ...headers };

    let statusCode = 200;
    let resHeaders = {};
    let responseBody = "";

    const res = new Writable({
      write(chunk, encoding, callback) {
        responseBody += chunk.toString();
        callback();
      }
    });

    res.writeHead = function(code, h) {
      statusCode = code;
      if (h) resHeaders = { ...resHeaders, ...h };
    };

    res.setHeader = function(k, v) {
      resHeaders[k.toLowerCase()] = v;
    };

    res.on("finish", () => {
      let json = null;
      try { json = JSON.parse(responseBody); } catch (_) {}
      resolve({ status: statusCode, headers: resHeaders, body: responseBody, json });
    });

    handleRequest(req, res).catch(reject);
  });
}

async function runAllTests() {
  console.log("🚀 Starting Comprehensive Shop & Customer Profile Test Suite...\n");

  // 1. Health Check
  console.log("Test 1: Health check");
  const health = await simulateRequest("/api/health");
  assert.strictEqual(health.status, 200);
  assert.strictEqual(health.json.status, "ok");
  console.log("  ✅ Health check passed.");

  // 2. Admin Login
  console.log("Test 2: Admin Authentication");
  const adminLogin = await simulateRequest("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { email: "admin@shop.local", password: "admin123" }
  });
  assert.strictEqual(adminLogin.status, 200);
  const adminToken = adminLogin.json.token;
  console.log("  ✅ Admin token received.");

  // 3. Customer Send OTP with Mobile & Device ID
  console.log("Test 3: Customer Send OTP");
  const testPhone = "9847123999";
  const testDeviceId = "DEV-TEST-MAC-001";
  const sendOtpRes = await simulateRequest("/api/auth/send-otp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { phone: testPhone, device_id: testDeviceId }
  });
  assert.strictEqual(sendOtpRes.status, 200);
  assert(sendOtpRes.json.otp);
  const generatedOtp = sendOtpRes.json.otp;
  console.log("  ✅ OTP sent to:", sendOtpRes.json.phone, "| Code:", generatedOtp);

  // 4. Customer Verify OTP & Login
  console.log("Test 4: Customer Verify OTP & Login");
  const verifyOtpRes = await simulateRequest("/api/auth/verify-otp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      phone: testPhone,
      otp: generatedOtp,
      device_id: testDeviceId,
      name: "ഫഹദ് ഫാസിൽ (Fahadh Faasil)"
    }
  });
  assert.strictEqual(verifyOtpRes.status, 200);
  assert(verifyOtpRes.json.token);
  assert.strictEqual(verifyOtpRes.json.user.name, "ഫഹദ് ഫാസിൽ (Fahadh Faasil)");
  assert.strictEqual(verifyOtpRes.json.user.device_id, testDeviceId);
  const customerToken = verifyOtpRes.json.token;
  const customerId = verifyOtpRes.json.user.id;
  console.log("  ✅ Customer logged in! ID:", customerId, "Device ID:", testDeviceId);

  // 5. Customer Profile Update (Delivery Address)
  console.log("Test 5: Customer Profile Update (Delivery Address)");
  const profileUpdate = await simulateRequest("/api/user/profile", {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${customerToken}`
    },
    body: {
      name: "ഫഹദ് ഫാസിൽ",
      address: "ഫ്ലാറ്റ് 12A, മറൈൻ ഡ്രൈവ്",
      city: "Kochi",
      pincode: "682031",
      device_id: testDeviceId
    }
  });
  assert.strictEqual(profileUpdate.status, 200);
  assert.strictEqual(profileUpdate.json.user.address, "ഫ്ലാറ്റ് 12A, മറൈൻ ഡ്രൈവ്");
  console.log("  ✅ Profile updated with address:", profileUpdate.json.user.address);

  // 6. Customer Authenticated Checkout
  console.log("Test 6: Customer Checkout & Payment with Profile Linking");
  const productsRes = await simulateRequest("/api/products");
  const sampleProd = productsRes.json[0];

  const orderRes = await simulateRequest("/api/orders", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${customerToken}`
    },
    body: {
      customer_name: "ഫഹദ് ഫാസിൽ",
      customer_phone: "+91 " + testPhone,
      shipping_address: "ഫ്ലാറ്റ് 12A, മറൈൻ ഡ്രൈവ്",
      city: "Kochi",
      pincode: "682031",
      payment_method: "UPI",
      items: [{ product_id: sampleProd.id, quantity: 1 }]
    }
  });
  assert.strictEqual(orderRes.status, 201);
  const orderId = orderRes.json.order.id;
  assert.strictEqual(orderRes.json.order.user_id, customerId);
  console.log("  ✅ Order placed:", orderId, "| User ID linked:", orderRes.json.order.user_id);

  // 7. Customer Purchase History
  console.log("Test 7: Customer My Orders History");
  const myOrdersRes = await simulateRequest("/api/user/orders", {
    headers: { "authorization": `Bearer ${customerToken}` }
  });
  assert.strictEqual(myOrdersRes.status, 200);
  assert(Array.isArray(myOrdersRes.json));
  assert(myOrdersRes.json.some(o => o.id === orderId));
  console.log("  ✅ Customer can view their purchase history. Total orders:", myOrdersRes.json.length);

  // 8. Admin Users Directory
  console.log("Test 8: Admin Users Directory Listing");
  const adminUsersRes = await simulateRequest("/api/admin/users", {
    headers: { "authorization": `Bearer ${adminToken}` }
  });
  assert.strictEqual(adminUsersRes.status, 200);
  const foundCustomer = adminUsersRes.json.find(u => u.id === customerId);
  assert(foundCustomer);
  assert.strictEqual(foundCustomer.device_id, testDeviceId);
  assert(foundCustomer.total_orders >= 1);
  console.log("  ✅ Admin found customer in directory. Total orders:", foundCustomer.total_orders, "Total spent: ₹" + foundCustomer.total_spent);

  // 9. Admin Blocks Unwanted User
  console.log("Test 9: Admin Blocks Customer");
  const blockRes = await simulateRequest(`/api/admin/users/${customerId}/block`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${adminToken}`
    },
    body: { is_blocked: 1 }
  });
  assert.strictEqual(blockRes.status, 200);
  assert.strictEqual(blockRes.json.is_blocked, 1);
  console.log("  ✅ User successfully blocked by Admin.");

  // 10. Verify Blocked User is Denied Checkout & Login
  console.log("Test 10: Verify Blocked User Cannot Place Order");
  const blockedOrderRes = await simulateRequest("/api/orders", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${customerToken}`
    },
    body: {
      customer_name: "ഫഹദ് ഫാസിൽ",
      customer_phone: "+91 " + testPhone,
      shipping_address: "ഫ്ലാറ്റ് 12A, മറൈൻ ഡ്രൈവ്",
      payment_method: "COD",
      items: [{ product_id: sampleProd.id, quantity: 1 }]
    }
  });
  assert.strictEqual(blockedOrderRes.status, 403);
  console.log("  ✅ Blocked user order attempt correctly rejected with 403 Forbidden.");

  // Verify blocked user cannot request OTP
  const blockedOtpRes = await simulateRequest("/api/auth/send-otp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { phone: testPhone, device_id: testDeviceId }
  });
  assert.strictEqual(blockedOtpRes.status, 403);
  console.log("  ✅ Blocked user OTP request correctly rejected with 403.");

  // 11. Admin Unblocks User
  console.log("Test 11: Admin Unblocks Customer");
  const unblockRes = await simulateRequest(`/api/admin/users/${customerId}/block`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${adminToken}`
    },
    body: { is_blocked: 0 }
  });
  assert.strictEqual(unblockRes.status, 200);
  assert.strictEqual(unblockRes.json.is_blocked, 0);
  console.log("  ✅ User unblocked successfully.");

  // 12. Verify Unblocked User can request OTP again
  console.log("Test 12: Verify Unblocked User Can Login Again");
  const unblockedOtpRes = await simulateRequest("/api/auth/send-otp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { phone: testPhone, device_id: testDeviceId }
  });
  assert.strictEqual(unblockedOtpRes.status, 200);
  console.log("  ✅ Unblocked user successfully requested new OTP.");

  console.log("\n🎉 ALL 12 VERIFICATION TESTS FOR PROFILE, OTP & USER MANAGEMENT PASSED! 💯\n");
}

runAllTests().catch(err => {
  console.error("❌ Test error:", err);
  process.exit(1);
});
