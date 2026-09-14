import SwiftUI

public enum ShopTheme {
    public static let primary = Color(red: 16/255, green: 185/255, blue: 129/255) // #10b981
    public static let primaryDark = Color(red: 5/255, green: 150/255, blue: 105/255) // #059669
    public static let primaryForest = Color(red: 6/255, green: 95/255, blue: 70/255) // #065f46
    public static let background = Color(red: 248/255, green: 250/255, blue: 252/255) // #f8fafc
    public static let surface = Color.white
    public static let textPrimary = Color(red: 15/255, green: 23/255, blue: 42/255) // #0f172a
    public static let textSecondary = Color(red: 100/255, green: 116/255, blue: 139/255) // #64748b
    public static let accentGold = Color(red: 245/255, green: 158/255, blue: 11/255) // #f59e0b
    public static let cardBorder = Color(red: 226/255, green: 232/255, blue: 240/255) // #e2e8f0
}

extension Color {
    public init(hex: String) {
        let cleaned = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch cleaned.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 16, 185, 129)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

extension View {
    @ViewBuilder
    public func appKeyboardTypePhone() -> some View {
        #if os(iOS)
        self.keyboardType(.phonePad)
        #else
        self
        #endif
    }

    @ViewBuilder
    public func appKeyboardTypeNumber() -> some View {
        #if os(iOS)
        self.keyboardType(.numberPad)
        #else
        self
        #endif
    }

    @ViewBuilder
    public func appKeyboardTypeEmail() -> some View {
        #if os(iOS)
        self.keyboardType(.emailAddress)
        #else
        self
        #endif
    }
}

