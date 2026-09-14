import Foundation
import Combine

@MainActor
public final class AuthStore: ObservableObject {
    public static let shared = AuthStore()

    @Published public var currentUser: UserProfile?
    @Published public var token: String?
    @Published public var isLoggedIn: Bool = false
    @Published public var isExistingUser: Bool = false
    @Published public var existingUserName: String = ""
    @Published public var lastSentOtpForDisplay: String?

    private let tokenKey = "shop_auth_token"

    public init() {
        if let savedToken = UserDefaults.standard.string(forKey: tokenKey), !savedToken.isEmpty {
            self.token = savedToken
            self.isLoggedIn = true
            Task {
                await fetchProfile()
            }
        }
    }

    public var deviceId: String {
        DeviceManager.shared.getDeviceId()
    }

    public func sendOtp(phone: String) async throws -> SendOtpResponse {
        let res = try await APIService.shared.sendOtp(phone: phone, deviceId: deviceId)
        self.lastSentOtpForDisplay = res.otp
        if res.has_name == true {
            self.isExistingUser = true
            self.existingUserName = res.user_name ?? ""
        } else {
            self.isExistingUser = false
            self.existingUserName = ""
        }
        return res
    }

    public func verifyOtp(phone: String, otp: String, name: String) async throws {
        let actualName = isExistingUser ? existingUserName : name
        let res = try await APIService.shared.verifyOtp(phone: phone, otp: otp, name: actualName, deviceId: deviceId)
        if res.success, let t = res.token, let u = res.user {
            self.token = t
            self.currentUser = u
            self.isLoggedIn = true
            UserDefaults.standard.set(t, forKey: tokenKey)
        } else {
            throw NSError(domain: "AuthError", code: 400, userInfo: [
                NSLocalizedDescriptionKey: res.message ?? "Invalid OTP"
            ])
        }
    }

    public func fetchProfile() async {
        guard let t = token else { return }
        do {
            let u = try await APIService.shared.fetchUserProfile(token: t)
            self.currentUser = u
        } catch {
            // Token may have expired
            logout()
        }
    }

    public func updateProfile(name: String, email: String, address: String, city: String, pincode: String) async throws {
        guard let t = token else { return }
        let u = try await APIService.shared.updateUserProfile(
            token: t,
            name: name,
            email: email,
            address: address,
            city: city,
            pincode: pincode
        )
        self.currentUser = u
    }

    public func logout() {
        self.token = nil
        self.currentUser = nil
        self.isLoggedIn = false
        self.isExistingUser = false
        self.existingUserName = ""
        self.lastSentOtpForDisplay = nil
        UserDefaults.standard.removeObject(forKey: tokenKey)
    }
}
