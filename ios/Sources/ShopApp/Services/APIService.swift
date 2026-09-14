import Foundation

public final class APIService: @unchecked Sendable {
    public static let shared = APIService()

    public static let defaultBaseURL: String = "https://shop-platform-ky2m.onrender.com/api"
    private static let baseURLKey = "api_base_url"

    public var baseURL: String

    private let session: URLSession

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 15
        self.session = URLSession(configuration: config)
        self.baseURL = UserDefaults.standard.string(forKey: Self.baseURLKey) ?? Self.defaultBaseURL
    }

    public func setBaseURL(_ url: String) {
        var clean = url.trimmingCharacters(in: .whitespacesAndNewlines)
        if clean.isEmpty {
            clean = Self.defaultBaseURL
        }
        if clean.hasSuffix("/") {
            clean = String(clean.dropLast())
        }
        if !clean.hasSuffix("/api") {
            clean += "/api"
        }
        self.baseURL = clean
        UserDefaults.standard.set(clean, forKey: Self.baseURLKey)
    }

    public func resetBaseURL() {
        self.baseURL = Self.defaultBaseURL
        UserDefaults.standard.set(Self.defaultBaseURL, forKey: Self.baseURLKey)
    }

    // MARK: - Categories
    public func fetchCategories() async throws -> [Category] {
        guard let url = URL(string: "\(baseURL)/categories") else {
            throw URLError(.badURL)
        }
        let (data, response) = try await session.data(from: url)
        try validateResponse(response)
        return try JSONDecoder().decode([Category].self, from: data)
    }

    // MARK: - Products
    public func fetchProducts(categoryId: Int? = nil, search: String? = nil, sort: String? = nil) async throws -> [Product] {
        var components = URLComponents(string: "\(baseURL)/products")
        var queryItems: [URLQueryItem] = []
        if let cat = categoryId, cat > 0 {
            queryItems.append(URLQueryItem(name: "category", value: String(cat)))
        }
        if let s = search, !s.isEmpty {
            queryItems.append(URLQueryItem(name: "search", value: s))
        }
        if let sort = sort, !sort.isEmpty {
            queryItems.append(URLQueryItem(name: "sort", value: sort))
        }
        if !queryItems.isEmpty {
            components?.queryItems = queryItems
        }

        guard let url = components?.url else {
            throw URLError(.badURL)
        }

        let (data, response) = try await session.data(from: url)
        try validateResponse(response)
        return try JSONDecoder().decode([Product].self, from: data)
    }

    // MARK: - OTP Auth
    public func sendOtp(phone: String, deviceId: String) async throws -> SendOtpResponse {
        guard let url = URL(string: "\(baseURL)/auth/send-otp") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let payload = ["phone": phone, "device_id": deviceId]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        return try JSONDecoder().decode(SendOtpResponse.self, from: data)
    }

    public func verifyOtp(phone: String, otp: String, name: String, deviceId: String) async throws -> VerifyOtpResponse {
        guard let url = URL(string: "\(baseURL)/auth/verify-otp") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let payload = [
            "phone": phone,
            "otp": otp,
            "name": name,
            "device_id": deviceId
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        return try JSONDecoder().decode(VerifyOtpResponse.self, from: data)
    }

    // MARK: - User Profile
    public func fetchUserProfile(token: String) async throws -> UserProfile {
        guard let url = URL(string: "\(baseURL)/user/profile") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        return try JSONDecoder().decode(UserProfile.self, from: data)
    }

    public func updateUserProfile(token: String, name: String, email: String, address: String, city: String, pincode: String) async throws -> UserProfile {
        guard let url = URL(string: "\(baseURL)/user/profile") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let payload = [
            "name": name,
            "email": email,
            "address": address,
            "city": city,
            "pincode": pincode
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        return try JSONDecoder().decode(UserProfile.self, from: data)
    }

    // MARK: - Orders
    public func createOrder(token: String?, orderData: [String: Any]) async throws -> OrderCreateResponse {
        guard let url = URL(string: "\(baseURL)/orders") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let t = token, !t.isEmpty {
            request.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = try JSONSerialization.data(withJSONObject: orderData)

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        return try JSONDecoder().decode(OrderCreateResponse.self, from: data)
    }

    public func fetchUserOrders(token: String) async throws -> [Order] {
        guard let url = URL(string: "\(baseURL)/user/orders") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        return try JSONDecoder().decode([Order].self, from: data)
    }

    public func fetchOrderDetails(orderId: String) async throws -> Order {
        guard let url = URL(string: "\(baseURL)/orders/\(orderId)") else {
            throw URLError(.badURL)
        }
        let (data, response) = try await session.data(from: url)
        try validateResponse(response)
        return try JSONDecoder().decode(Order.self, from: data)
    }

    // MARK: - Customer Care Support
    public func getOrCreateSupportThread(name: String, phone: String, token: String?) async throws -> SupportThread {
        guard let url = URL(string: "\(baseURL)/support/threads") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let t = token, !t.isEmpty {
            request.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization")
        }
        let payload = ["name": name, "phone": phone]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        let res = try JSONDecoder().decode(SupportThreadResponse.self, from: data)
        return res.thread
    }

    public func fetchSupportMessages(threadId: Int, token: String?) async throws -> [SupportMessage] {
        guard let url = URL(string: "\(baseURL)/support/threads/\(threadId)/messages") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        if let t = token, !t.isEmpty {
            request.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization")
        }
        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        let res = try JSONDecoder().decode(SupportMessagesResponse.self, from: data)
        return res.messages
    }

    public func sendSupportMessage(threadId: Int, content: String, type: String = "text", duration: Double = 0, token: String?, senderName: String) async throws -> SupportMessage {
        guard let url = URL(string: "\(baseURL)/support/threads/\(threadId)/messages") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let t = token, !t.isEmpty {
            request.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization")
        }
        let payload: [String: Any] = [
            "message_type": type,
            "content": content,
            "audio_duration": duration,
            "sender_role": "customer",
            "sender_name": senderName
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        struct SendMsgRes: Codable {
            let success: Bool
            let message: SupportMessage
        }
        let res = try JSONDecoder().decode(SendMsgRes.self, from: data)
        return res.message
    }

    public func uploadVoiceNote(base64Audio: String, format: String = "m4a", duration: Double = 0) async throws -> String {
        guard let url = URL(string: "\(baseURL)/support/upload-audio") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let payload: [String: Any] = [
            "audio_data": base64Audio,
            "format": format,
            "duration": duration
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        let res = try JSONDecoder().decode(SupportAudioUploadResponse.self, from: data)
        return res.audio_url
    }

    public func startSupportCall(threadId: Int, callType: String, callerName: String, token: String?) async throws -> SupportCallSession {
        guard let url = URL(string: "\(baseURL)/support/call/start") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let t = token, !t.isEmpty {
            request.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization")
        }
        let payload: [String: Any] = [
            "thread_id": threadId,
            "call_type": callType,
            "caller_role": "customer",
            "caller_name": callerName
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        struct StartCallRes: Codable {
            let success: Bool
            let call_id: String
            let thread_id: Int
            let call_type: String
            let caller_role: String
            let caller_name: String
            let status: String
        }
        let res = try JSONDecoder().decode(StartCallRes.self, from: data)
        return SupportCallSession(
            id: res.call_id,
            thread_id: res.thread_id,
            caller_role: res.caller_role,
            caller_name: res.caller_name,
            call_type: res.call_type,
            status: res.status
        )
    }

    public func checkActiveCall(threadId: Int) async throws -> SupportCallSession? {
        guard let url = URL(string: "\(baseURL)/support/call/active?thread_id=\(threadId)") else {
            throw URLError(.badURL)
        }
        let (data, response) = try await session.data(from: url)
        try validateResponse(response)
        let res = try JSONDecoder().decode(SupportActiveCallResponse.self, from: data)
        return res.call
    }

    public func endSupportCall(callId: String) async throws {
        guard let url = URL(string: "\(baseURL)/support/call/end") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let payload = ["call_id": callId, "status": "ended"]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        let (_, response) = try await session.data(for: request)
        try validateResponse(response)
    }

    private func validateResponse(_ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse else { return }
        if http.statusCode < 200 || http.statusCode >= 300 {
            throw NSError(domain: "ShopAPIError", code: http.statusCode, userInfo: [
                NSLocalizedDescriptionKey: "Server returned status code: \(http.statusCode)"
            ])
        }
    }
}
