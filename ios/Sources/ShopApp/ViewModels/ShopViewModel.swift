import Foundation
import Combine

@MainActor
public final class ShopViewModel: ObservableObject {
    @Published public var categories: [Category] = []
    @Published public var products: [Product] = []
    @Published public var selectedCategory: Category? = nil
    @Published public var searchQuery: String = ""
    @Published public var sortOption: String = "name"
    @Published public var isLoading: Bool = false
    @Published public var errorMessage: String? = nil

    public init() {}

    public func loadData() async {
        isLoading = true
        errorMessage = nil
        do {
            async let fetchedCategories = APIService.shared.fetchCategories()
            async let fetchedProducts = APIService.shared.fetchProducts(
                categoryId: selectedCategory?.id,
                search: searchQuery.isEmpty ? nil : searchQuery,
                sort: sortOption
            )
            self.categories = try await fetchedCategories
            self.products = try await fetchedProducts
            self.isLoading = false
        } catch {
            self.errorMessage = error.localizedDescription
            self.isLoading = false
        }
    }

    public func selectCategory(_ category: Category?) async {
        self.selectedCategory = category
        await loadProductsOnly()
    }

    public func search(_ query: String) async {
        self.searchQuery = query
        await loadProductsOnly()
    }

    public func setSort(_ sort: String) async {
        self.sortOption = sort
        await loadProductsOnly()
    }

    public func loadProductsOnly() async {
        isLoading = true
        do {
            self.products = try await APIService.shared.fetchProducts(
                categoryId: selectedCategory?.id,
                search: searchQuery.isEmpty ? nil : searchQuery,
                sort: sortOption
            )
            self.isLoading = false
        } catch {
            self.errorMessage = error.localizedDescription
            self.isLoading = false
        }
    }
}
