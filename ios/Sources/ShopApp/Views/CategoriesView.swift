import SwiftUI

public struct CategoriesView: View {
    @StateObject private var viewModel = ShopViewModel()
    @EnvironmentObject private var lang: LanguageStore
    @State private var selectedCat: Category? = nil

    public init() {}

    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    ForEach(viewModel.categories) { category in
                        NavigationLink(destination: CategoryProductsView(category: category)) {
                            HStack(spacing: 16) {
                                ZStack {
                                    Circle()
                                        .fill(ShopTheme.primary.opacity(0.15))
                                        .frame(width: 50, height: 50)
                                    Text(category.icon ?? "🛍️")
                                        .font(.system(size: 24))
                                }

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(category.name)
                                        .font(.system(size: 16, weight: .bold))
                                        .foregroundColor(ShopTheme.textPrimary)

                                    if let desc = category.description, !desc.isEmpty {
                                        Text(desc)
                                            .font(.system(size: 12))
                                            .foregroundColor(ShopTheme.textSecondary)
                                            .lineLimit(2)
                                    }
                                }

                                Spacer()

                                Image(systemName: "chevron.right")
                                    .font(.system(size: 14, weight: .semibold))
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
                    }
                }
                .padding()
            }
            .background(ShopTheme.background)
            .navigationTitle(lang.t("tab_categories"))
            .task {
                await viewModel.loadData()
            }
        }
    }
}

struct CategoryProductsView: View {
    let category: Category
    @StateObject private var viewModel = ShopViewModel()

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if viewModel.isLoading {
                    ProgressView("ഉൽപ്പന്നങ്ങൾ ലഭ്യമാക്കുന്നു...")
                        .frame(maxWidth: .infinity, minHeight: 200)
                } else if viewModel.products.isEmpty {
                    Text("ഈ കാറ്റഗറിയിൽ ഉൽപ്പന്നങ്ങൾ ലഭ്യമല്ല")
                        .foregroundColor(ShopTheme.textSecondary)
                        .frame(maxWidth: .infinity, minHeight: 200)
                } else {
                    LazyVGrid(columns: columns, spacing: 14) {
                        ForEach(viewModel.products) { product in
                            ProductCard(product: product)
                        }
                    }
                    .padding()
                }
            }
        }
        .background(ShopTheme.background)
        .navigationTitle(category.name)
        .task {
            await viewModel.selectCategory(category)
        }
    }
}
