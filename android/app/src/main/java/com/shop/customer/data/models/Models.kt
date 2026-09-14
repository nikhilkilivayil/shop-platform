package com.shop.customer.data.models

data class Category(
    val id: Int,
    val name: String,
    val slug: String? = null,
    val icon: String? = null,
    val description: String? = null
)

data class Product(
    val id: Int,
    val categoryId: Int? = null,
    val categoryName: String? = null,
    val name: String,
    val nameMl: String? = null,
    val sku: String? = null,
    val price: Double,
    val compareAtPrice: Double? = null,
    val mrp: Double? = null,
    val stock: Int = 0,
    val description: String? = null,
    val imageUrl: String? = null,
    val imageBadge: String? = null,
    val unit: String? = "1 unit"
) {
    val inStock: Boolean get() = stock > 0
    val formattedPrice: String get() = "₹%.2f".format(price)
}

data class CartItem(
    val product: Product,
    var quantity: Int = 1
) {
    val total: Double get() = product.price * quantity
}

data class OrderItem(
    val id: Int = 0,
    val orderId: String = "",
    val productId: Int,
    val productName: String,
    val quantity: Int,
    val price: Double,
    val total: Double
)

data class Order(
    val id: String,
    val orderNumber: String,
    val userId: Int? = null,
    val customerName: String,
    val customerPhone: String,
    val deliveryAddress: String? = null,
    val city: String? = null,
    val pincode: String? = null,
    val status: String,
    val paymentMethod: String,
    val paymentStatus: String,
    val subtotal: Double,
    val deliveryFee: Double,
    val discount: Double,
    val total: Double,
    val notes: String? = null,
    val createdAt: String,
    val items: List<OrderItem> = emptyList()
) {
    val formattedTotal: String get() = "₹%.2f".format(total)
}

data class User(
    val id: Int,
    val name: String?,
    val phone: String?,
    val email: String?,
    val address: String?,
    val city: String?,
    val pincode: String?,
    val deviceId: String?
)

data class SendOtpResponse(
    val success: Boolean,
    val otp: String?,
    val message: String?,
    val hasName: Boolean?,
    val userName: String?
)

data class VerifyOtpResponse(
    val success: Boolean,
    val token: String?,
    val user: User?,
    val message: String?
)

data class SupportThread(
    val id: Int,
    val userId: Int? = null,
    val customerName: String,
    val customerPhone: String,
    val status: String,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class SupportMessage(
    val id: Int,
    val threadId: Int,
    val senderRole: String,
    val senderId: Int? = null,
    val senderName: String,
    val messageType: String,
    val content: String,
    val audioDuration: Double = 0.0,
    val isRead: Int = 0,
    val createdAt: String? = null
)

data class SupportCallSession(
    val id: String,
    val threadId: Int,
    val callerRole: String,
    val callerName: String,
    val callType: String,
    val status: String
)

