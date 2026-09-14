# 🤖 Native Android Customer App (ഷോപ്പ് ആൻഡ്രോയിഡ് ആപ്പ്)

Built with **Kotlin & Jetpack Compose (Material 3)** (Target: Android 8.0+ / API 26+).

## 📁 പ്രൊജക്റ്റ് ഘടന (Project Structure)
- `app/src/main/java/com/shop/customer/`:
  - `data/models/`: `Product`, `Category`, `CartItem`, `Order`, `User`
  - `data/remote/`: `ApiService.kt` (Coroutines, HttpURLConnection, JSON parser)
  - `data/local/`: `PreferencesManager.kt` (SharedPreferences, Device ID, Auth Token)
  - `ui/theme/`: Emerald Retail Branding Colors, Material 3 Theme
  - `ui/components/`: `ProductCard.kt`, `TrackingStepper.kt`, `StatusBadge.kt`
  - `ui/screens/`:
    - `HomeScreen.kt` (Search, Hero promo banner, Category chips, 2-column Product grid)
    - `CategoriesScreen.kt` (Category list with icons & descriptions)
    - `CartScreen.kt` (Quantity steppers, free delivery progress, bill summary, checkout button)
    - `CheckoutScreen.kt` (Delivery address, payment selector: UPI QR, Card, NetBanking, COD)
    - `OrdersScreen.kt` (Master orders list view + Detailed tracking stepper & digital bill)
    - `LoginScreen.kt` (Mobile OTP login, skips name field for returning users, Device ID)
    - `ProfileScreen.kt` (Saved address editor, custom backend API endpoint, logout)
  - `MainActivity.kt` (Root Activity with Scaffold & NavigationBar)

## 🚀 Android Studio-ൽ തുറക്കാനും റൺ ചെയ്യാനും (How to Run in Android Studio)
1. **Android Studio** തുറക്കുക.
2. **Open Existing Project** ക്ലിക്ക് ചെയ്ത് ഈ ഫോൾഡർ സെലക്ട് ചെയ്യുക:
   `/Users/nikhilkilivayil/.gemini/antigravity/scratch/shop_platform/android`
3. Gradle സിങ്ക് പൂർത്തിയായ ശേഷം ഏതെങ്കിലും എമുലേറ്ററോ ഫിസിക്കൽ ഫോണോ തിരഞ്ഞെടുത്ത് **Run (Shift + F10)** ക്ലിക്ക് ചെയ്യുക.
   *(എമുലേറ്ററിൽ സെർവർ ഓട്ടോമാറ്റിക്കായി `http://10.0.2.2:3001/api` വഴി കണക്റ്റാകും)*


## Verified local setup

- Gradle wrapper: 8.6; build JDK: 17 (configured on this Mac).
- Android Studio run configuration: **app**.
- Emulator: **Shop Pixel 6 API 34** (Android 14, ARM64).
- Open this Android folder, select the app and emulator, then choose **Run > Run app**.
- The emulator reaches the Mac's existing backend at `http://10.0.2.2:3001/api`.
- Command-line build: use JDK 17 and run `./gradlew :app:assembleDebug`.
