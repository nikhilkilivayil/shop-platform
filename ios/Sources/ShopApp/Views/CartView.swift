import SwiftUI

public struct CartView: View {
    @EnvironmentObject private var cart: CartStore
    @EnvironmentObject private var auth: AuthStore
    @EnvironmentObject private var lang: LanguageStore
    @State private var showingCheckout = false

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                ShopTheme.background.ignoresSafeArea()

                if cart.items.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "cart")
                            .font(.system(size: 60))
                            .foregroundColor(ShopTheme.textSecondary.opacity(0.6))

                        Text(lang.t("cart_empty_title"))
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(ShopTheme.textPrimary)

                        Text(lang.t("cart_empty_desc"))
                            .font(.system(size: 14))
                            .foregroundColor(ShopTheme.textSecondary)
                    }
                    .padding()
                } else {
                    VStack(spacing: 0) {
                        ScrollView {
                            VStack(spacing: 12) {
                                ForEach(cart.items) { item in
                                    cartItemRow(item)
                                }

                                // Delivery promo banner
                                if cart.subtotal < 500 {
                                    HStack {
                                        Image(systemName: "truck.box")
                                            .foregroundColor(ShopTheme.primaryForest)
                                        Text(String(format: lang.t("delivery_free_threshold_msg"), 500 - cart.subtotal))
                                            .font(.system(size: 12, weight: .semibold))
                                            .foregroundColor(ShopTheme.primaryForest)
                                    }
                                    .padding(12)
                                    .frame(maxWidth: .infinity)
                                    .background(ShopTheme.primary.opacity(0.12))
                                    .cornerRadius(10)
                                }

                                // Bill Summary Card
                                VStack(spacing: 8) {
                                    Text(lang.t("bill_summary"))
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundColor(ShopTheme.textPrimary)
                                        .frame(maxWidth: .infinity, alignment: .leading)

                                    Divider()

                                    HStack {
                                        Text(lang.t("items_total"))
                                            .foregroundColor(ShopTheme.textSecondary)
                                        Spacer()
                                        Text(String(format: "₹%.2f", cart.subtotal))
                                            .fontWeight(.semibold)
                                    }
                                    .font(.system(size: 13))

                                    HStack {
                                        Text(lang.t("delivery_fee"))
                                            .foregroundColor(ShopTheme.textSecondary)
                                        Spacer()
                                        if cart.deliveryFee == 0 {
                                            Text(lang.t("free_delivery"))
                                                .foregroundColor(ShopTheme.primaryForest)
                                                .fontWeight(.bold)
                                        } else {
                                            Text(String(format: "₹%.2f", cart.deliveryFee))
                                                .fontWeight(.semibold)
                                        }
                                    }
                                    .font(.system(size: 13))

                                    if cart.discount > 0 {
                                        HStack {
                                            Text(lang.t("special_discount"))
                                                .foregroundColor(ShopTheme.primaryForest)
                                            Spacer()
                                            Text(String(format: "-₹%.2f", cart.discount))
                                                .foregroundColor(ShopTheme.primaryForest)
                                                .fontWeight(.bold)
                                        }
                                        .font(.system(size: 13))
                                    }

                                    Divider()

                                    HStack {
                                        Text(lang.t("grand_total"))
                                            .font(.system(size: 16, weight: .bold))
                                        Spacer()
                                        Text(String(format: "₹%.2f", cart.grandTotal))
                                            .font(.system(size: 18, weight: .heavy))
                                            .foregroundColor(ShopTheme.primaryForest)
                                    }
                                }
                                .padding(16)
                                .background(ShopTheme.surface)
                                .cornerRadius(14)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 14)
                                        .stroke(ShopTheme.cardBorder, lineWidth: 1)
                                )
                            }
                            .padding()
                        }

                        // Bottom Checkout Bar
                        VStack(spacing: 8) {
                            Button(action: {
                                showingCheckout = true
                            }) {
                                HStack {
                                    Text(lang.t("proceed_checkout"))
                                        .font(.system(size: 16, weight: .bold))
                                    Spacer()
                                    Text(String(format: "₹%.2f ➔", cart.grandTotal))
                                        .font(.system(size: 16, weight: .heavy))
                                }
                                .padding()
                                .background(ShopTheme.primary)
                                .foregroundColor(.white)
                                .cornerRadius(14)
                            }
                        }
                        .padding()
                        .background(ShopTheme.surface)
                        .shadow(color: Color.black.opacity(0.05), radius: 6, x: 0, y: -3)
                    }
                }
            }
            .navigationTitle(lang.t("cart_title"))
            .navigationDestination(isPresented: $showingCheckout) {
                CheckoutView()
            }
        }
    }

    @ViewBuilder
    private func cartItemRow(_ item: CartItem) -> some View {
        HStack(spacing: 12) {
            ProductImageView(
                name: item.product.name,
                nameMl: item.product.name_ml,
                categoryId: item.product.category_id,
                imageUrl: item.product.image_url,
                height: 52,
                cornerRadius: 10,
                isThumbnail: true
            )

            VStack(alignment: .leading, spacing: 4) {
                Text(item.product.name)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(ShopTheme.textPrimary)

                Text("\(item.product.formattedPrice) / \(item.product.unit ?? lang.t("unit_default"))")
                    .font(.system(size: 12))
                    .foregroundColor(ShopTheme.textSecondary)

                Text(String(format: lang.t("cart_item_total"), item.itemTotal))
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(ShopTheme.primaryForest)
            }

            Spacer()

            // Quantity buttons
            HStack(spacing: 10) {
                Button(action: {
                    cart.decrement(productId: item.product.id)
                }) {
                    Image(systemName: "minus")
                        .font(.system(size: 11, weight: .bold))
                        .frame(width: 28, height: 28)
                        .background(ShopTheme.primary.opacity(0.12))
                        .foregroundColor(ShopTheme.primaryForest)
                        .cornerRadius(6)
                }

                Text("\(item.quantity)")
                    .font(.system(size: 14, weight: .bold))
                    .frame(minWidth: 20)

                Button(action: {
                    cart.increment(productId: item.product.id)
                }) {
                    Image(systemName: "plus")
                        .font(.system(size: 11, weight: .bold))
                        .frame(width: 28, height: 28)
                        .background(ShopTheme.primary)
                        .foregroundColor(.white)
                        .cornerRadius(6)
                }
            }

            Button(action: {
                cart.remove(productId: item.product.id)
            }) {
                Image(systemName: "trash")
                    .font(.system(size: 14))
                    .foregroundColor(.red.opacity(0.8))
                    .padding(6)
            }
        }
        .padding(14)
        .background(ShopTheme.surface)
        .cornerRadius(14)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(ShopTheme.cardBorder, lineWidth: 1)
        )
    }
}
