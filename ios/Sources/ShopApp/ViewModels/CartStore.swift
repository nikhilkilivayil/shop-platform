import Foundation
import Combine

@MainActor
public final class CartStore: ObservableObject {
    public static let shared = CartStore()

    @Published public private(set) var items: [CartItem] = []

    public init() {}

    public var totalCount: Int {
        items.reduce(0) { $0 + $1.quantity }
    }

    public var subtotal: Double {
        items.reduce(0.0) { $0 + $1.itemTotal }
    }

    public var deliveryFee: Double {
        if subtotal == 0 || subtotal >= 500 {
            return 0
        }
        return 40.0
    }

    public var discount: Double {
        if subtotal >= 1000 {
            return round(subtotal * 0.10)
        }
        return 0.0
    }

    public var grandTotal: Double {
        return max(0, subtotal + deliveryFee - discount)
    }

    public func addToCart(product: Product, quantity: Int = 1) {
        if let idx = items.firstIndex(where: { $0.product.id == product.id }) {
            let newQty = items[idx].quantity + quantity
            if newQty <= product.stock {
                items[idx].quantity = newQty
            }
        } else {
            let initialQty = min(quantity, product.stock)
            if initialQty > 0 {
                items.append(CartItem(product: product, quantity: initialQty))
            }
        }
    }

    public func increment(productId: Int) {
        guard let idx = items.firstIndex(where: { $0.product.id == productId }) else { return }
        if items[idx].quantity < items[idx].product.stock {
            items[idx].quantity += 1
        }
    }

    public func decrement(productId: Int) {
        guard let idx = items.firstIndex(where: { $0.product.id == productId }) else { return }
        if items[idx].quantity > 1 {
            items[idx].quantity -= 1
        } else {
            items.remove(at: idx)
        }
    }

    public func remove(productId: Int) {
        items.removeAll(where: { $0.product.id == productId })
    }

    public func clear() {
        items.removeAll()
    }

    public func quantity(for productId: Int) -> Int {
        items.first(where: { $0.product.id == productId })?.quantity ?? 0
    }
}
