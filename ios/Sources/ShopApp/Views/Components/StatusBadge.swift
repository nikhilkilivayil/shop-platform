import SwiftUI

public struct StatusBadge: View {
    public let status: String

    public init(status: String) {
        self.status = status
    }

    private var config: (text: String, bg: Color, fg: Color) {
        switch status.lowercased() {
        case "delivered":
            return ("Delivered / ലഭിച്ചു", Color.green.opacity(0.15), Color.green)
        case "shipped":
            return ("Shipped / അയച്ചു", Color.blue.opacity(0.15), Color.blue)
        case "processing":
            return ("Processing / പാക്കിങ്", Color.orange.opacity(0.15), Color.orange)
        case "cancelled":
            return ("Cancelled / റദ്ദാക്കി", Color.red.opacity(0.15), Color.red)
        default:
            return ("Pending / ലഭിച്ചു", Color.amberFallback.opacity(0.15), Color.amberFallback)
        }
    }

    public var body: some View {
        Text(config.text)
            .font(.system(size: 12, weight: .bold))
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(config.bg)
            .foregroundColor(config.fg)
            .cornerRadius(12)
    }
}

fileprivate extension Color {
    static let amberFallback = Color(red: 217/255, green: 119/255, blue: 6/255)
}
