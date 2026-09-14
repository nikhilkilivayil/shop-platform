# 🍎 Native iOS Customer App (ഷോപ്പ് ഐഫോൺ ആപ്പ്)

Built with **Swift 6 & SwiftUI** (Target: iOS 16+).

## 📁 പ്രൊജക്റ്റ് ഘടന (Project Structure)
- `Sources/ShopApp/Models/`: `Product`, `Category`, `CartItem`, `Order`, `UserProfile`
- `Sources/ShopApp/Services/`:
  - `APIService.swift` (Native `URLSession` async/await, Bearer auth)
  - `DeviceManager.swift` (Persistent unique Device ID)
- `Sources/ShopApp/ViewModels/`:
  - `ShopViewModel.swift` (Catalog, categories, search)
  - `CartStore.swift` (Shopping cart, quantity steppers, bill breakdown)
  - `AuthStore.swift` (Passwordless OTP login, detects existing customer to skip name prompt)
  - `OrdersViewModel.swift` (Master list & detailed view with live status tracking)
- `Sources/ShopApp/Views/`:
  - `MainTabView.swift` (Bottom TabBar: Shop, Categories, Cart with badge, Orders, Profile)
  - `HomeView.swift` & `CategoriesView.swift`
  - `CartView.swift` & `CheckoutView.swift` (UPI QR, Card, NetBanking, COD)
  - `OrdersListView.swift` & `OrderDetailView.swift` (Tracking stepper & invoice)
  - `LoginOTPView.swift` & `ProfileView.swift`

## 🚀 Run in Xcode

1. Open `ShopCustomer.xcodeproj` in this folder.
2. Select the **ShopCustomer** scheme and an iPhone simulator.
3. Press **Cmd + R** to build and launch the app.

The Xcode project builds the existing ShopApp sources as a library and links them to the ShopCustomer iOS app target. `Package.swift` remains available for package use. Opening the package alone does not provide an installable iOS app; use the Xcode project above.

The app connects to the local API at `http://localhost:3001/api`. Start the backend separately to load catalog data.
