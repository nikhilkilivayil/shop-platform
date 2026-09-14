import SwiftUI

public struct HomeView: View {
    @StateObject private var viewModel = ShopViewModel()
    @EnvironmentObject private var cart: CartStore
    @EnvironmentObject private var lang: LanguageStore
    @State private var searchText: String = ""

    public init() {}

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Search Bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(ShopTheme.textSecondary)
                        TextField(lang.t("search_placeholder"), text: $searchText)
                            .foregroundColor(ShopTheme.textPrimary)
                            .tint(ShopTheme.primaryForest)
                            .onSubmit {
                                Task { await viewModel.search(searchText) }
                            }
                        if !searchText.isEmpty {
                            Button(action: {
                                searchText = ""
                                Task { await viewModel.search("") }
                            }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(ShopTheme.textSecondary)
                            }
                        }
                    }
                    .padding(12)
                    .background(ShopTheme.surface)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(ShopTheme.cardBorder, lineWidth: 1)
                    )
                    .padding(.horizontal)

                    // Hero Promo Banner
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("🛍️ \(lang.t("home_title"))")
                                    .font(.system(size: 18, weight: .heavy))
                                    .foregroundColor(.white)
                                Text(lang.t("home_subtitle"))
                                    .font(.system(size: 12))
                                    .foregroundColor(.white.opacity(0.9))
                            }
                            Spacer()
                        }
                    }
                    .padding(16)
                    .background(
                        LinearGradient(
                            colors: [ShopTheme.primaryForest, ShopTheme.primary],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .cornerRadius(16)
                    .padding(.horizontal)

                    // Category Filter Pills
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            Button(action: {
                                Task { await viewModel.selectCategory(nil) }
                            }) {
                                Text(lang.t("all_categories"))
                                    .font(.system(size: 13, weight: .bold))
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 8)
                                    .background(viewModel.selectedCategory == nil ? ShopTheme.primary : ShopTheme.surface)
                                    .foregroundColor(viewModel.selectedCategory == nil ? .white : ShopTheme.textPrimary)
                                    .cornerRadius(20)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 20)
                                            .stroke(ShopTheme.cardBorder, lineWidth: 1)
                                    )
                            }

                            ForEach(viewModel.categories) { cat in
                                Button(action: {
                                    Task { await viewModel.selectCategory(cat) }
                                }) {
                                    Text(cat.name)
                                        .font(.system(size: 13, weight: .bold))
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 8)
                                        .background(viewModel.selectedCategory?.id == cat.id ? ShopTheme.primary : ShopTheme.surface)
                                        .foregroundColor(viewModel.selectedCategory?.id == cat.id ? .white : ShopTheme.textPrimary)
                                        .cornerRadius(20)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 20)
                                                .stroke(ShopTheme.cardBorder, lineWidth: 1)
                                        )
                                }
                            }
                        }
                        .padding(.horizontal)
                    }

                    // Product Grid Header
                    HStack {
                        Text(viewModel.selectedCategory?.name ?? lang.t("all_categories"))
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(ShopTheme.textPrimary)
                        Spacer()
                        Text("\(viewModel.products.count) items")
                            .font(.system(size: 13))
                            .foregroundColor(ShopTheme.textSecondary)
                    }
                    .padding(.horizontal)

                    // Products Grid
                    if viewModel.isLoading {
                        ProgressView()
                            .padding(.vertical, 40)
                    } else if viewModel.products.isEmpty {
                        VStack(spacing: 8) {
                            Image(systemName: "basket")
                                .font(.system(size: 40))
                                .foregroundColor(ShopTheme.textSecondary)
                            Text("No products found")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(ShopTheme.textSecondary)
                        }
                        .padding(.vertical, 40)
                    } else {
                        LazyVGrid(columns: columns, spacing: 14) {
                            ForEach(viewModel.products) { product in
                                ProductCard(product: product)
                            }
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .background(ShopTheme.background)
            .navigationTitle(lang.t("tab_shop"))
            .refreshable {
                await viewModel.loadData()
            }
            .task {
                await viewModel.loadData()
            }
        }
    }
}
