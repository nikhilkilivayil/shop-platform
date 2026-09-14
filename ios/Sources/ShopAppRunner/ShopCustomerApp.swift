import SwiftUI
import ShopApp

@main
struct ShopCustomerApp: App {
    @StateObject private var cart = CartStore.shared
    @StateObject private var auth = AuthStore.shared
    @StateObject private var lang = LanguageStore.shared

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environmentObject(cart)
                .environmentObject(auth)
                .environmentObject(lang)
                .preferredColorScheme(.light)
        }
    }
}
