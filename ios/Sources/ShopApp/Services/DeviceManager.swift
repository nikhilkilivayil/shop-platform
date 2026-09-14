import Foundation

public final class DeviceManager: Sendable {
    public static let shared = DeviceManager()
    private let key = "shop_mobile_device_id"

    public func getDeviceId() -> String {
        if let stored = UserDefaults.standard.string(forKey: key), !stored.isEmpty {
            return stored
        }
        let newId = "IOS-DEV-" + UUID().uuidString.prefix(8).uppercased()
        UserDefaults.standard.set(newId, forKey: key)
        return newId
    }
}
