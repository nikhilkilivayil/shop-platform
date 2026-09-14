import Foundation
import Combine

@MainActor
public final class OrdersViewModel: ObservableObject {
    @Published public var orders: [Order] = []
    @Published public var selectedOrder: Order? = nil
    @Published public var isLoading: Bool = false
    @Published public var errorMessage: String? = nil
    @Published public var lastPlacedOrder: Order? = nil

    public init() {}

    public func loadOrders(token: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let fetched = try await APIService.shared.fetchUserOrders(token: token)
            self.orders = fetched
            self.isLoading = false
        } catch {
            self.errorMessage = error.localizedDescription
            self.isLoading = false
        }
    }

    public func loadOrderDetail(orderId: String) async {
        isLoading = true
        do {
            let detail = try await APIService.shared.fetchOrderDetails(orderId: orderId)
            self.selectedOrder = detail
            self.isLoading = false
        } catch {
            self.errorMessage = error.localizedDescription
            self.isLoading = false
        }
    }

    public func placeOrder(
        token: String?,
        customerName: String,
        customerPhone: String,
        deliveryAddress: String,
        city: String,
        pincode: String,
        items: [CartItem],
        paymentMethod: String,
        notes: String?
    ) async throws -> Order {
        isLoading = true
        errorMessage = nil

        let itemsPayload = items.map { item in
            [
                "product_id": item.product.id,
                "quantity": item.quantity,
                "price": item.product.price
            ] as [String: Any]
        }

        let orderPayload: [String: Any] = [
            "customer_name": customerName,
            "customer_phone": customerPhone,
            "delivery_address": deliveryAddress,
            "city": city,
            "pincode": pincode,
            "payment_method": paymentMethod,
            "payment_status": paymentMethod.lowercased() == "cod" ? "pending" : "completed",
            "notes": notes ?? "",
            "items": itemsPayload
        ]

        do {
            let res = try await APIService.shared.createOrder(token: token, orderData: orderPayload)
            self.lastPlacedOrder = res.order
            self.isLoading = false
            return res.order
        } catch {
            self.isLoading = false
            self.errorMessage = error.localizedDescription
            throw error
        }
    }
}
