
// ==========================================
// Vipani Support Executive Console Logic
// ==========================================

const API_BASE = "";
let currentToken = localStorage.getItem("support_token") || localStorage.getItem("admin_token") || "";
let currentUser = null;
let activeThread = null;
let allThreads = [];
let pollInterval = null;
let callPollInterval = null;

// MediaRecorder State
let mediaRecorder = null;
let audioChunks = [];
let recordStartTime = 0;
let recordTimerInterval = null;

// WebRTC Call State
let peerConnection = null;
let localStream = null;
let currentCall = null;
let callTimerInterval = null;
let isMicMuted = false;
let isCamOff = false;

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
  ]
};

let processedCandidates = new Set();
let pendingRemoteCandidates = [];
let localIceQueue = [];

async function drainPendingRemoteCandidates() {
  if (!peerConnection || !peerConnection.remoteDescription) return;
  while (pendingRemoteCandidates.length > 0) {
    const candidate = pendingRemoteCandidates.shift();
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch(e) {
      console.warn("Support addIceCandidate error:", e);
    }
  }
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  await checkAuth();
});

async function checkAuth() {
  if (!currentToken) {
    promptLogin();
    return;
  }
  try {
    const res = await fetch("/api/auth/me", {
      headers: { "Authorization": "Bearer " + currentToken }
    });
    if (!res.ok) {
      promptLogin();
      return;
    }
    const data = await res.json();
    currentUser = data.user;
    if (currentUser.role !== "support" && currentUser.role !== "admin") {
      alert("ഈ പേജ് സപ്പോർട്ട് എക്സിക്യൂട്ടീവുകൾക്ക് മാത്രമുള്ളതാണ്. (Support access required)");
      promptLogin();
      return;
    }

    document.getElementById("agent-display-name").textContent = currentUser.name || "സപ്പോർട്ട് എക്സിക്യൂട്ടീവ്";
    loadThreads();
    startBackgroundPoll();
  } catch (err) {
    console.error("Auth check failed:", err);
    promptLogin();
  }
}

function promptLogin() {
  const email = prompt("സപ്പോർട്ട് ഇമെയിൽ നൽകുക (Default: support@shop.local):", "support@shop.local");
  if (!email) return;
  const password = prompt("പാസ്‌വേഡ് നൽകുക (Default: support123):", "support123");
  if (!password) return;

  fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.token) {
      localStorage.setItem("support_token", data.token);
      currentToken = data.token;
      currentUser = data.user;
      checkAuth();
    } else {
      alert(data.error || "ലോഗിൻ പരാജയപ്പെട്ടു");
    }
  })
  .catch(err => {
    alert("Login error: " + err.message);
  });
}

// --- Threads Management ---
async function loadThreads() {
  try {
    const res = await fetch("/api/support/threads", {
      headers: { "Authorization": "Bearer " + currentToken }
    });
    if (!res.ok) return;
    const data = await res.json();
    allThreads = data.threads || [];
    renderThreadsList(allThreads);
  } catch (err) {
    console.error("Failed to load threads:", err);
  }
}

function renderThreadsList(threads) {
  const container = document.getElementById("threads-container");
  if (!threads || threads.length === 0) {
    container.innerHTML = `<div style="padding: 2rem; text-align: center; color: #94a3b8; font-size: 0.9rem;">
      നിലവിൽ പുതിയ ചാറ്റുകൾ ലഭ്യമല്ല. (No active customer chats)
    </div>`;
    return;
  }

  container.innerHTML = threads.map(t => {
    const initial = (t.customer_name || "C").charAt(0).toUpperCase();
    const isActive = activeThread && activeThread.id === t.id;
    let snippet = "ചാറ്റ് ആരംഭിച്ചു...";
    let timeStr = "";
    if (t.last_message) {
      snippet = t.last_message.message_type === "audio" ? "🎙️ ഓഡിയോ സന്ദേശം (Voice note)" : t.last_message.content;
      try {
        const d = new Date(t.last_message.created_at);
        timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } catch(e) {}
    }

    return `
      <div class="thread-item ${isActive ? "active" : ""}" onclick="selectThread(${t.id})">
        <div class="thread-avatar">${initial}</div>
        <div class="thread-info">
          <div class="thread-top">
            <span class="thread-name">${escapeHtml(t.customer_name || "Customer")}</span>
            <span class="thread-time">${timeStr}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="thread-snippet">${escapeHtml(snippet)}</span>
            ${t.unread_count > 0 ? `<span class="thread-unread-badge">${t.unread_count}</span>` : ""}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

window.selectThread = async function(threadId) {
  const thread = allThreads.find(t => t.id === threadId);
  if (!thread) return;
  activeThread = thread;
  renderThreadsList(allThreads);

  document.getElementById("no-chat-selected").style.display = "none";
  const chatWrap = document.getElementById("active-chat-wrap");
  chatWrap.style.display = "flex";

  document.getElementById("active-user-avatar").textContent = (thread.customer_name || "C").charAt(0).toUpperCase();
  document.getElementById("active-user-name").textContent = thread.customer_name || "Customer";
  document.getElementById("active-user-phone").textContent = "📞 " + (thread.customer_phone || "Not specified");

  await loadMessages();
};

async function loadMessages() {
  if (!activeThread) return;
  try {
    const res = await fetch(`/api/support/threads/${activeThread.id}/messages`, {
      headers: { "Authorization": "Bearer " + currentToken }
    });
    if (!res.ok) return;
    const data = await res.json();
    renderMessages(data.messages || []);
  } catch (err) {
    console.error("Failed to load messages:", err);
  }
}

function renderMessages(messages) {
  const feed = document.getElementById("messages-feed");
  const wasScrolledToBottom = feed.scrollHeight - feed.clientHeight <= feed.scrollTop + 60;

  feed.innerHTML = messages.map(m => {
    const isSupport = m.sender_role === "support";
    let timeStr = "";
    try {
      const d = new Date(m.created_at);
      timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch(e) {}

    let contentHtml = "";
    if (m.message_type === "audio") {
      contentHtml = `
        <div class="audio-player-box">
          <audio controls preload="metadata">
            <source src="${m.content}" type="audio/webm">
            <source src="${m.content}" type="audio/wav">
            <source src="${m.content}" type="audio/mp4">
            നിങ്ങളുടെ ബ്രൗസർ ഓഡിയോ പിന്തുണയ്ക്കുന്നില്ല.
          </audio>
        </div>
      `;
    } else {
      contentHtml = escapeHtml(m.content);
    }

    return `
      <div class="msg-row ${isSupport ? "support" : "customer"}">
        <div class="msg-bubble">
          ${contentHtml}
        </div>
        <div class="msg-meta">
          <span>${escapeHtml(m.sender_name || (isSupport ? "Support" : "Customer"))}</span>
          <span>•</span>
          <span>${timeStr}</span>
        </div>
      </div>
    `;
  }).join("");

  if (wasScrolledToBottom || feed.children.length <= messages.length) {
    feed.scrollTop = feed.scrollHeight;
  }
}

// --- Sending Text Message ---
async function sendTextMessage() {
  if (!activeThread) return;
  const input = document.getElementById("chat-msg-input");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  try {
    const res = await fetch(`/api/support/threads/${activeThread.id}/messages`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + currentToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message_type: "text",
        content: text
      })
    });
    if (res.ok) {
      await loadMessages();
      loadThreads();
    }
  } catch (err) {
    console.error("Failed to send text message:", err);
  }
}

// --- Voice Recording ---
async function startVoiceRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
    };

    mediaRecorder.start();
    recordStartTime = Date.now();
    document.getElementById("text-composer-mode").style.display = "none";
    document.getElementById("voice-recording-mode").style.display = "flex";

    recordTimerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordStartTime) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const secs = String(elapsed % 60).padStart(2, "0");
      document.getElementById("recording-timer").textContent = `${mins}:${secs}`;
    }, 500);

  } catch (err) {
    alert("മൈക്രോഫോൺ അനുമതി ലഭിച്ചില്ല (Microphone access denied): " + err.message);
  }
}

function cancelVoiceRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  clearInterval(recordTimerInterval);
  audioChunks = [];
  document.getElementById("voice-recording-mode").style.display = "none";
  document.getElementById("text-composer-mode").style.display = "flex";
}

async function finishAndSendVoiceRecording() {
  if (!mediaRecorder || mediaRecorder.state === "inactive") return;
  clearInterval(recordTimerInterval);
  const durationSec = Math.max(1, Math.round((Date.now() - recordStartTime) / 1000));

  mediaRecorder.onstop = async () => {
    const blob = new Blob(audioChunks, { type: "audio/webm" });
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64Audio = reader.result;
      try {
        const uploadRes = await fetch("/api/support/upload-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audio_data: base64Audio,
            format: "webm",
            duration: durationSec
          })
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.audio_url) {
          await fetch(`/api/support/threads/${activeThread.id}/messages`, {
            method: "POST",
            headers: {
              "Authorization": "Bearer " + currentToken,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              message_type: "audio",
              content: uploadData.audio_url,
              audio_duration: durationSec
            })
          });
          await loadMessages();
          loadThreads();
        }
      } catch (err) {
        console.error("Audio send error:", err);
      }
    };
  };

  mediaRecorder.stop();
  document.getElementById("voice-recording-mode").style.display = "none";
  document.getElementById("text-composer-mode").style.display = "flex";
}

// --- Calling & WebRTC ---
async function initiateCall(callType) {
  if (!activeThread) return;

  processedCandidates.clear();
  pendingRemoteCandidates = [];
  localIceQueue = [];

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === "video"
    });

    setupCallModal(callType, activeThread.customer_name || "Customer");

    // Setup WebRTC PeerConnection
    peerConnection = new RTCPeerConnection(rtcConfig);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = event => {
      console.log("Support WebRTC ontrack:", event.track ? event.track.kind : "unknown", event.streams);
      const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
      const remoteAudio = document.getElementById("remote-audio");
      if (remoteAudio) {
        remoteAudio.srcObject = stream;
        remoteAudio.play().catch(e => console.log("Audio autoplay error:", e));
      }
      const remoteVideo = document.getElementById("remote-video");
      if (remoteVideo) {
        remoteVideo.srcObject = stream;
        remoteVideo.play().catch(e => console.log("Video autoplay error:", e));
      }
    };

    // Register onicecandidate BEFORE creating offer to avoid losing initial candidates
    peerConnection.onicecandidate = e => {
      if (e.candidate) {
        if (currentCall && currentCall.call_id) {
          fetch("/api/support/call/ice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              call_id: currentCall.call_id,
              candidate: e.candidate,
              sender_role: "support"
            })
          }).catch(err => console.error("ICE candidate send failed:", err));
        } else {
          localIceQueue.push(e.candidate);
        }
      }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const startRes = await fetch("/api/support/call/start", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + currentToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        thread_id: activeThread.id,
        call_type: callType,
        offer_sdp: offer
      })
    });
    const callData = await startRes.json();
    currentCall = callData;

    // Immediately flush any buffered candidates that gathered during setLocalDescription
    while (localIceQueue.length > 0) {
      const cand = localIceQueue.shift();
      fetch("/api/support/call/ice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call_id: currentCall.call_id,
          candidate: cand,
          sender_role: "support"
        })
      }).catch(err => console.error("ICE flush failed:", err));
    }

    startCallStatusPolling();

  } catch (err) {
    console.error("Call initiate error:", err);
    showCallEndedNotification("കോൾ ആരംഭിക്കാൻ സാധിച്ചില്ല", err.message, "⚠️");
  }
}

function setupCallModal(callType, participantName) {
  document.getElementById("call-modal").style.display = "flex";
  const isVideo = callType === "video";
  const remoteVideo = document.getElementById("remote-video");
  const localVideoWrap = document.getElementById("local-video-wrap");
  const localVideo = document.getElementById("local-video");
  const audioPlaceholder = document.getElementById("audio-call-placeholder");
  const btnToggleCam = document.getElementById("btn-toggle-cam");
  const callToast = document.getElementById("call-toast-overlay");

  if (callToast) callToast.style.display = "none";

  const headerName = document.getElementById("call-header-name");
  if (headerName) headerName.textContent = participantName;
  const headerStatus = document.getElementById("call-header-status");
  if (headerStatus) headerStatus.textContent = "കണക്റ്റ് ആയി (Connected)";

  if (isVideo) {
    audioPlaceholder.style.display = "none";
    remoteVideo.style.display = "block";
    if (localVideoWrap) localVideoWrap.style.display = "flex";
    if (btnToggleCam) btnToggleCam.style.display = "flex";
    localVideo.srcObject = localStream;
    localVideo.play().catch(() => {});
  } else {
    remoteVideo.style.display = "none";
    if (localVideoWrap) localVideoWrap.style.display = "none";
    if (btnToggleCam) btnToggleCam.style.display = "none";
    audioPlaceholder.style.display = "flex";
    document.getElementById("call-participant-name").textContent = participantName;
  }

  let seconds = 0;
  clearInterval(callTimerInterval);
  callTimerInterval = setInterval(() => {
    seconds++;
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    document.getElementById("call-active-timer").textContent = `${mins}:${secs}`;
  }, 1000);
}

function showCallEndedNotification(title, sub, icon = "📞") {
  const toast = document.getElementById("call-toast-overlay");
  if (toast) {
    const iconEl = document.getElementById("call-toast-icon");
    if (iconEl) iconEl.textContent = icon;
    const titleEl = document.getElementById("call-toast-title");
    if (titleEl) titleEl.textContent = title || "കോൾ അവസാനിച്ചു";
    const subEl = document.getElementById("call-toast-sub");
    if (subEl) subEl.textContent = sub || "Call Ended";
    toast.style.display = "flex";
  }
  clearInterval(callPollInterval);
  clearInterval(callTimerInterval);
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
  }
  setTimeout(() => {
    cleanupCall();
  }, 1300);
}

function startCallStatusPolling() {
  clearInterval(callPollInterval);
  callPollInterval = setInterval(async () => {
    if (!currentCall) return;
    try {
      const res = await fetch(`/api/support/call/${currentCall.call_id}/status`);
      if (!res.ok) return;
      const data = await res.json();
      const call = data.call;

      if (call.status === "ended" || call.status === "declined") {
        showCallEndedNotification("കോൾ അവസാനിച്ചു", "ഉപഭോക്താവ് കോൾ അവസാനിപ്പിച്ചു (Customer ended call)");
        return;
      }

      if (call.status === "connected" && call.answer_sdp && peerConnection && !peerConnection.currentRemoteDescription) {
        let answerObj = null;
        try {
          answerObj = typeof call.answer_sdp === "string" ? JSON.parse(call.answer_sdp) : call.answer_sdp;
        } catch(e) { answerObj = call.answer_sdp; }

        if (answerObj && answerObj.sdp) {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answerObj));
          await drainPendingRemoteCandidates();
        }
      }

      // Add remote ICE candidates safely with deduplication and queueing
      if (call.ice_candidates && peerConnection) {
        let candidates = [];
        try { candidates = JSON.parse(call.ice_candidates); } catch(e) {}
        for (const c of candidates) {
          if (c.sender_role === "customer" && c.candidate) {
            const candKey = typeof c.candidate === "object" ? (c.candidate.candidate || JSON.stringify(c.candidate)) : String(c.candidate);
            if (!processedCandidates.has(candKey)) {
              processedCandidates.add(candKey);
              if (peerConnection.remoteDescription) {
                try {
                  await peerConnection.addIceCandidate(new RTCIceCandidate(c.candidate));
                } catch(e) {}
              } else {
                pendingRemoteCandidates.push(c.candidate);
              }
            }
          }
        }
      }

    } catch (err) {
      console.error("Call polling error:", err);
    }
  }, 1000);
}

async function answerIncomingCall(call) {
  currentCall = { call_id: call.id, ...call };
  document.getElementById("incoming-call-banner").style.display = "none";
  stopRingtone();

  processedCandidates.clear();
  pendingRemoteCandidates = [];
  localIceQueue = [];

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: call.call_type === "video"
    });

    setupCallModal(call.call_type, call.caller_name || "Customer");

    peerConnection = new RTCPeerConnection(rtcConfig);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = event => {
      console.log("Support WebRTC ontrack (incoming):", event.track ? event.track.kind : "unknown", event.streams);
      const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
      const remoteAudio = document.getElementById("remote-audio");
      if (remoteAudio) {
        remoteAudio.srcObject = stream;
        remoteAudio.play().catch(e => console.log("Audio autoplay error:", e));
      }
      const remoteVideo = document.getElementById("remote-video");
      if (remoteVideo) {
        remoteVideo.srcObject = stream;
        remoteVideo.play().catch(e => console.log("Video autoplay error:", e));
      }
    };

    peerConnection.onicecandidate = e => {
      if (e.candidate) {
        fetch("/api/support/call/ice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            call_id: currentCall.call_id,
            candidate: e.candidate,
            sender_role: "support"
          })
        }).catch(err => console.error("ICE send failed:", err));
      }
    };

    // If caller hasn't uploaded offer yet, poll for up to 10 seconds
    let offerSdp = call.offer_sdp;
    if (!offerSdp) {
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 500));
        const checkRes = await fetch(`/api/support/call/${currentCall.call_id}/status`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.call && checkData.call.offer_sdp) {
            offerSdp = checkData.call.offer_sdp;
            break;
          }
        }
      }
    }

    if (offerSdp) {
      let offerObj = null;
      try { offerObj = typeof offerSdp === "string" ? JSON.parse(offerSdp) : offerSdp; } catch(e) { offerObj = offerSdp; }
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offerObj));
      await drainPendingRemoteCandidates();

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      await fetch("/api/support/call/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call_id: currentCall.call_id,
          answer_sdp: answer
        })
      });
    } else {
      throw new Error("കസ്റ്റമറുടെ WebRTC ഓഫർ ലഭിച്ചില്ല (Offer SDP timed out)");
    }

    startCallStatusPolling();

  } catch (err) {
    console.error("Answer call error:", err);
    showCallEndedNotification("കണക്ട് ചെയ്യാൻ സാധിച്ചില്ല", err.message, "⚠️");
  }
}

async function endCurrentCall() {
  if (currentCall) {
    try {
      fetch("/api/support/call/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ call_id: currentCall.call_id, status: "ended" })
      });
    } catch(e) {}
  }
  showCallEndedNotification("കോൾ അവസാനിപ്പിച്ചു", "Call ended by Support");
}

function cleanupCall() {
  clearInterval(callPollInterval);
  clearInterval(callTimerInterval);
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
  }
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  processedCandidates.clear();
  pendingRemoteCandidates = [];
  localIceQueue = [];
  currentCall = null;
  document.getElementById("call-modal").style.display = "none";
  document.getElementById("incoming-call-banner").style.display = "none";
  const toast = document.getElementById("call-toast-overlay");
  if (toast) toast.style.display = "none";
  stopRingtone();
}

// --- Outbound PSTN Calling via Airtel IQ Telephony Gateway ---
async function initiatePstnCall() {
  if (!activeThread) {
    alert("ദയവായി ഒരു കസ്റ്റമർ ചാറ്റ് തിരഞ്ഞെടുക്കുക. (Please select a customer thread first)");
    return;
  }

  let defaultPhone = activeThread.customer_phone || "";
  let cleanDigits = defaultPhone.replace(/[^0-9]/g, "");
  let promptDefault = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : "9847123456";

  let customerPhone = prompt(
    "കസ്റ്റമറെ നേരിട്ട് മൊബൈൽ ഫോണിൽ വിളിക്കുക (PSTN Call via Airtel IQ)\n\nകസ്റ്റമറുടെ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക:",
    promptDefault
  );

  if (!customerPhone) return;

  customerPhone = customerPhone.trim().replace(/[^0-9]/g, "");
  if (customerPhone.length < 10) {
    alert("സാധുവായ 10 അക്ക ഫോൺ നമ്പർ നൽകുക. (Invalid 10-digit phone number)");
    return;
  }

  const formattedNumber = "+91" + customerPhone.slice(-10);
  const telephonyServerUrl = localStorage.getItem("telephony_server_url") || "http://localhost:8000";
  const apiKey = localStorage.getItem("telephony_api_key") || "tp_live_vipani_shop_key_2026";

  if (typeof TelephonyClient === "undefined") {
    alert("Telephony SDK not loaded. Ensure telephony-web-sdk.js is available.");
    return;
  }

  const client = new TelephonyClient({
    apiKey: apiKey,
    serverUrl: telephonyServerUrl
  });

  const pstnBtn = document.getElementById("start-pstn-call-btn");
  const originalText = pstnBtn ? pstnBtn.innerHTML : "";
  if (pstnBtn) {
    pstnBtn.disabled = true;
    pstnBtn.innerHTML = "<span>⏳ വിളിക്കുന്നു...</span>";
  }

  try {
    const call = await client.makeCall({
      to: formattedNumber,
      agentId: currentUser ? (currentUser.name || currentUser.id) : "support_agent",
      metadata: {
        thread_id: activeThread.id,
        customer_name: activeThread.customer_name || "Customer"
      }
    });

    if (pstnBtn) {
      pstnBtn.innerHTML = "<span>🔔 റിംഗ് ചെയ്യുന്നു...</span>";
    }

    // Post call start notice into thread chat
    if (activeThread) {
      await fetch(`/api/support/threads/${activeThread.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + currentToken
        },
        body: JSON.stringify({
          text: `📱 [മൊബൈൽ കോൾ ആരംഭിച്ചു / PSTN Call Initiated]\nഫോൺ നമ്പർ: ${formattedNumber}\nകോൾ ഐഡി: ${call.id}\nറൂട്ട്: Airtel IQ SIP Trunk (FreeSWITCH)`,
          type: "text"
        })
      });
      loadMessages();
    }

    // Monitor call status in background
    client.pollUntilFinished(call.id, {
      intervalMs: 2000,
      timeoutMs: 120000,
      onUpdate: (updatedCall) => {
        if (pstnBtn && updatedCall.status === "answered") {
          pstnBtn.innerHTML = "<span>🟢 സംസാരിക്കുന്നു...</span>";
        }
      }
    }).then(async (finalCall) => {
      if (pstnBtn) {
        pstnBtn.disabled = false;
        pstnBtn.innerHTML = originalText;
      }

      const durText = finalCall.duration_sec ? `${finalCall.duration_sec} സെക്കൻഡ്` : "പൂർത്തിയായി";
      alert(`✅ മൊബൈൽ കോൾ അവസാനിച്ചു.\nദൈർഘ്യം: ${durText}\nഓഡിയോ റെക്കോർഡിംഗ് സെർവറിൽ സുരക്ഷിതമായി സൂക്ഷിച്ചിരിക്കുന്നു.`);

      if (activeThread) {
        await fetch(`/api/support/threads/${activeThread.id}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + currentToken
          },
          body: JSON.stringify({
            text: `📞 [മൊബൈൽ കോൾ പൂർത്തിയായി / PSTN Call Completed]\nദൈർഘ്യം: ${finalCall.duration_sec || 0} സെക്കൻഡ്\nസ്റ്റാറ്റസ്: ${finalCall.status}\n🎙️ കോൾ റെക്കോർഡിംഗ് Vipani Telephony Dashboard-ൽ ലഭ്യമാണ്.`,
            type: "text"
          })
        });
        loadMessages();
      }
    }).catch(() => {
      if (pstnBtn) {
        pstnBtn.disabled = false;
        pstnBtn.innerHTML = originalText;
      }
    });

  } catch (err) {
    alert("കോൾ ആരംഭിക്കാൻ കഴിഞ്ഞില്ല: " + err.message);
    if (pstnBtn) {
      pstnBtn.disabled = false;
      pstnBtn.innerHTML = originalText;
    }
  }
}

function playRingtone() {
  // Simple visual & audio alert
}
function stopRingtone() {}

// --- Background Polling for Real-Time Experience ---
function startBackgroundPoll() {
  setInterval(async () => {
    // 1. Refresh threads & messages
    if (activeThread) {
      loadMessages();
      
      // Check for incoming call on active thread if not already in call
      if (!currentCall) {
        try {
          const res = await fetch(`/api/support/call/active?thread_id=${activeThread.id}`);
          const data = await res.json();
          if (data.active && data.call && data.call.caller_role === "customer" && data.call.status === "ringing") {
            showIncomingCallAlert(data.call);
          }
        } catch(e) {}
      }
    }
    loadThreads();
  }, 2500);
}

function showIncomingCallAlert(call) {
  const banner = document.getElementById("incoming-call-banner");
  if (banner.style.display === "flex") return; // already showing
  
  banner.style.display = "flex";
  document.getElementById("incoming-call-icon").textContent = call.call_type === "video" ? "📹" : "📞";
  document.getElementById("incoming-caller-title").textContent = `ഇൻകമിംഗ് ${call.call_type === "video" ? "വീഡിയോ" : "ഓഡിയോ"} കോൾ!`;
  document.getElementById("incoming-caller-sub").textContent = `${call.caller_name || "കസ്റ്റമർ"} വിളിക്കുന്നു...`;

  document.getElementById("btn-accept-call").onclick = () => answerIncomingCall(call);
  document.getElementById("btn-decline-call").onclick = async () => {
    banner.style.display = "none";
    try {
      await fetch("/api/support/call/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ call_id: call.id, status: "declined" })
      });
    } catch(e) {}
  };
}

// --- Setup Listeners ---
function setupEventListeners() {
  document.getElementById("chat-send-btn").addEventListener("click", sendTextMessage);
  document.getElementById("chat-msg-input").addEventListener("keydown", e => {
    if (e.key === "Enter") sendTextMessage();
  });

  // Voice Note Buttons
  document.getElementById("voice-record-btn").addEventListener("click", startVoiceRecording);
  document.getElementById("cancel-voice-btn").addEventListener("click", cancelVoiceRecording);
  document.getElementById("send-voice-btn").addEventListener("click", finishAndSendVoiceRecording);

  // Calling Buttons
  document.getElementById("start-audio-call-btn").addEventListener("click", () => initiateCall("audio"));
  document.getElementById("start-video-call-btn").addEventListener("click", () => initiateCall("video"));
  const pstnBtn = document.getElementById("start-pstn-call-btn");
  if (pstnBtn) {
    pstnBtn.addEventListener("click", initiatePstnCall);
  }
  document.getElementById("refresh-chat-btn").addEventListener("click", () => {
    loadMessages();
    loadThreads();
  });

  // Call Window Controls
  document.getElementById("btn-end-call").addEventListener("click", endCurrentCall);
  document.getElementById("btn-toggle-mic").addEventListener("click", () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        isMicMuted = !audioTrack.enabled;
        document.getElementById("btn-toggle-mic").classList.toggle("active", isMicMuted);
      }
    }
  });
  document.getElementById("btn-toggle-cam").addEventListener("click", () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        isCamOff = !videoTrack.enabled;
        document.getElementById("btn-toggle-cam").classList.toggle("active", isCamOff);
      }
    }
  });

  // Search threads
  document.getElementById("thread-search").addEventListener("input", e => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderThreadsList(allThreads);
      return;
    }
    const filtered = allThreads.filter(t =>
      (t.customer_name && t.customer_name.toLowerCase().includes(q)) ||
      (t.customer_phone && t.customer_phone.includes(q))
    );
    renderThreadsList(filtered);
  });

  // Logout
  document.getElementById("sup-logout-btn").addEventListener("click", () => {
    localStorage.removeItem("support_token");
    window.location.reload();
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
