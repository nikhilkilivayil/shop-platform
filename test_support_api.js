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

    res.end = function(chunk) {
      if (chunk) responseBody += chunk.toString();
      let parsed = null;
      try {
        parsed = JSON.parse(responseBody);
      } catch (e) {
        parsed = responseBody;
      }
      resolve({ status: statusCode, headers: resHeaders, data: parsed });
    };

    handleRequest(req, res).catch(reject);
  });
}

async function runTests() {
  console.log("=== Testing Customer Care Support API Endpoints ===");

  // 1. Customer creates/gets support thread
  console.log("1. Testing POST /api/support/threads...");
  const threadRes = await simulateRequest("/api/support/threads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { name: "Ananya Krishna", phone: "9847123456" }
  });
  console.log("Thread create status:", threadRes.status);
  assert.strictEqual(threadRes.status, 200);
  assert(threadRes.data.thread && threadRes.data.thread.id);
  const threadId = threadRes.data.thread.id;
  console.log("Thread ID:", threadId);

  // 2. Fetch thread messages
  console.log("2. Testing GET /api/support/threads/:id/messages...");
  const msgListRes = await simulateRequest("/api/support/threads/" + threadId + "/messages");
  assert.strictEqual(msgListRes.status, 200);
  console.log("Messages count:", msgListRes.data.messages.length);
  assert(msgListRes.data.messages.length >= 1);

  // 3. Customer sends text message
  console.log("3. Testing POST customer text message...");
  const customerMsgRes = await simulateRequest("/api/support/threads/" + threadId + "/messages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      message_type: "text",
      content: "എന്റെ ഓർഡർ എന്ന് ഡെലിവറി ആകും? (When will my order be delivered?)",
      sender_role: "customer",
      sender_name: "Ananya Krishna"
    }
  });
  assert.strictEqual(customerMsgRes.status, 201);
  console.log("Customer text message sent:", customerMsgRes.data.message.content);

  // 4. Upload Audio Voice Note
  console.log("4. Testing POST /api/support/upload-audio...");
  const fakeAudioBase64 = Buffer.from("RIFF....WAVEfmt....data....").toString("base64");
  const audioUploadRes = await simulateRequest("/api/support/upload-audio", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      audio_data: fakeAudioBase64,
      format: "webm",
      duration: 3.2
    }
  });
  assert.strictEqual(audioUploadRes.status, 200);
  console.log("Audio uploaded to:", audioUploadRes.data.audio_url);
  assert(audioUploadRes.data.audio_url.startsWith("/uploads/audio/"));

  // 5. Send Audio Message
  console.log("5. Testing POST customer audio voice message...");
  const audioMsgRes = await simulateRequest("/api/support/threads/" + threadId + "/messages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      message_type: "audio",
      content: audioUploadRes.data.audio_url,
      audio_duration: 3.2,
      sender_role: "customer",
      sender_name: "Ananya Krishna"
    }
  });
  assert.strictEqual(audioMsgRes.status, 201);
  assert.strictEqual(audioMsgRes.data.message.message_type, "audio");
  console.log("Customer voice message posted successfully!");

  // 6. Support Executive Login & List Threads
  console.log("6. Testing Support Login & Thread Listing...");
  const loginRes = await simulateRequest("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { email: "support@shop.local", password: "support123" }
  });
  assert.strictEqual(loginRes.status, 200);
  const supportToken = loginRes.data.token;
  assert.strictEqual(loginRes.data.user.role, "support");

  const listThreadsRes = await simulateRequest("/api/support/threads", {
    headers: { authorization: "Bearer " + supportToken }
  });
  assert.strictEqual(listThreadsRes.status, 200);
  console.log("Support thread count:", listThreadsRes.data.threads.length);

  // 7. Support Executive replies to customer
  console.log("7. Testing Support Executive reply...");
  const supportReplyRes = await simulateRequest("/api/support/threads/" + threadId + "/messages", {
    method: "POST",
    headers: {
      authorization: "Bearer " + supportToken,
      "content-type": "application/json"
    },
    body: {
      message_type: "text",
      content: "താങ്കളുടെ ഓർഡർ ഇന്ന് വൈകുന്നേരം 4 മണിക്ക് മുൻപായി ഡെലിവറി ചെയ്യുന്നതാണ്!"
    }
  });
  assert.strictEqual(supportReplyRes.status, 201);
  assert.strictEqual(supportReplyRes.data.message.sender_role, "support");
  console.log("Support reply successfully posted!");

  // 8. Call Signaling: Start Call
  console.log("8. Testing Call Signaling: POST /api/support/call/start...");
  const callStartRes = await simulateRequest("/api/support/call/start", {
    method: "POST",
    headers: {
      authorization: "Bearer " + supportToken,
      "content-type": "application/json"
    },
    body: {
      thread_id: threadId,
      call_type: "video",
      offer_sdp: { type: "offer", sdp: "v=0..." }
    }
  });
  assert.strictEqual(callStartRes.status, 200);
  const callId = callStartRes.data.call_id;
  console.log("Call initiated, ID:", callId);

  // 9. Callee Checks Active Call
  console.log("9. Testing GET /api/support/call/active...");
  const activeCallRes = await simulateRequest("/api/support/call/active?thread_id=" + threadId);
  assert.strictEqual(activeCallRes.status, 200);
  assert.strictEqual(activeCallRes.data.active, true);

  // 10. Callee Answers Call
  console.log("10. Testing POST /api/support/call/answer...");
  const answerRes = await simulateRequest("/api/support/call/answer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      call_id: callId,
      answer_sdp: { type: "answer", sdp: "v=0..." }
    }
  });
  assert.strictEqual(answerRes.status, 200);

  // 11. ICE Candidates Exchange
  console.log("11. Testing POST /api/support/call/ice...");
  const iceRes = await simulateRequest("/api/support/call/ice", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      call_id: callId,
      candidate: { candidate: "candidate:1", sdpMid: "0" },
      sender_role: "customer"
    }
  });
  assert.strictEqual(iceRes.status, 200);

  // 12. Check Call Status
  console.log("12. Testing GET /api/support/call/:id/status...");
  const statusRes = await simulateRequest("/api/support/call/" + callId + "/status");
  assert.strictEqual(statusRes.status, 200);
  assert.strictEqual(statusRes.data.call.status, "connected");

  // 13. End Call
  console.log("13. Testing POST /api/support/call/end...");
  const endRes = await simulateRequest("/api/support/call/end", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { call_id: callId, status: "ended" }
  });
  assert.strictEqual(endRes.status, 200);
  assert.strictEqual(endRes.data.status, "ended");

  console.log("\n🎉 ALL 13 SUPPORT BACKEND TESTS PASSED WITH 100% SUCCESS!");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
