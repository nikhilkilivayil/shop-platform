import SwiftUI

public struct OrderDetailView: View {
    public let orderId: String
    @State private var order: Order?
    @StateObject private var viewModel = OrdersViewModel()
    @EnvironmentObject private var lang: LanguageStore

    public init(orderId: String, initialOrder: Order? = nil) {
        self.orderId = orderId
        self._order = State(initialValue: initialOrder)
    }

    private var activeOrder: Order? {
        order ?? viewModel.selectedOrder
    }

    public var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let o = activeOrder {
                    orderHeaderCard(o)
                    TrackingStepper(status: o.status)
                    deliveryAddressCard(o)
                    itemsListCard(o)
                    billSummaryCard(o)
                    shareInvoiceButton(o)
                } else {
                    ProgressView()
                        .padding(.vertical, 40)
                }
            }
            .padding()
        }
        .background(ShopTheme.background)
        .navigationTitle(lang.t("order_details"))
        .task {
            await viewModel.loadOrderDetail(orderId: orderId)
            if let fetched = viewModel.selectedOrder {
                self.order = fetched
            }
        }
    }

    @ViewBuilder
    private func orderHeaderCard(_ o: Order) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(lang.t("order_id"))
                        .font(.system(size: 11))
                        .foregroundColor(ShopTheme.textSecondary)
                    Text(o.displayOrderNumber)
                        .font(.system(size: 18, weight: .heavy))
                        .foregroundColor(ShopTheme.textPrimary)
                }
                Spacer()
                StatusBadge(status: o.status)
            }

            Text("\(lang.t("date")) \(o.created_at)")
                .font(.system(size: 12))
                .foregroundColor(ShopTheme.textSecondary)
        }
        .padding(16)
        .background(ShopTheme.surface)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(ShopTheme.cardBorder, lineWidth: 1)
        )
    }

    @ViewBuilder
    private func deliveryAddressCard(_ o: Order) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "mappin.and.ellipse")
                    .foregroundColor(ShopTheme.primaryForest)
                Text(lang.t("delivery_address_header"))
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(ShopTheme.textPrimary)
            }

            Divider()

            Text(o.customer_name)
                .font(.system(size: 14, weight: .bold))
            Text("📞 \(o.customer_phone)")
                .font(.system(size: 13))
                .foregroundColor(ShopTheme.textSecondary)
            Text("\(o.delivery_address ?? ""), \(o.city ?? "") - \(o.pincode ?? "")")
                .font(.system(size: 13))
                .foregroundColor(ShopTheme.textSecondary)
        }
        .padding(16)
        .background(ShopTheme.surface)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(ShopTheme.cardBorder, lineWidth: 1)
        )
    }

    @ViewBuilder
    private func itemsListCard(_ o: Order) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(lang.t("items_bought"))
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(ShopTheme.textPrimary)

            Divider()

            if let items = o.items, !items.isEmpty {
                ForEach(items) { item in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.product_name)
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(ShopTheme.textPrimary)
                            Text("₹\(String(format: "%.2f", item.price)) x \(item.quantity)")
                                .font(.system(size: 11))
                                .foregroundColor(ShopTheme.textSecondary)
                        }
                        Spacer()
                        Text(String(format: "₹%.2f", item.total))
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(ShopTheme.textPrimary)
                    }
                    .padding(.vertical, 4)
                }
            } else {
                Text("No items")
                    .font(.system(size: 12))
                    .foregroundColor(ShopTheme.textSecondary)
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

    @ViewBuilder
    private func billSummaryCard(_ o: Order) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(lang.t("bill_summary"))
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(ShopTheme.textPrimary)

            Divider()

            HStack {
                Text("Payment Method:")
                    .foregroundColor(ShopTheme.textSecondary)
                Spacer()
                Text(o.payment_method.uppercased())
                    .font(.system(size: 13, weight: .bold))
            }
            .font(.system(size: 13))

            HStack {
                Text(lang.t("subtotal_label"))
                    .foregroundColor(ShopTheme.textSecondary)
                Spacer()
                Text(String(format: "₹%.2f", o.subtotal))
            }
            .font(.system(size: 13))

            HStack {
                Text(lang.t("delivery_label"))
                    .foregroundColor(ShopTheme.textSecondary)
                Spacer()
                Text(o.delivery_fee == 0 ? lang.t("free_delivery") : String(format: "₹%.2f", o.delivery_fee))
                    .foregroundColor(o.delivery_fee == 0 ? ShopTheme.primaryForest : ShopTheme.textPrimary)
            }
            .font(.system(size: 13))

            if o.discount > 0 {
                HStack {
                    Text(lang.t("discount_label"))
                        .foregroundColor(ShopTheme.primaryForest)
                    Spacer()
                    Text(String(format: "-₹%.2f", o.discount))
                        .foregroundColor(ShopTheme.primaryForest)
                }
                .font(.system(size: 13))
            }

            Divider()

            HStack {
                Text(lang.t("grand_total"))
                    .font(.system(size: 15, weight: .bold))
                Spacer()
                Text(o.formattedTotal)
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundColor(ShopTheme.primaryForest)
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

    @ViewBuilder
    private func shareInvoiceButton(_ o: Order) -> some View {
        ShareLink(
            item: "Shop Digital Invoice\nOrder: \(o.displayOrderNumber)\nCustomer: \(o.customer_name)\nTotal: \(o.formattedTotal)\nDate: \(o.created_at)",
            subject: Text("Shop Invoice - \(o.displayOrderNumber)"),
            message: Text("Invoice Details")
        ) {
            HStack {
                Image(systemName: "doc.text.fill")
                Text("🧾 Share Invoice")
                    .font(.system(size: 15, weight: .bold))
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(ShopTheme.surface)
            .foregroundColor(ShopTheme.primaryForest)
            .cornerRadius(14)
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(ShopTheme.primary, lineWidth: 1.5)
            )
        }
    }
}
