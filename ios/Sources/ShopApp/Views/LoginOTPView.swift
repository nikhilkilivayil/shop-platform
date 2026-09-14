import SwiftUI

public struct LoginOTPView: View {
    @EnvironmentObject private var auth: AuthStore
    @EnvironmentObject private var lang: LanguageStore
    @State private var phone: String = ""
    @State private var otp: String = ""
    @State private var name: String = ""
    @State private var otpSent: Bool = false
    @State private var isLoading: Bool = false
    @State private var errorMessage: String? = nil
    @State private var successBanner: String? = nil

    public init() {}

    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    headerView

                    if let err = errorMessage {
                        errorCard(err)
                    }

                    if let msg = successBanner {
                        successCard(msg)
                    }

                    formCard
                }
                .padding(.vertical)
            }
            .background(ShopTheme.background)
            .navigationTitle(lang.t("login_title"))
        }
    }

    @ViewBuilder
    private var headerView: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .fill(ShopTheme.primary.opacity(0.15))
                    .frame(width: 70, height: 70)
                Image(systemName: "person.badge.key.fill")
                    .font(.system(size: 30))
                    .foregroundColor(ShopTheme.primaryForest)
            }

            Text(lang.t("login_title"))
                .font(.system(size: 20, weight: .heavy))
                .foregroundColor(ShopTheme.textPrimary)

            Text(lang.t("login_desc"))
                .font(.system(size: 13))
                .foregroundColor(ShopTheme.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 16)
        }
        .padding(.top, 10)
    }

    @ViewBuilder
    private func errorCard(_ err: String) -> some View {
        Text(err)
            .font(.system(size: 13, weight: .semibold))
            .foregroundColor(.red)
            .padding(10)
            .frame(maxWidth: .infinity)
            .background(Color.red.opacity(0.1))
            .cornerRadius(8)
            .padding(.horizontal)
    }

    @ViewBuilder
    private func successCard(_ msg: String) -> some View {
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
    private var formCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("📱 \(lang.t("mobile_label"))")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(ShopTheme.textPrimary)

            HStack {
                Text("+91")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(ShopTheme.textSecondary)
                    .padding(.leading, 8)

                TextField("10-digit mobile number", text: $phone)
                    .appKeyboardTypePhone()
                    .font(.system(size: 15))
            }
            .padding(12)
            .background(ShopTheme.background)
            .cornerRadius(10)

            if !otpSent {
                sendOtpButton
            } else {
                otpVerificationSection
            }
        }
        .padding(20)
        .background(ShopTheme.surface)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(ShopTheme.cardBorder, lineWidth: 1)
        )
        .padding(.horizontal)
    }

    @ViewBuilder
    private var sendOtpButton: some View {
        Button(action: {
            Task { await handleSendOtp() }
        }) {
            HStack {
                if isLoading {
                    ProgressView().tint(.white)
                }
                Text(isLoading ? lang.t("sending_otp") : lang.t("send_otp"))
                    .font(.system(size: 15, weight: .bold))
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(ShopTheme.primary)
            .foregroundColor(.white)
            .cornerRadius(12)
        }
        .disabled(isLoading || phone.count < 10)
    }

    @ViewBuilder
    private var otpVerificationSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            if auth.isExistingUser {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.seal.fill")
                        .foregroundColor(ShopTheme.primaryForest)
                    Text("Welcome back, **\(auth.existingUserName)**! Please enter the OTP below:")
                        .font(.system(size: 13))
                        .foregroundColor(ShopTheme.primaryForest)
                }
                .padding(10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(ShopTheme.primary.opacity(0.12))
                .cornerRadius(8)
            } else {
                Text("👤 \(lang.t("name_label"))")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(ShopTheme.textPrimary)

                TextField(lang.t("name_label"), text: $name)
                    .padding(12)
                    .background(ShopTheme.background)
                    .cornerRadius(10)
            }

            Text("🔑 \(lang.t("otp_label"))")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(ShopTheme.textPrimary)

            TextField("4-Digit OTP", text: $otp)
                .appKeyboardTypeNumber()
                .font(.system(size: 18, weight: .bold))
                .padding(12)
                .background(ShopTheme.background)
                .cornerRadius(10)

            if let sentCode = auth.lastSentOtpForDisplay {
                Text("💡 Test OTP: \(sentCode)")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(ShopTheme.textSecondary)
            }

            Button(action: {
                Task { await handleVerifyOtp() }
            }) {
                HStack {
                    if isLoading {
                        ProgressView().tint(.white)
                    }
                    Text(isLoading ? lang.t("verifying") : lang.t("verify_login"))
                        .font(.system(size: 15, weight: .bold))
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(ShopTheme.primary)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(isLoading || otp.count < 4)

            Button(action: {
                otpSent = false
                otp = ""
                errorMessage = nil
                successBanner = nil
            }) {
                Text(lang.t("change_number"))
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(ShopTheme.textSecondary)
                    .frame(maxWidth: .infinity)
            }
            .padding(.top, 4)
        }
    }

    private func handleSendOtp() async {
        guard phone.count >= 10 else {
            errorMessage = lang.t("err_enter_phone")
            return
        }
        isLoading = true
        errorMessage = nil
        do {
            let res = try await auth.sendOtp(phone: phone)
            self.otpSent = true
            self.isLoading = false
            self.successBanner = res.message ?? "OTP sent successfully."
        } catch {
            self.isLoading = false
            self.errorMessage = error.localizedDescription
        }
    }

    private func handleVerifyOtp() async {
        guard otp.count >= 4 else {
            errorMessage = "Please enter 4-digit OTP"
            return
        }
        if !auth.isExistingUser && name.trimmingCharacters(in: .whitespaces).isEmpty {
            errorMessage = lang.t("err_enter_name")
            return
        }

        isLoading = true
        errorMessage = nil
        do {
            try await auth.verifyOtp(phone: phone, otp: otp, name: name)
            self.isLoading = false
        } catch {
            self.isLoading = false
            self.errorMessage = error.localizedDescription
        }
    }
}
