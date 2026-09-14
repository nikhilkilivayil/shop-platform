import SwiftUI

public struct OrdersListView: View {
    @EnvironmentObject private var auth: AuthStore
    @EnvironmentObject private var lang: LanguageStore
    @StateObject private var viewModel = OrdersViewModel()

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                ShopTheme.background.ignoresSafeArea()

                if !auth.isLoggedIn {
                    unauthenticatedView
                } else if viewModel.isLoading && viewModel.orders.isEmpty {
                    ProgressView()
                } else if viewModel.orders.isEmpty {
                    emptyOrdersView
                } else {
                    ordersListContent
                }
            }
            .navigationTitle(lang.t("orders_title"))
            .task {
                if let token = auth.token {
                    await viewModel.loadOrders(token: token)
                }
            }
        }
    }

    @ViewBuilder
    private var unauthenticatedView: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.crop.circle.badge.exclamationmark")
                .font(.system(size: 60))
                .foregroundColor(ShopTheme.textSecondary)

            Text(lang.t("orders_login_prompt"))
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(ShopTheme.textPrimary)

            Text(lang.t("orders_login_desc"))
                .font(.system(size: 13))
                .multilineTextAlignment(.center)
                .foregroundColor(ShopTheme.textSecondary)
                .padding(.horizontal, 32)
        }
        .padding()
    }

    @ViewBuilder
    private var emptyOrdersView: some View {
        VStack(spacing: 12) {
            Image(systemName: "shippingbox")
                .font(.system(size: 60))
                .foregroundColor(ShopTheme.textSecondary.opacity(0.5))

            Text(lang.t("orders_empty"))
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(ShopTheme.textPrimary)

            Text(lang.t("cart_empty_desc"))
                .font(.system(size: 13))
                .foregroundColor(ShopTheme.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding()
    }

    @ViewBuilder
    private var ordersListContent: some View {
        ScrollView {
            LazyVStack(spacing: 14) {
                ForEach(viewModel.orders) { order in
                    NavigationLink(destination: OrderDetailView(orderId: order.id, initialOrder: order)) {
                        OrderCardRow(order: order)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding()
        }
        .refreshable {
            if let token = auth.token {
                await viewModel.loadOrders(token: token)
            }
        }
    }
}

public struct OrderCardRow: View {
    public let order: Order
    @EnvironmentObject private var lang: LanguageStore

    public init(order: Order) {
        self.order = order
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            headerRow
            Divider()
            itemsSummaryRow
            footerRow
        }
        .padding(16)
        .background(ShopTheme.surface)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(ShopTheme.cardBorder, lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.02), radius: 6, x: 0, y: 3)
    }

    @ViewBuilder
    private var headerRow: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(order.displayOrderNumber)
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundColor(ShopTheme.textPrimary)

                Text(order.created_at)
                    .font(.system(size: 12))
                    .foregroundColor(ShopTheme.textSecondary)
            }

            Spacer()

            StatusBadge(status: order.status)
        }
    }

    @ViewBuilder
    private var itemsSummaryRow: some View {
        if let items = order.items, !items.isEmpty {
            let summaryText = "\(items.count) items: " + items.map { "\($0.product_name) (x\($0.quantity))" }.joined(separator: ", ")
            Text(summaryText)
                .font(.system(size: 13))
                .foregroundColor(ShopTheme.textSecondary)
                .lineLimit(2)
        }
    }

    @ViewBuilder
    private var footerRow: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(lang.t("grand_total"))
                    .font(.system(size: 11))
                    .foregroundColor(ShopTheme.textSecondary)
                Text(order.formattedTotal)
                    .font(.system(size: 17, weight: .heavy))
                    .foregroundColor(ShopTheme.primaryForest)
            }

            Spacer()

            HStack(spacing: 4) {
                Text(lang.t("order_details"))
                    .font(.system(size: 13, weight: .bold))
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .bold))
            }
            .foregroundColor(ShopTheme.primary)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(ShopTheme.primary.opacity(0.12))
            .cornerRadius(10)
        }
    }
}
