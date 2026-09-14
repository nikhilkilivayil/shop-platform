import SwiftUI

public struct CheckoutView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var cart: CartStore
    @EnvironmentObject private var auth: AuthStore
    @EnvironmentObject private var lang: LanguageStore
    @StateObject private var ordersVM = OrdersViewModel()

    @State private var name: String = ""
    @State private var phone: String = ""
    @State private var address: String = ""
    @State private var city: String = "Kochi"
    @State private var pincode: String = "682001"
    @State private var notes: String = ""
    @State private var paymentMethod: String = "UPI"
    @State private var placedOrder: Order? = nil
    @State private var isPlacing: Bool = false
    @State private var errorMessage: String? = nil

    public init() {}

    private var paymentOptions: [(String, String)] {
        [
            ("UPI", lang.t("pay_upi")),
            ("CARD", lang.t("pay_card")),
            ("NETBANKING", lang.t("pay_netbanking")),
            ("COD", lang.t("pay_cod"))
        ]
    }

    public var body: some View {
        ZStack {
            ShopTheme.background.ignoresSafeArea()

            if let order = placedOrder {
                successView(order)
            } else {
                formContent
            }
        }
        .navigationTitle(lang.t("checkout_title"))
        .onAppear {
            if let u = auth.currentUser {
                if name.isEmpty { name = u.name ?? "" }
                if phone.isEmpty { phone = u.phone ?? "" }
                if address.isEmpty { address = u.address ?? "" }
                if let c = u.city, !c.isEmpty { city = c }
                if let p = u.pincode, !p.isEmpty { pincode = p }
            }
        }
    }

    @ViewBuilder
    private func successView(_ order: Order) -> some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 70))
                .foregroundColor(ShopTheme.primary)

            Text(lang.t("order_success_title"))
                .font(.system(size: 22, weight: .heavy))
                .foregroundColor(ShopTheme.textPrimary)

            VStack(spacing: 8) {
                Text(lang.t("order_number_label"))
                    .font(.system(size: 13))
                    .foregroundColor(ShopTheme.textSecondary)
                Text(order.displayOrderNumber)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(ShopTheme.primaryForest)
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(ShopTheme.surface)
            .cornerRadius(12)

            TrackingStepper(status: order.status)

            Button(action: {
                cart.clear()
                dismiss()
            }) {
                Text(lang.t("continue_shopping"))
                    .font(.system(size: 16, weight: .bold))
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(ShopTheme.primary)
                    .foregroundColor(.white)
                    .cornerRadius(14)
            }
            .padding(.top, 10)
        }
        .padding(24)
    }

    @ViewBuilder
    private var formContent: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let err = errorMessage {
                    errorBanner(err)
                }
                addressCard
                paymentMethodCard
                orderTotalCard
                placeOrderButton
            }
            .padding()
        }
    }

    @ViewBuilder
    private func errorBanner(_ err: String) -> some View {
        Text(err)
            .font(.system(size: 13, weight: .semibold))
            .foregroundColor(.red)
            .padding(10)
            .frame(maxWidth: .infinity)
            .background(Color.red.opacity(0.1))
            .cornerRadius(8)
    }

    @ViewBuilder
    private var addressCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(lang.t("delivery_address_header"))
                .font(.system(size: 15, weight: .bold))
                .foregroundColor(ShopTheme.textPrimary)

            TextField(lang.t("full_name"), text: $name)
                .padding(10)
                .background(ShopTheme.background)
                .cornerRadius(8)

            TextField(lang.t("phone_number"), text: $phone)
                .appKeyboardTypeNumber()
                .padding(10)
                .background(ShopTheme.background)
                .cornerRadius(8)

            TextField(lang.t("street_address"), text: $address)
                .padding(10)
                .background(ShopTheme.background)
                .cornerRadius(8)

            HStack {
                TextField(lang.t("city"), text: $city)
                    .padding(10)
                    .background(ShopTheme.background)
                    .cornerRadius(8)

                TextField(lang.t("pincode"), text: $pincode)
                    .appKeyboardTypeNumber()
                    .padding(10)
                    .background(ShopTheme.background)
                    .cornerRadius(8)
            }

            TextField(lang.t("delivery_notes"), text: $notes)
                .padding(10)
                .background(ShopTheme.background)
                .cornerRadius(8)
        }
        .padding(16)
        .background(ShopTheme.surface)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(ShopTheme.cardBorder, lineWidth: 1)
        )
    }

    @ViewBuilder
    private var paymentMethodCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(lang.t("payment_method_header"))
                .font(.system(size: 15, weight: .bold))
                .foregroundColor(ShopTheme.textPrimary)

            ForEach(paymentOptions, id: \.0) { opt in
                let selected = paymentMethod == opt.0
                Button(action: {
                    paymentMethod = opt.0
                }) {
                    HStack {
                        Image(systemName: selected ? "largecircle.fill.circle" : "circle")
                            .foregroundColor(selected ? ShopTheme.primary : ShopTheme.textSecondary)

                        Text(opt.1)
                            .font(.system(size: 14, weight: selected ? .bold : .regular))
                            .foregroundColor(ShopTheme.textPrimary)

                        Spacer()
                    }
                    .padding(12)
                    .background(selected ? ShopTheme.primary.opacity(0.08) : Color.clear)
                    .cornerRadius(10)
                }
            }
        }
        .padding(16)
        .background(ShopTheme.surface)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(ShopTheme.cardBorder, lineWidth: 1)
        )
    }

    @ViewBuilder
    private var orderTotalCard: some View {
        HStack {
            Text(lang.t("total_payable"))
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(ShopTheme.textSecondary)
            Spacer()
            Text(String(format: "₹%.2f", cart.grandTotal))
                .font(.system(size: 18, weight: .heavy))
                .foregroundColor(ShopTheme.primaryForest)
        }
        .padding(16)
        .background(ShopTheme.surface)
        .cornerRadius(14)
    }

    @ViewBuilder
    private var placeOrderButton: some View {
        Button(action: {
            Task { await handlePlaceOrder() }
        }) {
            HStack {
                if isPlacing {
                    ProgressView().tint(.white)
                }
                Text(isPlacing ? lang.t("placing_order") : lang.t("confirm_order"))
                    .font(.system(size: 16, weight: .bold))
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(ShopTheme.primary)
            .foregroundColor(.white)
            .cornerRadius(14)
        }
        .disabled(isPlacing)
    }

    private func handlePlaceOrder() async {
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = lang.t("err_enter_name")
            return
        }
        guard !phone.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = lang.t("err_enter_phone")
            return
        }
        guard !address.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = lang.t("err_enter_address")
            return
        }

        isPlacing = true
        errorMessage = nil

        do {
            let order = try await ordersVM.placeOrder(
                token: auth.token,
                customerName: name,
                customerPhone: phone,
                deliveryAddress: address,
                city: city,
                pincode: pincode,
                items: cart.items,
                paymentMethod: paymentMethod,
                notes: notes
            )
            self.placedOrder = order
            self.isPlacing = false
        } catch {
            self.isPlacing = false
            self.errorMessage = error.localizedDescription
        }
    }
}
