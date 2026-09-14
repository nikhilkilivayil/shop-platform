import Foundation

public final class APIService: @unchecked Sendable {
    public static let shared = APIService()

    public static let defaultBaseURL: String = "http://localhost:3001/api"
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

    private func validateResponse(_ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse else { return }
        if http.statusCode < 200 || http.statusCode >= 300 {
            throw NSError(domain: "ShopAPIError", code: http.statusCode, userInfo: [
                NSLocalizedDescriptionKey: "Server returned status code: \(http.statusCode)"
            ])
        }
    }
}
