import SwiftUI

public struct ProductCard: View {
    public let product: Product
    @EnvironmentObject private var cart: CartStore
    @EnvironmentObject private var lang: LanguageStore

    public init(product: Product) {
        self.product = product
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Product Visual Image Banner
            ProductImageView(
                name: product.name,
                nameMl: product.name_ml,
                categoryId: product.category_id,
                imageUrl: product.image_url,
                height: 110,
                cornerRadius: 12
            )

            // Top Badge Area / Category
            HStack {
                Text(product.category_name ?? "Groceries")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(ShopTheme.primaryForest)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(ShopTheme.primary.opacity(0.12))
                    .cornerRadius(8)

                Spacer()

                if product.stock <= 0 {
                    Text(lang.t("out_of_stock"))
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.red)
                } else if product.stock < 5 {
                    Text("\(product.stock) left")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.orange)
                }
            }

            // Product Name & Unit
            VStack(alignment: .leading, spacing: 4) {
                Text(product.name)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(ShopTheme.textPrimary)
                    .lineLimit(2)
                    .frame(height: 40, alignment: .topLeading)

                Text(product.unit ?? "1 unit")
                    .font(.system(size: 12))
                    .foregroundColor(ShopTheme.textSecondary)
            }

            Spacer()

            // Price & Compare Price
            HStack(alignment: .lastTextBaseline, spacing: 6) {
                Text(product.formattedPrice)
                    .font(.system(size: 17, weight: .heavy))
                    .foregroundColor(ShopTheme.primaryForest)

                if let compare = product.compare_at_price, compare > product.price {
                    Text(String(format: "₹%.2f", compare))
                        .font(.system(size: 12))
                        .strikethrough()
                        .foregroundColor(ShopTheme.textSecondary)
                }
            }

            // Cart Action Buttons
            let qty = cart.quantity(for: product.id)
            if qty > 0 {
                HStack {
                    Button(action: {
                        cart.decrement(productId: product.id)
                    }) {
                        Image(systemName: "minus")
                            .font(.system(size: 12, weight: .bold))
                            .frame(width: 32, height: 32)
                            .background(ShopTheme.primary.opacity(0.15))
                            .foregroundColor(ShopTheme.primaryForest)
                            .cornerRadius(8)
                    }

                    Spacer()

                    Text("\(qty)")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(ShopTheme.textPrimary)

                    Spacer()

                    Button(action: {
                        cart.increment(productId: product.id)
                    }) {
                        Image(systemName: "plus")
                            .font(.system(size: 12, weight: .bold))
                            .frame(width: 32, height: 32)
                            .background(ShopTheme.primary)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                }
                .padding(.top, 4)
            } else {
                Button(action: {
                    cart.addToCart(product: product)
                }) {
                    HStack {
                        Image(systemName: "cart.badge.plus")
                        Text("\(lang.t("quick_add")) +")
                            .font(.system(size: 13, weight: .bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(product.inStock ? ShopTheme.primary : Color.gray.opacity(0.4))
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
                .disabled(!product.inStock)
                .padding(.top, 4)
            }
        }
        .padding(14)
        .background(ShopTheme.surface)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(ShopTheme.cardBorder, lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.03), radius: 6, x: 0, y: 3)
    }
}
