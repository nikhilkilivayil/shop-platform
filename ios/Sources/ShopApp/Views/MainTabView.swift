import SwiftUI

public struct MainTabView: View {
    @EnvironmentObject private var cart: CartStore
    @EnvironmentObject private var auth: AuthStore
    @EnvironmentObject private var lang: LanguageStore
    @State private var selectedTab = 0

    public init() {}

    public var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label(lang.t("tab_shop"), systemImage: "storefront")
                }
                .tag(0)

            CategoriesView()
                .tabItem {
                    Label(lang.t("tab_categories"), systemImage: "square.grid.2x2")
                }
                .tag(1)

            CartView()
                .tabItem {
                    Label(lang.t("tab_cart"), systemImage: "cart")
                }
                .badge(cart.totalCount > 0 ? "\(cart.totalCount)" : nil)
                .tag(2)

            OrdersListView()
                .tabItem {
                    Label(lang.t("tab_orders"), systemImage: "bag")
                }
                .tag(3)

            Group {
                if auth.isLoggedIn {
                    ProfileView()
                } else {
                    LoginOTPView()
                }
            }
            .tabItem {
                Label(lang.t("tab_profile"), systemImage: "person.circle")
            }
            .tag(4)
        }
        .tint(ShopTheme.primary)
    }
}
