import SwiftUI

public struct ProductVisualMeta {
    public let emoji: String
    public let primaryColor: Color
    public let secondaryColor: Color

    public init(emoji: String, primaryColor: Color, secondaryColor: Color) {
        self.emoji = emoji
        self.primaryColor = primaryColor
        self.secondaryColor = secondaryColor
    }
}

public enum ProductVisualResolver {
    public static func resolve(name: String, nameMl: String? = nil, categoryId: Int? = nil, rawImageUrl: String? = nil) -> ProductVisualMeta {
        let text = "\(name) \(nameMl ?? "")".lowercased()

        // 1. Check if rawImageUrl is an SVG with an embedded emoji
        if let raw = rawImageUrl, !raw.isEmpty {
            if let decoded = raw.removingPercentEncoding ?? (raw.removingPercentEncoding == nil ? raw : nil) {
                if let emoji = extractEmoji(from: decoded) {
                    let col = extractColor(from: decoded) ?? fallbackColor(for: categoryId)
                    return ProductVisualMeta(emoji: emoji, primaryColor: col, secondaryColor: col.opacity(0.85))
                }
            }
        }

        // 2. Keyword matching for popular items
        if text.contains("honey") || text.contains("തേൻ") {
            return ProductVisualMeta(emoji: "🍯", primaryColor: Color(hex: "#D97706"), secondaryColor: Color(hex: "#92400E"))
        } else if text.contains("matta") || text.contains("മട്ട") {
            return ProductVisualMeta(emoji: "🍚", primaryColor: Color(hex: "#8D3318"), secondaryColor: Color(hex: "#5C200E"))
        } else if text.contains("coconut oil") || text.contains("വെളിച്ചെണ്ണ") {
            return ProductVisualMeta(emoji: "🥥", primaryColor: Color(hex: "#1E6F5C"), secondaryColor: Color(hex: "#134B3E"))
        } else if text.contains("rice") || text.contains("അരി") {
            return ProductVisualMeta(emoji: "🌾", primaryColor: Color(hex: "#2E4057"), secondaryColor: Color(hex: "#1D2A3A"))
        } else if text.contains("pepper") || text.contains("കുരുമുളക്") {
            return ProductVisualMeta(emoji: "🌱", primaryColor: Color(hex: "#3A3845"), secondaryColor: Color(hex: "#222129"))
        } else if text.contains("cardamom") || text.contains("ഏലയ്ക്ക") {
            return ProductVisualMeta(emoji: "🌿", primaryColor: Color(hex: "#2D6A4F"), secondaryColor: Color(hex: "#1B4332"))
        } else if text.contains("banana") || text.contains("നേന്ത്ര") {
            return ProductVisualMeta(emoji: "🍌", primaryColor: Color(hex: "#E3A857"), secondaryColor: Color(hex: "#B87F30"))
        } else if text.contains("coconut") || text.contains("തേങ്ങ") {
            return ProductVisualMeta(emoji: "🥥", primaryColor: Color(hex: "#6B4423"), secondaryColor: Color(hex: "#432A14"))
        } else if text.contains("chips") || text.contains("ഉപ്പേരി") || text.contains("വറുത്തത്") {
            return ProductVisualMeta(emoji: "🍟", primaryColor: Color(hex: "#D4A373"), secondaryColor: Color(hex: "#A87648"))
        } else if text.contains("tea") || text.contains("തേയില") || text.contains("ചായ") {
            return ProductVisualMeta(emoji: "☕", primaryColor: Color(hex: "#A44A3F"), secondaryColor: Color(hex: "#6B2B23"))
        } else if text.contains("milk") || text.contains("പാൽ") {
            return ProductVisualMeta(emoji: "🥛", primaryColor: Color(hex: "#4A90E2"), secondaryColor: Color(hex: "#2B6CB0"))
        } else if text.contains("soap") || text.contains("സോപ്പ്") {
            return ProductVisualMeta(emoji: "🧼", primaryColor: Color(hex: "#588157"), secondaryColor: Color(hex: "#344E33"))
        } else if text.contains("jar") || text.contains("storage") || text.contains("പാത്രം") {
            return ProductVisualMeta(emoji: "🏺", primaryColor: Color(hex: "#3D5A80"), secondaryColor: Color(hex: "#243750"))
        }

        // 3. Category Fallback
        switch categoryId {
        case 1: return ProductVisualMeta(emoji: "🌾", primaryColor: Color(hex: "#1E6F5C"), secondaryColor: Color(hex: "#134B3E"))
        case 2: return ProductVisualMeta(emoji: "🥬", primaryColor: Color(hex: "#2D6A4F"), secondaryColor: Color(hex: "#1B4332"))
        case 3: return ProductVisualMeta(emoji: "🌶️", primaryColor: Color(hex: "#A44A3F"), secondaryColor: Color(hex: "#6B2B23"))
        case 4: return ProductVisualMeta(emoji: "☕", primaryColor: Color(hex: "#D4A373"), secondaryColor: Color(hex: "#A87648"))
        case 5: return ProductVisualMeta(emoji: "🥛", primaryColor: Color(hex: "#4A90E2"), secondaryColor: Color(hex: "#2B6CB0"))
        case 6: return ProductVisualMeta(emoji: "🏠", primaryColor: Color(hex: "#588157"), secondaryColor: Color(hex: "#344E33"))
        default: return ProductVisualMeta(emoji: "📦", primaryColor: Color(hex: "#0F766E"), secondaryColor: Color(hex: "#094D48"))
        }
    }

    private static func fallbackColor(for categoryId: Int?) -> Color {
        switch categoryId {
        case 1: return Color(hex: "#1E6F5C")
        case 2: return Color(hex: "#2D6A4F")
        case 3: return Color(hex: "#A44A3F")
        case 4: return Color(hex: "#D4A373")
        case 5: return Color(hex: "#4A90E2")
        case 6: return Color(hex: "#588157")
        default: return Color(hex: "#0F766E")
        }
    }

    private static func extractEmoji(from str: String) -> String? {
        if let range = str.range(of: "<text[^>]*>([^<]+)</text>", options: .regularExpression) {
            let tag = String(str[range])
            if let start = tag.firstIndex(of: ">"), let end = tag.range(of: "</")?.lowerBound {
                let content = String(tag[tag.index(after: start)..<end]).trimmingCharacters(in: .whitespacesAndNewlines)
                if !content.isEmpty { return content }
            }
        }
        return nil
    }

    private static func extractColor(from str: String) -> Color? {
        if let range = str.range(of: "fill=\"(#[A-Fa-f0-9]{6})\"", options: .regularExpression) {
            let match = String(str[range])
            if let hexStart = match.firstIndex(of: "#"), let hexEnd = match.lastIndex(of: "\"") {
                let hex = String(match[hexStart..<hexEnd])
                return Color(hex: hex)
            }
        }
        return nil
    }
}

public struct ProductImageView: View {
    public let name: String
    public let nameMl: String?
    public let categoryId: Int?
    public let imageUrl: String?
    public let height: CGFloat
    public let cornerRadius: CGFloat
    public let isThumbnail: Bool

    public init(
        name: String,
        nameMl: String? = nil,
        categoryId: Int? = nil,
        imageUrl: String? = nil,
        height: CGFloat = 110,
        cornerRadius: CGFloat = 12,
        isThumbnail: Bool = false
    ) {
        self.name = name
        self.nameMl = nameMl
        self.categoryId = categoryId
        self.imageUrl = imageUrl
        self.height = height
        self.cornerRadius = cornerRadius
        self.isThumbnail = isThumbnail
    }

    public var body: some View {
        ZStack {
            if let raw = imageUrl, (raw.hasPrefix("http://") || raw.hasPrefix("https://")), let url = URL(string: raw) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let img):
                        img.resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(maxWidth: .infinity, maxHeight: height)
                            .clipped()
                    default:
                        visualBanner
                    }
                }
            } else {
                visualBanner
            }
        }
        .frame(height: height)
        .frame(maxWidth: isThumbnail ? height : .infinity)
        .cornerRadius(cornerRadius)
        .clipped()
    }

    private var visualBanner: some View {
        let meta = ProductVisualResolver.resolve(
            name: name,
            nameMl: nameMl,
            categoryId: categoryId,
            rawImageUrl: imageUrl
        )

        return ZStack {
            LinearGradient(
                colors: [meta.primaryColor, meta.secondaryColor],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            if isThumbnail {
                Circle()
                    .fill(Color.white.opacity(0.25))
                    .frame(width: height * 0.7, height: height * 0.7)

                Text(meta.emoji)
                    .font(.system(size: height * 0.45))
            } else {
                Circle()
                    .fill(Color.white.opacity(0.22))
                    .frame(width: 58, height: 58)

                Text(meta.emoji)
                    .font(.system(size: 44))
            }
        }
    }
}
