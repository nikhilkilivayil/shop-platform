import SwiftUI

public struct TrackingStepper: View {
    public let status: String

    public init(status: String) {
        self.status = status
    }

    private let steps = [
        ("ഓർഡർ ലഭിച്ചു", "Received"),
        ("പാക്കിങ് നടക്കുന്നു", "Packed"),
        ("ഡെലിവറിക്ക് അയച്ചു", "Shipped"),
        ("ഡെലിവറി പൂർത്തിയായി", "Delivered")
    ]

    private var activeStepIndex: Int {
        switch status.lowercased() {
        case "processing": return 1
        case "shipped": return 2
        case "delivered": return 3
        default: return 0
        }
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("ഡെലിവറി സ്റ്റാറ്റസ് ട്രാക്കർ")
                .font(.system(size: 15, weight: .bold))
                .foregroundColor(ShopTheme.textPrimary)

            HStack(alignment: .top, spacing: 4) {
                ForEach(0..<steps.count, id: \.self) { i in
                    VStack(spacing: 6) {
                        ZStack {
                            Circle()
                                .fill(i <= activeStepIndex ? ShopTheme.primary : Color.gray.opacity(0.2))
                                .frame(width: 28, height: 28)

                            if i < activeStepIndex {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.white)
                            } else {
                                Text("\(i + 1)")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(i <= activeStepIndex ? .white : .gray)
                            }
                        }

                        Text(steps[i].0)
                            .font(.system(size: 10, weight: i == activeStepIndex ? .bold : .regular))
                            .multilineTextAlignment(.center)
                            .foregroundColor(i <= activeStepIndex ? ShopTheme.primaryForest : ShopTheme.textSecondary)
                            .frame(maxWidth: .infinity)
                    }

                    if i < steps.count - 1 {
                        Rectangle()
                            .fill(i < activeStepIndex ? ShopTheme.primary : Color.gray.opacity(0.2))
                            .frame(height: 3)
                            .padding(.top, 13)
                    }
                }
            }
        }
        .padding(16)
        .background(ShopTheme.surface)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(ShopTheme.cardBorder, lineWidth: 1)
        )
    }
}
