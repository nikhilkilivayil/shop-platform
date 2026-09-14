import SwiftUI

public struct ProfileView: View {
    @EnvironmentObject private var auth: AuthStore
    @EnvironmentObject private var lang: LanguageStore
    @State private var name: String = ""
    @State private var email: String = ""
    @State private var address: String = ""
    @State private var city: String = ""
    @State private var pincode: String = ""
    @State private var isSaving: Bool = false
    @State private var message: String? = nil
    @State private var serverUrl: String = APIService.shared.baseURL
    @State private var serverSavedMessage: String? = nil

    public init() {}

    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    profileHeaderCard

                    languageSelectorCard

                    if let msg = message {
                        statusMessageCard(msg)
                    }

                    savedAddressCard
                    serverConfigCard
                    logoutButton
                }
                .padding(.vertical)
            }
            .background(ShopTheme.background)
            .navigationTitle(lang.t("profile_title"))
            .onAppear {
                serverUrl = APIService.shared.baseURL
                if let u = auth.currentUser {
                    name = u.name ?? ""
                    email = u.email ?? ""
                    address = u.address ?? ""
                    city = u.city ?? ""
                    pincode = u.pincode ?? ""
                }
            }
        }
    }

    @ViewBuilder
    private var profileHeaderCard: some View {
        VStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(ShopTheme.primary.opacity(0.15))
                    .frame(width: 80, height: 80)
                Text(String(auth.currentUser?.name?.prefix(1) ?? "U"))
                    .font(.system(size: 32, weight: .heavy))
                    .foregroundColor(ShopTheme.primaryForest)
            }

            Text(auth.currentUser?.name ?? lang.t("default_customer"))
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(ShopTheme.textPrimary)

            Text("📞 \(auth.currentUser?.phone ?? "")")
                .font(.system(size: 14))
                .foregroundColor(ShopTheme.textSecondary)

            HStack(spacing: 4) {
                Text(lang.t("device_id"))
                    .font(.system(size: 11))
                    .foregroundColor(ShopTheme.textSecondary)
                Text(auth.deviceId)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(ShopTheme.primaryForest)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(ShopTheme.primary.opacity(0.1))
            .cornerRadius(8)
        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .background(ShopTheme.surface)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(ShopTheme.cardBorder, lineWidth: 1)
        )
        .padding(.horizontal)
    }

    @ViewBuilder
    private var languageSelectorCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(lang.t("language_section"))
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(ShopTheme.textPrimary)
                Spacer()
            }

            Text(lang.t("language_hint"))
                .font(.system(size: 12))
                .foregroundColor(ShopTheme.textSecondary)

            Picker("Language", selection: $lang.language) {
                ForEach(AppLanguage.allCases) { item in
                    Text(item.title).tag(item)
                }
            }
            .pickerStyle(.segmented)
        }
        .padding(16)
        .background(ShopTheme.surface)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(ShopTheme.cardBorder, lineWidth: 1)
        )
        .padding(.horizontal)
    }

    @ViewBuilder
    private func statusMessageCard(_ msg: String) -> some View {
        Text(msg)
            .font(.system(size: 13, weight: .semibold))
            .foregroundColor(ShopTheme.primaryForest)
            .padding(10)
            .frame(maxWidth: .infinity)
            .background(ShopTheme.primary.opacity(0.12))
            .cornerRadius(8)
            .padding(.horizontal)
    }

    @ViewBuilder
    private var savedAddressCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(lang.t("saved_address"))
                .font(.system(size: 15, weight: .bold))
                .foregroundColor(ShopTheme.textPrimary)

            TextField(lang.t("full_name"), text: $name)
                .padding(10)
                .background(ShopTheme.background)
                .cornerRadius(8)

            TextField(lang.t("email_optional"), text: $email)
                .appKeyboardTypeEmail()
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

            Button(action: {
                Task { await saveProfile() }
            }) {
                HStack {
                    if isSaving {
                        ProgressView().tint(.white)
                    }
                    Text(isSaving ? lang.t("saving") : lang.t("save_address_btn"))
                        .font(.system(size: 14, weight: .bold))
                }
                .frame(maxWidth: .infinity)
                .padding(12)
                .background(ShopTheme.primary)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
            .disabled(isSaving)
            .padding(.top, 6)
        }
        .padding(16)
        .background(ShopTheme.surface)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(ShopTheme.cardBorder, lineWidth: 1)
        )
        .padding(.horizontal)
    }

    @ViewBuilder
    private var serverConfigCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("⚙️ API Endpoint URL")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(ShopTheme.textPrimary)
                Spacer()
                Button("Default") {
                    APIService.shared.resetBaseURL()
                    serverUrl = APIService.shared.baseURL
                    serverSavedMessage = "Reset to default: \(APIService.shared.baseURL)"
                }
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(ShopTheme.primaryForest)
            }

            Text("Connect app to your public server or local test URL:")
                .font(.system(size: 12))
                .foregroundColor(ShopTheme.textSecondary)

            TextField("https://shop-platform-ky2m.onrender.com/api", text: $serverUrl)
                .font(.system(size: 13, design: .monospaced))
                .padding(10)
                .background(ShopTheme.background)
                .cornerRadius(8)

            if let msg = serverSavedMessage {
                Text(msg)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(ShopTheme.primaryForest)
            }

            Button(action: {
                APIService.shared.setBaseURL(serverUrl)
                serverUrl = APIService.shared.baseURL
                serverSavedMessage = "Saved! Connected to: \(serverUrl)"
            }) {
                Text("Save Server URL")
                    .font(.system(size: 13, weight: .bold))
                    .frame(maxWidth: .infinity)
                    .padding(10)
                    .background(ShopTheme.primaryForest)
                    .foregroundColor(.white)
                    .cornerRadius(8)
            }
        }
        .padding(16)
        .background(ShopTheme.surface)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(ShopTheme.cardBorder, lineWidth: 1)
        )
        .padding(.horizontal)
    }

    @ViewBuilder
    private var logoutButton: some View {
        Button(action: {
            auth.logout()
        }) {
            HStack {
                Image(systemName: "rectangle.portrait.and.arrow.right")
                Text(lang.t("logout_btn"))
                    .font(.system(size: 15, weight: .bold))
            }
            .frame(maxWidth: .infinity)
            .padding(14)
            .background(Color.red.opacity(0.1))
            .foregroundColor(.red)
            .cornerRadius(14)
        }
        .padding(.horizontal)
    }

    private func saveProfile() async {
        isSaving = true
        message = nil
        do {
            try await auth.updateProfile(name: name, email: email, address: address, city: city, pincode: pincode)
            self.message = lang.t("address_saved_success")
            self.isSaving = false
        } catch {
            self.message = "Error: \(error.localizedDescription)"
            self.isSaving = false
        }
    }
}
