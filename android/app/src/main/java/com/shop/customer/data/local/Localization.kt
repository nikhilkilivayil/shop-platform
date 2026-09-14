package com.shop.customer.data.local

object Localization {
    private val translations = mapOf(
        // Tabs
        "tab_shop" to ("Shop" to "ഷോപ്പ്"),
        "tab_categories" to ("Categories" to "വിഭാഗങ്ങൾ"),
        "tab_cart" to ("Cart" to "കാർട്ട്"),
        "tab_orders" to ("Orders" to "ഓർഡറുകൾ"),
        "tab_profile" to ("Profile" to "പ്രൊഫൈൽ"),

        // Home
        "home_title" to ("Kerala Fresh Market" to "കേരള ഫ്രഷ് മാർക്കറ്റ്"),
        "home_subtitle" to ("Fresh groceries & daily essentials" to "ഫ്രഷ് പച്ചക്കറികൾ, പലചരക്ക് & പലഹാരങ്ങൾ നേരിട്ട് നിങ്ങളുടെ വീട്ടിൽ!"),
        "search_placeholder" to ("Search products..." to "സാധനങ്ങൾ തിരയുക..."),
        "all_categories" to ("All" to "എല്ലാം"),
        "all_products" to ("All Products" to "എല്ലാ ഉൽപ്പന്നങ്ങളും"),
        "quick_add" to ("Add" to "വാങ്ങുക +"),
        "in_cart" to ("In Cart" to "കാർട്ടിൽ"),
        "out_of_stock" to ("Out of Stock" to "സ്റ്റോക്കില്ല"),
        "unit_default" to ("unit" to "എണ്ണം"),
        "items_count" to ("items" to "ഇനങ്ങൾ"),
        "no_products" to ("No products found" to "ഉൽപ്പന്നങ്ങൾ ഒന്നും കണ്ടെത്തിയില്ല"),

        // Cart
        "cart_title" to ("My Cart" to "കാർട്ട്"),
        "cart_empty_title" to ("Your cart is empty" to "നിങ്ങളുടെ കാർട്ട് ശൂന്യമാണ്"),
        "cart_empty_desc" to ("Add items from the store to your cart." to "കടയിൽ നിന്ന് സാധനങ്ങൾ കാർട്ടിലേക്ക് ചേർക്കുക."),
        "bill_summary" to ("Bill Summary" to "ബിൽ വിവരങ്ങൾ"),
        "items_total" to ("Items Total" to "സാധനങ്ങളുടെ തുക"),
        "delivery_fee" to ("Delivery Fee" to "ഡെലിവറി നിരക്ക്"),
        "free_delivery" to ("FREE" to "സൗജന്യം"),
        "special_discount" to ("Special Discount (10% Off)" to "പ്രത്യേക ഡിസ്കൗണ്ട് (10% Off)"),
        "grand_total" to ("Grand Total" to "ആകെ തുക"),
        "proceed_checkout" to ("Proceed to Checkout" to "ഓർഡർ ചെയ്യുക (Checkout)"),
        "free_delivery_threshold" to ("Add ₹%.2f more for FREE delivery!" to "₹%.2f രൂപയ്ക്ക് കൂടി വാങ്ങിയാൽ സൗജന്യ ഡെലിവറി!"),

        // Checkout
        "checkout_title" to ("Checkout" to "ചെക്ക്ഔട്ട് (Checkout)"),
        "delivery_address_header" to ("📍 Delivery Address" to "📍 ഡെലിവറി വിലാസം (Delivery Address)"),
        "full_name" to ("Full Name" to "പേര് (Full Name)"),
        "phone_number" to ("Mobile Number" to "മൊബൈൽ നമ്പർ (Phone)"),
        "street_address" to ("House / Flat / Street Address" to "വീട്ടുപേര് / സ്ട്രീറ്റ് വിലാസം"),
        "city" to ("City" to "നഗരം (City)"),
        "pincode" to ("Pincode" to "പിൻകോഡ്"),
        "payment_method_header" to ("💳 Choose Payment Method" to "💳 പേയ്‌മെന്റ് രീതി തിരഞ്ഞെടുക്കുക"),
        "confirm_order" to ("Confirm Order" to "ഓർഡർ ഉറപ്പാക്കുക"),
        "submitting_order" to ("Placing order..." to "ഓർഡർ സമർപ്പിക്കുന്നു..."),
        "order_success_title" to ("Order Placed Successfully!" to "ഓർഡർ വിജയകരമായി ലഭിച്ചു!"),
        "order_number_label" to ("Order Number:" to "ഓർഡർ നമ്പർ:"),
        "total_amount_label" to ("Total Amount:" to "ആകെ തുക:"),
        "continue_shopping" to ("Continue Shopping (Done)" to "ഷോപ്പിംഗ് തുടരുക (Done)"),
        "err_enter_name" to ("Please enter your full name" to "ദയവായി നിങ്ങളുടെ പേര് നൽകുക"),
        "err_enter_phone" to ("Please enter mobile number" to "ദയവായി മൊബൈൽ നമ്പർ നൽകുക"),
        "err_enter_address" to ("Please enter delivery address" to "ദയവായി ഡെലിവറി വിലാസം നൽകുക"),
        "err_order_failed" to ("Failed to place order" to "ഓർഡർ സമർപ്പിക്കുന്നതിൽ പിശക് സംഭവിച്ചു"),

        // Orders
        "orders_title" to ("My Orders" to "എന്റെ ഓർഡറുകൾ (My Orders)"),
        "orders_empty" to ("No orders placed yet" to "ഓർഡറുകൾ ഒന്നും ചെയ്തിട്ടില്ല"),
        "orders_login_prompt" to ("Login to View Orders" to "ഓർഡറുകൾ കാണാൻ ലോഗിൻ ചെയ്യുക"),
        "orders_login_desc" to ("Login with your mobile number to view past orders and live tracking." to "നിങ്ങളുടെ മുൻകാല ഓർഡറുകളും ലൈവ് ഡെലിവറി സ്റ്റാറ്റസും അറിയാൻ മൊബൈൽ നമ്പർ ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യുക."),
        "login_button" to ("Login" to "ലോഗിൻ ചെയ്യുക"),
        "order_id" to ("Order ID:" to "ഓർഡർ ഐഡി:"),
        "date" to ("Date:" to "തീയതി:"),
        "back_to_orders" to ("← Back to All Orders" to "← എല്ലാ ഓർഡറുകളിലേക്കും മടങ്ങുക"),
        "items_bought" to ("Items Purchased" to "വാങ്ങിയ സാധനങ്ങൾ (Items List)"),
        "subtotal_label" to ("Subtotal:" to "സബ്ടോട്ടൽ:"),
        "delivery_label" to ("Delivery Fee:" to "ഡെലിവറി നിരക്ക്:"),
        "discount_label" to ("Discount:" to "ഡിസ്കൗണ്ട്:"),

        // Profile
        "profile_title" to ("Profile" to "പ്രൊഫൈൽ (Profile)"),
        "default_customer" to ("Customer" to "കസ്റ്റമർ"),
        "device_id" to ("Device ID:" to "ഡിവൈസ് ഐഡി:"),
        "saved_address" to ("📍 Saved Delivery Address" to "📍 സ്ഥിരം ഡെലിവറി വിലാസം (Saved Address)"),
        "email_optional" to ("Email (Optional)" to "ഇമെയിൽ (ഓപ്ഷണൽ)"),
        "save_address_btn" to ("Save Address" to "വിലാസം സേവ് ചെയ്യുക (Save Address)"),
        "saving" to ("Saving..." to "സേവ് ചെയ്യുന്നു..."),
        "address_saved_success" to ("Address saved successfully!" to "വിലാസം വിജയകരമായി സേവ് ചെയ്തു!"),
        "logout_btn" to ("Logout" to "ലോഗൗട്ട് ചെയ്യുക (Logout)"),
        "language_section" to ("🌐 App Language" to "🌐 ആപ്പ് ഭാഷ (App Language)"),
        "language_hint" to ("Select your preferred language" to "ആപ്പിലെ ഭാഷ തിരഞ്ഞെടുക്കുക"),
        "lang_english" to ("English" to "English"),
        "lang_malayalam" to ("മലയാളം" to "മലയാളം"),

        // Login
        "login_title" to ("Customer Login" to "കസ്റ്റമർ ലോഗിൻ"),
        "login_desc" to ("Enter your 10-digit mobile number to proceed." to "തുടരാൻ നിങ്ങളുടെ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക."),
        "mobile_label" to ("Mobile Number" to "10 അക്ക മൊബൈൽ നമ്പർ"),
        "send_otp" to ("Send OTP" to "ഒടിപി അയക്കുക"),
        "sending_otp" to ("Sending OTP..." to "ഒടിപി അയക്കുന്നു..."),
        "otp_title" to ("Enter OTP" to "ഒടിപി നൽകുക"),
        "otp_sent_to" to ("OTP sent to:" to "ഒടിപി അയച്ചിരിക്കുന്നു:"),
        "otp_label" to ("4-Digit OTP" to "4 അക്ക ഒടിപി"),
        "name_label" to ("Your Name" to "പേര് (Name)"),
        "verify_login" to ("Verify & Login" to "സ്ഥിരീകരിച്ച് ലോഗിൻ ചെയ്യുക"),
        "verifying" to ("Verifying..." to "സ്ഥിരീകരിക്കുന്നു..."),
        "change_number" to ("Change Number" to "നമ്പർ മാറ്റുക"),

        // Support Care
        "support_title" to ("Customer Support" to "കസ്റ്റമർ കെയർ (Support)"),
        "customer_care" to ("24x7 Customer Care" to "24x7 കസ്റ്റമർ കെയർ സപ്പോർട്ട്"),
        "support_subtitle" to ("Chat, voice note, or call our support team" to "സപ്പോർട്ട് എക്സിക്യൂട്ടീവുമായി ചാറ്റ് ചെയ്യാനും വിളിക്കാനും ഇവിടെ ക്ലിക്ക് ചെയ്യുക"),
        "type_message" to ("Type a message..." to "സന്ദേശം ടൈപ്പ് ചെയ്യുക..."),
        "record_voice" to ("Voice Note" to "വോയ്‌സ് നോട്ട്"),
        "audio_call" to ("Audio Call" to "ഓഡിയോ കോൾ"),
        "video_call" to ("Video Call" to "വീഡിയോ കോൾ"),
        "incoming_call" to ("Incoming Call!" to "ഇൻകമിംഗ് കോൾ!"),
        "call_connected" to ("Call Connected" to "കോൾ കണക്റ്റ് ചെയ്തു"),
        "end_call" to ("End Call" to "കോൾ അവസാനിപ്പിക്കുക")
    )

    fun get(key: String, lang: String = "en"): String {
        val pair = translations[key] ?: return key
        return if (lang == "ml") pair.second else pair.first
    }
}
