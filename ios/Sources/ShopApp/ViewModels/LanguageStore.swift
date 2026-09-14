import SwiftUI

public enum AppLanguage: String, CaseIterable, Identifiable, Sendable {
    case english = "en"
    case malayalam = "ml"

    public var id: String { rawValue }

    public var title: String {
        switch self {
        case .english: return "English"
        case .malayalam: return "മലയാളം"
        }
    }
}

public class LanguageStore: ObservableObject {
    public static let shared = LanguageStore()

    @Published public var language: AppLanguage {
        didSet {
            UserDefaults.standard.set(language.rawValue, forKey: "app_language")
        }
    }

    public init() {
        let saved = UserDefaults.standard.string(forKey: "app_language") ?? "en"
        self.language = AppLanguage(rawValue: saved) ?? .english
    }

    public func setLanguage(_ lang: AppLanguage) {
        self.language = lang
    }

    public func t(_ key: String) -> String {
        return Localization.text(key, lang: language)
    }
}

public struct Localization {
    public static func text(_ key: String, lang: AppLanguage) -> String {
        guard let entry = translations[key] else { return key }
        switch lang {
        case .english: return entry.en
        case .malayalam: return entry.ml
        }
    }

    private struct Entry {
        let en: String
        let ml: String
    }

    private static let translations: [String: Entry] = [
        // Tabs
        "tab_shop": Entry(en: "Shop", ml: "ഷോപ്പ്"),
        "tab_categories": Entry(en: "Categories", ml: "വിഭാഗങ്ങൾ"),
        "tab_cart": Entry(en: "Cart", ml: "കാർട്ട്"),
        "tab_orders": Entry(en: "Orders", ml: "ഓർഡറുകൾ"),
        "tab_profile": Entry(en: "Profile", ml: "പ്രൊഫൈൽ"),

        // Home
        "home_title": Entry(en: "Kerala Fresh Market", ml: "കേരള ഫ്രഷ് മാർക്കറ്റ്"),
        "home_subtitle": Entry(en: "Fresh groceries & daily essentials", ml: "ഗുണമേന്മയുള്ള സാധനങ്ങൾ വേഗത്തിൽ വീട്ടിലെത്തുന്നു"),
        "search_placeholder": Entry(en: "Search products...", ml: "സാധനങ്ങൾ തിരയുക..."),
        "all_categories": Entry(en: "All Categories", ml: "എല്ലാ വിഭാഗങ്ങളും"),
        "quick_add": Entry(en: "Add", ml: "ചേർക്കുക"),
        "in_cart": Entry(en: "In Cart", ml: "കാർട്ടിൽ"),
        "out_of_stock": Entry(en: "Out of Stock", ml: "സ്റ്റോക്കില്ല"),
        "unit_default": Entry(en: "unit", ml: "എണ്ണം"),

        // Cart
        "cart_title": Entry(en: "My Cart", ml: "കാർട്ട് (Cart)"),
        "cart_empty_title": Entry(en: "Your cart is empty", ml: "നിങ്ങളുടെ കാർട്ട് ശൂന്യമാണ്"),
        "cart_empty_desc": Entry(en: "Add fresh items from the store to your cart.", ml: "കടയിൽ നിന്ന് സാധനങ്ങൾ കാർട്ടിലേക്ക് ചേർക്കുക."),
        "cart_item_total": Entry(en: "Total: ₹%.2f", ml: "ആകെ: ₹%.2f"),
        "delivery_free_threshold_msg": Entry(en: "Add ₹%.2f more for FREE delivery!", ml: "₹%.2f രൂപയ്ക്ക് കൂടി വാങ്ങിയാൽ സൗജന്യ ഡെലിവറി!"),
        "bill_summary": Entry(en: "Bill Summary", ml: "ബിൽ വിവരങ്ങൾ (Bill Summary)"),
        "items_total": Entry(en: "Items Total", ml: "സാധനങ്ങളുടെ തുക (Items Total)"),
        "delivery_fee": Entry(en: "Delivery Fee", ml: "ഡെലിവറി നിരക്ക് (Delivery Fee)"),
        "free_delivery": Entry(en: "FREE", ml: "സൗജന്യം (FREE)"),
        "special_discount": Entry(en: "Special Discount (10% Off)", ml: "പ്രത്യേക ഡിസ്കൗണ്ട് (10% Off)"),
        "grand_total": Entry(en: "Grand Total", ml: "ആകെ തുക (Grand Total)"),
        "proceed_checkout": Entry(en: "Proceed to Checkout", ml: "ഓർഡർ ചെയ്യുക (Checkout)"),

        // Checkout
        "checkout_title": Entry(en: "Checkout", ml: "ചെക്ക്ഔട്ട് (Checkout)"),
        "delivery_address_header": Entry(en: "📍 Delivery Address", ml: "📍 ഡെലിവറി വിലാസം (Delivery Address)"),
        "full_name": Entry(en: "Full Name", ml: "നിങ്ങളുടെ പേര് (Full Name)"),
        "phone_number": Entry(en: "Mobile Number (10-digits)", ml: "മൊബൈൽ നമ്പർ (10-digit Phone)"),
        "street_address": Entry(en: "House / Flat / Street Address", ml: "വീട്ടുപേര് / ഫ്ലാറ്റ് / സ്ട്രീറ്റ് വിലാസം"),
        "city": Entry(en: "City / Location", ml: "നഗരം / സ്ഥലം (City)"),
        "pincode": Entry(en: "Pincode", ml: "പിൻകോഡ് (Pincode)"),
        "delivery_notes": Entry(en: "Delivery Notes (Optional)", ml: "ഡെലിവറി നിർദ്ദേശങ്ങൾ (Delivery Notes)"),
        "payment_method_header": Entry(en: "💳 Payment Method", ml: "💳 പേയ്‌മെന്റ് രീതി തിരഞ്ഞെടുക്കുക"),
        "pay_upi": Entry(en: "📲 UPI (GPay, PhonePe, Paytm, QR)", ml: "📲 UPI (GPay, PhonePe, Paytm, QR)"),
        "pay_card": Entry(en: "💳 Debit / Credit Card", ml: "💳 Debit / Credit Card"),
        "pay_netbanking": Entry(en: "🏛️ Net Banking", ml: "🏛️ Net Banking"),
        "pay_cod": Entry(en: "💵 Cash on Delivery (COD)", ml: "💵 Cash on Delivery (COD)"),
        "total_payable": Entry(en: "Total Payable Amount:", ml: "ആകെ അടയ്ക്കാനുള്ള തുക:"),
        "confirm_order": Entry(en: "Confirm & Place Order", ml: "ഓർഡർ ഉറപ്പാക്കുക (Confirm & Pay)"),
        "placing_order": Entry(en: "Placing Order...", ml: "ഓർഡർ സമർപ്പിക്കുന്നു..."),
        "order_success_title": Entry(en: "Order Placed Successfully!", ml: "ഓർഡർ വിജയകരമായി ലഭിച്ചു!"),
        "order_number_label": Entry(en: "Order Number:", ml: "ഓർഡർ നമ്പർ:"),
        "continue_shopping": Entry(en: "Continue Shopping (Done)", ml: "ഷോപ്പിംഗ് തുടരുക (Done)"),
        "err_enter_name": Entry(en: "Please enter your full name", ml: "ദയവായി നിങ്ങളുടെ പേര് നൽകുക"),
        "err_enter_phone": Entry(en: "Please enter 10-digit mobile number", ml: "ദയവായി മൊബൈൽ നമ്പർ നൽകുക"),
        "err_enter_address": Entry(en: "Please enter delivery address", ml: "ദയവായി ഡെലിവറി വിലാസം നൽകുക"),
        "cancel": Entry(en: "Cancel", ml: "റദ്ദാക്കുക"),

        // Orders
        "orders_title": Entry(en: "My Orders", ml: "എന്റെ ഓർഡറുകൾ (My Orders)"),
        "orders_empty": Entry(en: "No orders placed yet", ml: "ഓർഡറുകൾ ഒന്നും ചെയ്തിട്ടില്ല"),
        "orders_login_prompt": Entry(en: "Login to View Orders", ml: "ഓർഡറുകൾ കാണാൻ ലോഗിൻ ചെയ്യുക"),
        "orders_login_desc": Entry(en: "Login with your mobile number to view past orders and live tracking.", ml: "നിങ്ങളുടെ മുൻകാല ഓർഡറുകളും ലൈവ് ഡെലിവറി സ്റ്റാറ്റസും അറിയാൻ മൊബൈൽ നമ്പർ ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യുക."),
        "login_button": Entry(en: "Login Now", ml: "ലോഗിൻ ചെയ്യുക"),
        "order_id": Entry(en: "Order ID:", ml: "ഓർഡർ ഐഡി:"),
        "date": Entry(en: "Date:", ml: "തീയതി:"),
        "back_to_orders": Entry(en: "← Back to All Orders", ml: "← എല്ലാ ഓർഡറുകളിലേക്കും മടങ്ങുക"),
        "order_details": Entry(en: "Order Details", ml: "ഓർഡർ വിവരങ്ങൾ"),
        "items_bought": Entry(en: "Items Purchased", ml: "വാങ്ങിയ സാധനങ്ങൾ (Items List)"),
        "subtotal_label": Entry(en: "Subtotal:", ml: "സബ്ടോട്ടൽ:"),
        "delivery_label": Entry(en: "Delivery:", ml: "ഡെലിവറി നിരക്ക്:"),
        "discount_label": Entry(en: "Discount:", ml: "ഡിസ്കൗണ്ട്:"),

        // Profile
        "profile_title": Entry(en: "Profile", ml: "പ്രൊഫൈൽ (Profile)"),
        "default_customer": Entry(en: "Customer", ml: "കസ്റ്റമർ"),
        "device_id": Entry(en: "Device ID:", ml: "ഡിവൈസ് ഐഡി:"),
        "saved_address": Entry(en: "📍 Saved Delivery Address", ml: "📍 സ്ഥിരം ഡെലിവറി വിലാസം (Saved Address)"),
        "email_optional": Entry(en: "Email (Optional)", ml: "ഇമെയിൽ (ഓപ്ഷണൽ)"),
        "save_address_btn": Entry(en: "Save Delivery Address", ml: "വിലാസം സേവ് ചെയ്യുക (Save Address)"),
        "saving": Entry(en: "Saving...", ml: "സേവ് ചെയ്യുന്നു..."),
        "address_saved_success": Entry(en: "Address saved successfully!", ml: "വിലാസം വിജയകരമായി സേവ് ചെയ്തു!"),
        "logout_btn": Entry(en: "Logout", ml: "ലോഗൗട്ട് ചെയ്യുക (Logout)"),
        "language_section": Entry(en: "🌐 App Language (ഭാഷ)", ml: "🌐 ആപ്പ് ഭാഷ (App Language)"),
        "language_hint": Entry(en: "Select your preferred language", ml: "ആപ്പിലെ ഭാഷ തിരഞ്ഞെടുക്കുക"),

        // Login
        "login_title": Entry(en: "Customer Login", ml: "കസ്റ്റമർ ലോഗിൻ (OTP Login)"),
        "login_desc": Entry(en: "Enter your 10-digit mobile number to receive an OTP.", ml: "ഓർഡർ ചെയ്യാനും വിവരങ്ങൾ അറിയാനും നിങ്ങളുടെ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക."),
        "mobile_label": Entry(en: "Mobile Number", ml: "10 അക്ക മൊബൈൽ നമ്പർ"),
        "send_otp": Entry(en: "Send OTP", ml: "ഒടിപി അയക്കുക (Send OTP)"),
        "sending_otp": Entry(en: "Sending OTP...", ml: "ഒടിപി അയക്കുന്നു..."),
        "otp_title": Entry(en: "Enter OTP", ml: "ഒടിപി നൽകുക"),
        "otp_sent_to": Entry(en: "OTP has been sent to", ml: "ഒടിപി ഈ നമ്പറിലേക്ക് അയച്ചിരിക്കുന്നു:"),
        "otp_label": Entry(en: "4-Digit OTP", ml: "4 അക്ക ഒടിപി"),
        "name_label": Entry(en: "Your Name", ml: "നിങ്ങളുടെ പേര് (Name)"),
        "verify_login": Entry(en: "Verify & Continue", ml: "സ്ഥിരീകരിച്ച് ലോഗിൻ ചെയ്യുക"),
        "verifying": Entry(en: "Verifying...", ml: "സ്ഥിരീകരിക്കുന്നു..."),
        "change_number": Entry(en: "Change Number", ml: "മൊബൈൽ നമ്പർ മാറ്റുക"),

        // Tracking Stepper
        "step_placed": Entry(en: "Order Placed", ml: "ഓർഡർ ലഭിച്ചു"),
        "step_placed_desc": Entry(en: "Order received & confirmed", ml: "ഓർഡർ സ്വീകരിച്ചു"),
        "step_packing": Entry(en: "Processing", ml: "പാക്കിംഗ് നടക്കുന്നു"),
        "step_packing_desc": Entry(en: "Items being prepared", ml: "സാധനങ്ങൾ ശേഖരിക്കുന്നു"),
        "step_shipped": Entry(en: "Out for Delivery", ml: "ഡെലിവറിക്ക് ഇറങ്ങി"),
        "step_shipped_desc": Entry(en: "Driver on the way", ml: "ഡെലിവറി ബോയ് വഴിയിലാണ്"),
        "step_delivered": Entry(en: "Delivered", ml: "ഡെലിവറി ചെയ്തു"),
        "step_delivered_desc": Entry(en: "Order completed", ml: "ഓർഡർ ലഭിച്ചു കഴിഞ്ഞു")
    ]
}
