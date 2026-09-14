import Foundation

public struct Category: Identifiable, Codable, Hashable, Sendable {
    public let id: Int
    public let name: String
    public let slug: String?
    public let icon: String?
    public let description: String?
    public let display_order: Int?

    public init(id: Int, name: String, slug: String? = nil, icon: String? = nil, description: String? = nil, display_order: Int? = 0) {
        self.id = id
        self.name = name
        self.slug = slug
        self.icon = icon
        self.description = description
        self.display_order = display_order
    }
}

public struct Product: Identifiable, Codable, Hashable, Sendable {
    public let id: Int
    public let category_id: Int?
    public let category_name: String?
    public let name: String
    public let name_ml: String?
    public let sku: String?
    public let price: Double
    public let compare_at_price: Double?
    public let mrp: Double?
    public let stock: Int
    public let description: String?
    public let image_url: String?
    public let image_badge: String?
    public let unit: String?
    public let is_active: Int?

    public var formattedPrice: String {
        return String(format: "₹%.2f", price)
    }

    public var inStock: Bool {
        return stock > 0
    }

    public init(
        id: Int,
        category_id: Int? = nil,
        category_name: String? = nil,
        name: String,
        name_ml: String? = nil,
        sku: String? = nil,
        price: Double,
        compare_at_price: Double? = nil,
        mrp: Double? = nil,
        stock: Int = 10,
        description: String? = nil,
        image_url: String? = nil,
        image_badge: String? = nil,
        unit: String? = "1 unit",
        is_active: Int? = 1
    ) {
        self.id = id
        self.category_id = category_id
        self.category_name = category_name
        self.name = name
        self.name_ml = name_ml
        self.sku = sku
        self.price = price
        self.compare_at_price = compare_at_price
        self.mrp = mrp
        self.stock = stock
        self.description = description
        self.image_url = image_url
        self.image_badge = image_badge
        self.unit = unit
        self.is_active = is_active
    }
}

public struct CartItem: Identifiable, Codable, Hashable, Sendable {
    public var id: Int { product.id }
    public let product: Product
    public var quantity: Int

    public var itemTotal: Double {
        return product.price * Double(quantity)
    }

    public init(product: Product, quantity: Int = 1) {
        self.product = product
        self.quantity = quantity
    }
}

public struct OrderItem: Identifiable, Codable, Hashable, Sendable {
    public let id: Int?
    public let order_id: String?
    public let product_id: Int?
    public let product_name: String
    public let quantity: Int
    public let price: Double
    public let total: Double

    enum CodingKeys: String, CodingKey {
        case id, order_id, product_id, product_name, quantity, price, unit_price, total, total_price
    }

    public init(id: Int? = nil, order_id: String? = nil, product_id: Int? = nil, product_name: String, quantity: Int, price: Double, total: Double) {
        self.id = id
        self.order_id = order_id
        self.product_id = product_id
        self.product_name = product_name
        self.quantity = quantity
        self.price = price
        self.total = total
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try container.decodeIfPresent(Int.self, forKey: .id)
        self.order_id = try container.decodeIfPresent(String.self, forKey: .order_id)
        self.product_id = try container.decodeIfPresent(Int.self, forKey: .product_id)
        self.product_name = try container.decodeIfPresent(String.self, forKey: .product_name) ?? "Item"
        let qty = try container.decodeIfPresent(Int.self, forKey: .quantity) ?? 1
        self.quantity = qty
        let p = try container.decodeIfPresent(Double.self, forKey: .price) ?? container.decodeIfPresent(Double.self, forKey: .unit_price) ?? 0.0
        self.price = p
        self.total = try container.decodeIfPresent(Double.self, forKey: .total) ?? container.decodeIfPresent(Double.self, forKey: .total_price) ?? (p * Double(qty))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encodeIfPresent(id, forKey: .id)
        try container.encodeIfPresent(order_id, forKey: .order_id)
        try container.encodeIfPresent(product_id, forKey: .product_id)
        try container.encode(product_name, forKey: .product_name)
        try container.encode(quantity, forKey: .quantity)
        try container.encode(price, forKey: .price)
        try container.encode(total, forKey: .total)
    }
}

public struct Order: Identifiable, Codable, Hashable, Sendable {
    public let id: String
    public let order_number: String?
    public let user_id: Int?
    public let customer_name: String
    public let customer_phone: String
    public let delivery_address: String?
    public let city: String?
    public let pincode: String?
    public let status: String
    public let payment_method: String
    public let payment_status: String
    public let subtotal: Double
    public let delivery_fee: Double
    public let discount: Double
    public let total: Double
    public let notes: String?
    public let created_at: String
    public var items: [OrderItem]?

    enum CodingKeys: String, CodingKey {
        case id, order_number, user_id, customer_name, customer_phone
        case delivery_address, shipping_address, city, pincode, status
        case payment_method, payment_status, subtotal, delivery_fee, discount
        case total, total_amount, notes, created_at, items
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.order_number = try c.decodeIfPresent(String.self, forKey: .order_number) ?? id
        self.user_id = try c.decodeIfPresent(Int.self, forKey: .user_id)
        self.customer_name = try c.decodeIfPresent(String.self, forKey: .customer_name) ?? ""
        self.customer_phone = try c.decodeIfPresent(String.self, forKey: .customer_phone) ?? ""
        self.delivery_address = try c.decodeIfPresent(String.self, forKey: .delivery_address) ?? c.decodeIfPresent(String.self, forKey: .shipping_address)
        self.city = try c.decodeIfPresent(String.self, forKey: .city)
        self.pincode = try c.decodeIfPresent(String.self, forKey: .pincode)
        self.status = try c.decodeIfPresent(String.self, forKey: .status) ?? "pending"
        self.payment_method = try c.decodeIfPresent(String.self, forKey: .payment_method) ?? "UPI"
        self.payment_status = try c.decodeIfPresent(String.self, forKey: .payment_status) ?? "pending"
        self.subtotal = try c.decodeIfPresent(Double.self, forKey: .subtotal) ?? 0.0
        self.delivery_fee = try c.decodeIfPresent(Double.self, forKey: .delivery_fee) ?? 0.0
        self.discount = try c.decodeIfPresent(Double.self, forKey: .discount) ?? 0.0
        self.total = try c.decodeIfPresent(Double.self, forKey: .total) ?? c.decodeIfPresent(Double.self, forKey: .total_amount) ?? 0.0
        self.notes = try c.decodeIfPresent(String.self, forKey: .notes)
        self.created_at = try c.decodeIfPresent(String.self, forKey: .created_at) ?? ""
        self.items = try c.decodeIfPresent([OrderItem].self, forKey: .items)
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encodeIfPresent(order_number, forKey: .order_number)
        try c.encodeIfPresent(user_id, forKey: .user_id)
        try c.encode(customer_name, forKey: .customer_name)
        try c.encode(customer_phone, forKey: .customer_phone)
        try c.encodeIfPresent(delivery_address, forKey: .delivery_address)
        try c.encodeIfPresent(city, forKey: .city)
        try c.encodeIfPresent(pincode, forKey: .pincode)
        try c.encode(status, forKey: .status)
        try c.encode(payment_method, forKey: .payment_method)
        try c.encode(payment_status, forKey: .payment_status)
        try c.encode(subtotal, forKey: .subtotal)
        try c.encode(delivery_fee, forKey: .delivery_fee)
        try c.encode(discount, forKey: .discount)
        try c.encode(total, forKey: .total)
        try c.encodeIfPresent(notes, forKey: .notes)
        try c.encode(created_at, forKey: .created_at)
        try c.encodeIfPresent(items, forKey: .items)
    }

    public var displayOrderNumber: String {
        return order_number ?? id
    }

    public var formattedTotal: String {
        return String(format: "₹%.2f", total)
    }

    public var statusBadgeColor: String {
        switch status.lowercased() {
        case "delivered": return "green"
        case "shipped": return "blue"
        case "processing": return "orange"
        case "cancelled": return "red"
        default: return "yellow"
        }
    }
}

public struct UserProfile: Identifiable, Codable, Hashable, Sendable {
    public let id: Int
    public var name: String?
    public var phone: String?
    public var email: String?
    public var address: String?
    public var city: String?
    public var pincode: String?
    public var device_id: String?
    public var is_blocked: Int?
}

public struct SendOtpResponse: Codable, Sendable {
    public let success: Bool
    public let otp: String?
    public let message: String?
    public let has_name: Bool?
    public let user_name: String?
}

public struct VerifyOtpResponse: Codable, Sendable {
    public let success: Bool
    public let token: String?
    public let user: UserProfile?
    public let message: String?
}

public struct OrderCreateResponse: Codable, Sendable {
    public let success: Bool
    public let order: Order
    public let message: String?
}
