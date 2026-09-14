const { Readable, Writable } = require("node:stream");
const assert = require("node:assert");
const { handleRequest } = require("./server");

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
  console.log("=== Testing WebRTC Call Signaling Endpoints ===");

  // 1. Get or create a support thread
  const threadRes = await simulateRequest("/api/support/threads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { name: "Test User", phone: "9876543210" }
  });
  console.log("1. Thread created/fetched:", threadRes.status, threadRes.data?.thread?.id);
  assert.strictEqual(threadRes.status, 200);
  const threadId = threadRes.data.thread.id;

  // 2. Mobile starts call without initial offer
  const startRes = await simulateRequest("/api/support/call/start", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      thread_id: threadId,
      call_type: "video",
      caller_role: "customer",
      caller_name: "Test User"
    }
  });
  console.log("2. Call started (mobile):", startRes.status, startRes.data?.call_id, startRes.data?.status);
  assert.strictEqual(startRes.status, 200);
  assert.strictEqual(startRes.data.status, "ringing");
  const callId = startRes.data.call_id;

  // 3. Mobile posts offer to /api/support/call/offer
  const dummyOffer = { type: "offer", sdp: "v=0\r\no=customer 123 456 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0" };
  const offerRes = await simulateRequest("/api/support/call/offer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      call_id: callId,
      offer_sdp: dummyOffer
    }
  });
  console.log("3. Offer posted to /call/offer:", offerRes.status, offerRes.data);
  assert.strictEqual(offerRes.status, 200);

  // 4. Verify call status has the offer
  const statusRes1 = await simulateRequest(`/api/support/call/${callId}/status`);
  console.log("4. Status check 1:", statusRes1.status, statusRes1.data?.call?.offer_sdp ? "Offer Present ✅" : "No Offer ❌");
  assert.strictEqual(statusRes1.status, 200);
  assert(statusRes1.data.call.offer_sdp.includes("customer"));

  // 5. Support answers call via /api/support/call/answer
  const dummyAnswer = { type: "answer", sdp: "v=0\r\no=support 789 012 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0" };
  const answerRes = await simulateRequest("/api/support/call/answer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      call_id: callId,
      answer_sdp: dummyAnswer
    }
  });
  console.log("5. Answer posted:", answerRes.status, answerRes.data?.status);
  assert.strictEqual(answerRes.status, 200);
  assert.strictEqual(answerRes.data.status, "connected");

  // 6. Test ICE candidate upload and deduplication
  const dummyCandidate = { candidate: "candidate:1 1 UDP 2130706431 192.168.1.5 50000 typ host", sdpMid: "0", sdpMLineIndex: 0 };
  const iceRes1 = await simulateRequest("/api/support/call/ice", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      call_id: callId,
      candidate: dummyCandidate,
      sender_role: "customer"
    }
  });
  console.log("6a. ICE candidate 1 added:", iceRes1.status, iceRes1.data);
  assert.strictEqual(iceRes1.status, 200);

  // Duplicate candidate add should be deduplicated
  const iceRes2 = await simulateRequest("/api/support/call/ice", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      call_id: callId,
      candidate: dummyCandidate,
      sender_role: "customer"
    }
  });
  console.log("6b. ICE candidate duplicate added:", iceRes2.status, iceRes2.data);
  assert.strictEqual(iceRes2.status, 200);

  // Support candidate
  const dummyCandidate2 = { candidate: "candidate:2 1 UDP 2130706431 192.168.1.10 50001 typ host", sdpMid: "0", sdpMLineIndex: 0 };
  const iceRes3 = await simulateRequest("/api/support/call/ice", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      call_id: callId,
      candidate: dummyCandidate2,
      sender_role: "support"
    }
  });
  console.log("6c. ICE candidate 2 (support) added:", iceRes3.status, iceRes3.data);
  assert.strictEqual(iceRes3.status, 200);

  // Verify ICE candidates in status
  const statusRes2 = await simulateRequest(`/api/support/call/${callId}/status`);
  const storedCandidates = JSON.parse(statusRes2.data?.call?.ice_candidates || "[]");
  console.log("7. Stored ICE candidates count (should be 2, deduplicated):", storedCandidates.length);
  assert.strictEqual(storedCandidates.length, 2);
  console.log("   Deduplication Verified! ✅");

  // 8. Test Fallback: Offer sent to /answer directly
  const dummyOffer2 = { type: "offer", sdp: "v=0\r\no=fallback 999 888 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0" };
  const fallbackRes = await simulateRequest("/api/support/call/answer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      call_id: callId,
      offer_sdp: dummyOffer2
    }
  });
  console.log("8. Fallback offer to /answer:", fallbackRes.status, fallbackRes.data);
  assert.strictEqual(fallbackRes.status, 200);

  // 9. End Call
  const endRes = await simulateRequest("/api/support/call/end", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      call_id: callId,
      status: "ended"
    }
  });
  console.log("9. End Call:", endRes.status, endRes.data?.status);
  assert.strictEqual(endRes.status, 200);
  assert.strictEqual(endRes.data.status, "ended");

  console.log("\n=== ALL 9 SIGNALING TESTS PASSED! ===");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
