/**
 * Vipani Telephony Platform - Web Client SDK
 * Browser & Node.js client library for PSTN outbound dialing, call monitoring, and recording playback.
 * 
 * Usage in HTML:
 *   <script src="https://telephony.yourdomain.com/sdk/telephony-web-sdk.js"></script>
 *   <script>
 *     const client = new TelephonyClient({
 *       apiKey: "tp_live_...",
 *       serverUrl: "https://telephony.yourdomain.com"
 *     });
 *     const call = await client.makeCall({ to: "+919847123456" });
 *   </script>
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TelephonyClient = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  class TelephonyClient {
    /**
     * @param {Object} options
     * @param {string} options.apiKey - The project API Key (starts with tp_live_)
     * @param {string} [options.serverUrl] - Base URL of the telephony service (defaults to current origin in browser)
     * @param {string} [options.defaultCallerId] - Optional default CLI/Caller ID
     */
    constructor(options = {}) {
      if (!options.apiKey) {
        throw new Error("[TelephonyClient] apiKey is required to initialize SDK.");
      }
      this.apiKey = options.apiKey;
      this.serverUrl = options.serverUrl || (typeof window !== "undefined" ? window.location.origin : "http://localhost:8000");
      this.defaultCallerId = options.defaultCallerId || null;

      // Strip trailing slash
      this.serverUrl = this.serverUrl.replace(/\/+$/, "");
    }

    /**
     * Internal request helper
     */
    async _request(endpoint, method = "GET", body = null) {
      const url = `${this.serverUrl}${endpoint}`;
      const headers = {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey
      };

      const config = {
        method,
        headers
      };

      if (body) {
        config.body = JSON.stringify(body);
      }

      const res = await fetch(url, config);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = data.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(`[TelephonyClient] API Error: ${errorMsg}`);
      }

      return data;
    }

    /**
     * Format Indian phone numbers into standard E.164 (+91XXXXXXXXXX)
     * @param {string} phone
     * @returns {string}
     */
    static formatIndianPhone(phone) {
      const clean = String(phone || "").replace(/[^0-9]/g, "");
      if (clean.length === 10) {
        return "+91" + clean;
      } else if (clean.length === 12 && clean.startsWith("91")) {
        return "+" + clean;
      }
      return phone;
    }

    /**
     * Place an outbound PSTN call to any Indian mobile or landline
     * @param {Object} params
     * @param {string} params.to - Customer phone number (10-digit or E.164)
     * @param {string} [params.from] - Optional caller ID (overrides project default)
     * @param {string} [params.agentId] - Identifier of the customer care executive
     * @param {Object} [params.metadata] - Custom metadata (e.g. order_id, customer_name)
     * @returns {Promise<Object>} Call record details
     */
    async makeCall({ to, from, agentId, metadata }) {
      const formattedTo = TelephonyClient.formatIndianPhone(to);
      const payload = {
        to_number: formattedTo,
        from_number: from || this.defaultCallerId,
        agent_id: agentId || "web_agent",
        metadata: metadata || {}
      };

      const response = await this._request("/api/v1/calls/dial", "POST", payload);
      return response.call;
    }

    /**
     * Terminate / hangup an active call
     * @param {string} callId - Call ID or FreeSWITCH UUID
     * @returns {Promise<Object>}
     */
    async hangupCall(callId) {
      if (!callId) throw new Error("callId is required to hangup.");
      return await this._request("/api/v1/calls/hangup", "POST", { call_id: callId });
    }

    /**
     * Fetch call details and current status
     * @param {string} callId
     * @returns {Promise<Object>}
     */
    async getCall(callId) {
      if (!callId) throw new Error("callId is required.");
      const response = await this._request(`/api/v1/calls/${callId}`, "GET");
      return response.call;
    }

    /**
     * List recent calls for this project
     * @param {Object} [filters]
     * @param {number} [filters.limit=50]
     * @param {number} [filters.offset=0]
     * @param {string} [filters.status] - Filter by: ringing, answered, completed, failed
     * @returns {Promise<Array>}
     */
    async listCalls({ limit = 50, offset = 0, status = null } = {}) {
      let query = `?limit=${limit}&offset=${offset}`;
      if (status) query += `&status=${encodeURIComponent(status)}`;
      const response = await this._request(`/api/v1/calls${query}`, "GET");
      return response.calls || [];
    }

    /**
     * Get the direct streaming URL for a call recording
     * @param {string} callId
     * @returns {string} URL suitable for HTML5 <audio> element src
     */
    getRecordingUrl(callId) {
      return `${this.serverUrl}/api/v1/recordings/${callId}/stream`;
    }

    /**
     * Utility: Poll call status until call reaches a terminal state (completed, failed, busy)
     * @param {string} callId
     * @param {Object} [options]
     * @param {number} [options.intervalMs=1500] - Polling interval
     * @param {number} [options.timeoutMs=120000] - Max polling time
     * @param {Function} [options.onUpdate] - Callback on each status tick
     * @returns {Promise<Object>} Final call record
     */
    async pollUntilFinished(callId, { intervalMs = 1500, timeoutMs = 120000, onUpdate = null } = {}) {
      const startTime = Date.now();
      const terminalStates = ["completed", "failed", "busy", "no-answer"];

      while (Date.now() - startTime < timeoutMs) {
        const call = await this.getCall(callId);
        if (typeof onUpdate === "function") {
          onUpdate(call);
        }
        if (terminalStates.includes(call.status)) {
          return call;
        }
        await new Promise(r => setTimeout(r, intervalMs));
      }

      throw new Error(`[TelephonyClient] Polling timed out after ${timeoutMs / 1000}s`);
    }
  }

  return TelephonyClient;
}));
