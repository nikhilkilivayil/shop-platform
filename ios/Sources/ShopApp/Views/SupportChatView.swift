import SwiftUI
import AVFoundation

public struct SupportChatView: View {
    @EnvironmentObject private var auth: AuthStore
    @EnvironmentObject private var lang: LanguageStore
    @Environment(\.dismiss) private var dismiss

    @State private var thread: SupportThread?
    @State private var messages: [SupportMessage] = []
    @State private var inputText: String = ""
    @State private var isLoading: Bool = true
    @State private var isSending: Bool = false

    // Audio Voice Note Recording
    @State private var isRecordingVoice: Bool = false
    @State private var audioRecorder: AVAudioRecorder?
    @State private var voiceRecordingTimer: Timer?
    @State private var recordingDuration: Double = 0
    @State private var recordedAudioURL: URL?

    // Audio Playback
    @State private var audioPlayer: AVPlayer?
    @State private var playingMessageId: Int?

    // In-App Calling
    @State private var activeCall: SupportCallSession?
    @State private var showCallSheet: Bool = false
    @State private var callDurationSeconds: Int = 0
    @State private var callTimer: Timer?
    @State private var isMicMuted: Bool = false
    @State private var isCameraOn: Bool = true
    @State private var incomingCall: SupportCallSession?
    @State private var showIncomingCallAlert: Bool = false

    // Polling Timer
    @State private var pollingTimer: Timer?

    public init() {}

    public var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Support Header Card
                supportHeaderBanner

                // Incoming Call Banner (if ringing)
                if let inc = incomingCall, showIncomingCallAlert {
                    incomingCallBanner(inc)
                }

                // Messages Stream
                messagesScrollView

                // Bottom Composer
                bottomComposerBar
            }
            .background(ShopTheme.background)
            .navigationTitle(lang.t("support_title"))
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(ShopTheme.textSecondary)
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    HStack(spacing: 12) {
                        Button(action: { Task { await initiateCall(type: "audio") } }) {
                            Image(systemName: "phone.fill")
                                .foregroundColor(ShopTheme.primaryForest)
                        }
                        Button(action: { Task { await initiateCall(type: "video") } }) {
                            Image(systemName: "video.fill")
                                .foregroundColor(ShopTheme.primaryForest)
                        }
                    }
                }
            }
            .sheet(isPresented: $showCallSheet) {
                activeCallView
            }
            .onAppear {
                Task {
                    await setupThreadAndMessages()
                    startPolling()
                }
            }
            .onDisappear {
                stopPolling()
                cleanupAudio()
            }
        }
    }

    // MARK: - Header Banner
    @ViewBuilder
    private var supportHeaderBanner: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(ShopTheme.primary.opacity(0.2))
                    .frame(width: 42, height: 42)
                Text("🎧")
                    .font(.system(size: 20))
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(lang.t("customer_care"))
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(ShopTheme.textPrimary)
                HStack(spacing: 4) {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 7, height: 7)
                    Text("Executive Online")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(ShopTheme.primaryForest)
                }
            }
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(ShopTheme.surface)
        .overlay(Divider(), alignment: .bottom)
    }

    // MARK: - Incoming Call Alert Banner
    @ViewBuilder
    private func incomingCallBanner(_ call: SupportCallSession) -> some View {
        HStack(spacing: 12) {
            Image(systemName: call.call_type == "video" ? "video.circle.fill" : "phone.circle.fill")
                .font(.system(size: 28))
                .foregroundColor(.white)

            VStack(alignment: .leading, spacing: 2) {
                Text(lang.t("incoming_call_from"))
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.white)
                Text(call.caller_name)
                    .font(.system(size: 11))
                    .foregroundColor(.white.opacity(0.85))
            }

            Spacer()

            Button(action: { declineIncomingCall(call) }) {
                Text(lang.t("decline_call"))
                    .font(.system(size: 11, weight: .bold))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.red)
                    .foregroundColor(.white)
                    .cornerRadius(6)
            }

            Button(action: { answerIncomingCall(call) }) {
                Text(lang.t("answer_call"))
                    .font(.system(size: 11, weight: .bold))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(6)
            }
        }
        .padding(12)
        .background(ShopTheme.primaryForest)
        .cornerRadius(12)
        .padding(.horizontal, 12)
        .padding(.top, 8)
        .transition(.move(edge: .top).combined(with: .opacity))
    }

    // MARK: - Messages Scroll View
    @ViewBuilder
    private var messagesScrollView: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 12) {
                    if isLoading {
                        ProgressView()
                            .padding(20)
                    } else if messages.isEmpty {
                        Text("No messages yet. Send a message to start chatting.")
                            .font(.system(size: 13))
                            .foregroundColor(ShopTheme.textSecondary)
                            .padding(30)
                    } else {
                        ForEach(messages) { msg in
                            messageRow(msg)
                                .id(msg.id)
                        }
                    }
                }
                .padding(16)
            }
            .onChange(of: messages.count) { _ in
                if let lastId = messages.last?.id {
                    withAnimation {
                        proxy.scrollTo(lastId, anchor: .bottom)
                    }
                }
            }
        }
    }

    // MARK: - Message Row
    @ViewBuilder
    private func messageRow(_ msg: SupportMessage) -> some View {
        let isCustomer = msg.sender_role.lowercased() == "customer"
        HStack {
            if isCustomer { Spacer(minLength: 50) }

            VStack(alignment: isCustomer ? .trailing : .leading, spacing: 4) {
                if msg.message_type == "audio" {
                    // Audio voice note bubble
                    HStack(spacing: 8) {
                        Button(action: { togglePlayAudio(msg) }) {
                            Image(systemName: playingMessageId == msg.id ? "stop.circle.fill" : "play.circle.fill")
                                .font(.system(size: 28))
                                .foregroundColor(isCustomer ? .white : ShopTheme.primaryForest)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Voice Note")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(isCustomer ? .white : ShopTheme.textPrimary)
                            Text(String(format: "%.1fs", msg.audio_duration ?? 0.0))
                                .font(.system(size: 11))
                                .foregroundColor(isCustomer ? .white.opacity(0.8) : ShopTheme.textSecondary)
                        }
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(isCustomer ? ShopTheme.primary : ShopTheme.surface)
                    .cornerRadius(16)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(isCustomer ? Color.clear : ShopTheme.cardBorder, lineWidth: 1)
                    )
                } else {
                    // Text message bubble
                    Text(msg.content)
                        .font(.system(size: 14))
                        .foregroundColor(isCustomer ? .white : ShopTheme.textPrimary)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(isCustomer ? ShopTheme.primary : ShopTheme.surface)
                        .cornerRadius(16)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(isCustomer ? Color.clear : ShopTheme.cardBorder, lineWidth: 1)
                        )
                }

                HStack(spacing: 4) {
                    Text(msg.sender_name)
                        .font(.system(size: 10, weight: .semibold))
                    Text("•")
                    Text(formatTime(msg.created_at))
                }
                .font(.system(size: 10))
                .foregroundColor(ShopTheme.textSecondary)
            }

            if !isCustomer { Spacer(minLength: 50) }
        }
    }

    // MARK: - Bottom Composer
    @ViewBuilder
    private var bottomComposerBar: some View {
        VStack(spacing: 0) {
            Divider()
            if isRecordingVoice {
                // Voice Recording in progress
                HStack(spacing: 12) {
                    Circle()
                        .fill(Color.red)
                        .frame(width: 12, height: 12)
                    Text("\(lang.t("recording_active")) (\(String(format: "%.1fs", recordingDuration)))")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.red)

                    Spacer()

                    Button("Cancel") {
                        cancelVoiceRecording()
                    }
                    .font(.system(size: 13))
                    .foregroundColor(ShopTheme.textSecondary)

                    Button(action: { Task { await sendVoiceRecording() } }) {
                        Image(systemName: "paperplane.fill")
                            .foregroundColor(.white)
                            .padding(8)
                            .background(ShopTheme.primary)
                            .clipShape(Circle())
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Color.red.opacity(0.08))
            } else {
                // Regular Text / Mic input
                HStack(spacing: 10) {
                    TextField(lang.t("type_message"), text: $inputText)
                        .appTextFieldStyle()
                        .frame(minHeight: 40)

                    // Voice Note Button
                    Button(action: { startVoiceRecording() }) {
                        Image(systemName: "mic.circle.fill")
                            .font(.system(size: 32))
                            .foregroundColor(ShopTheme.primaryForest)
                    }

                    // Send Button
                    Button(action: { Task { await sendTextMessage() } }) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: 32))
                            .foregroundColor(inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? ShopTheme.textSecondary : ShopTheme.primary)
                    }
                    .disabled(inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isSending)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(ShopTheme.surface)
            }
        }
    }

    // MARK: - Active In-Call View
    @ViewBuilder
    private var activeCallView: some View {
        if let call = activeCall {
            WebRTCCallView(
                callId: call.id,
                callType: call.call_type,
                role: "customer",
                callerName: auth.currentUser?.name ?? "Customer",
                onCallEnded: {
                    endCall()
                }
            )
        } else {
            EmptyView()
        }
    }

    // MARK: - Actions & Logic
    private func setupThreadAndMessages() async {
        let name = auth.currentUser?.name ?? "Customer"
        let phone = auth.currentUser?.phone ?? ""
        do {
            let t = try await APIService.shared.getOrCreateSupportThread(name: name, phone: phone, token: auth.token)
            self.thread = t
            let msgs = try await APIService.shared.fetchSupportMessages(threadId: t.id, token: auth.token)
            self.messages = msgs
            self.isLoading = false
        } catch {
            print("Failed to setup support thread: \(error)")
            self.isLoading = false
        }
    }

    private func startPolling() {
        pollingTimer?.invalidate()
        pollingTimer = Timer.scheduledTimer(withTimeInterval: 2.5, repeats: true) { _ in
            Task { @MainActor in
                guard let t = self.thread else { return }
                let currentToken = self.auth.token
                // 1. Refresh messages
                if let msgs = try? await APIService.shared.fetchSupportMessages(threadId: t.id, token: currentToken) {
                    self.messages = msgs
                }
                // 2. Check for active/incoming call
                if let call = try? await APIService.shared.checkActiveCall(threadId: t.id) {
                    if call.caller_role.lowercased() == "support" && call.status == "ringing" && self.activeCall == nil {
                        self.incomingCall = call
                        self.showIncomingCallAlert = true
                    }
                }
            }
        }
    }

    private func stopPolling() {
        pollingTimer?.invalidate()
        pollingTimer = nil
    }

    private func sendTextMessage() async {
        guard let t = thread else { return }
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        inputText = ""
        isSending = true
        let name = auth.currentUser?.name ?? "Customer"
        do {
            let newMsg = try await APIService.shared.sendSupportMessage(threadId: t.id, content: text, type: "text", duration: 0, token: auth.token, senderName: name)
            self.messages.append(newMsg)
        } catch {
            print("Failed to send message: \(error)")
        }
        isSending = false
    }

    // MARK: - Voice Recording
    private func startVoiceRecording() {
        #if os(iOS)
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.playAndRecord, mode: .default)
        } catch {
            print("AVAudioSession error: \(error)")
        }
        #endif

        let docDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = docDir.appendingPathComponent("voice_note_\(Date().timeIntervalSince1970).m4a")
        self.recordedAudioURL = fileURL

        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 12000,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]

        do {
            audioRecorder = try AVAudioRecorder(url: fileURL, settings: settings)
            audioRecorder?.record()
            isRecordingVoice = true
            recordingDuration = 0

            voiceRecordingTimer?.invalidate()
            voiceRecordingTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
                self.recordingDuration += 0.1
            }
        } catch {
            print("Audio recording failed: \(error)")
        }
    }

    private func cancelVoiceRecording() {
        audioRecorder?.stop()
        audioRecorder = nil
        voiceRecordingTimer?.invalidate()
        voiceRecordingTimer = nil
        isRecordingVoice = false
        recordingDuration = 0
    }

    private func sendVoiceRecording() async {
        audioRecorder?.stop()
        audioRecorder = nil
        voiceRecordingTimer?.invalidate()
        voiceRecordingTimer = nil
        isRecordingVoice = false

        guard let fileURL = recordedAudioURL, let t = thread else { return }
        guard let data = try? Data(contentsOf: fileURL) else { return }

        let base64 = data.base64EncodedString()
        let dur = max(1.0, recordingDuration)
        let name = auth.currentUser?.name ?? "Customer"

        do {
            let audioUrl = try await APIService.shared.uploadVoiceNote(base64Audio: base64, format: "m4a", duration: dur)
            let newMsg = try await APIService.shared.sendSupportMessage(threadId: t.id, content: audioUrl, type: "audio", duration: dur, token: auth.token, senderName: name)
            self.messages.append(newMsg)
        } catch {
            print("Failed to upload/send voice note: \(error)")
        }
    }

    private func togglePlayAudio(_ msg: SupportMessage) {
        if playingMessageId == msg.id {
            audioPlayer?.pause()
            playingMessageId = nil
            return
        }

        var fullUrlStr = msg.content
        if !fullUrlStr.hasPrefix("http") {
            let cleanBase = APIService.shared.baseURL.replacingOccurrences(of: "/api", with: "")
            fullUrlStr = cleanBase + fullUrlStr
        }

        guard let url = URL(string: fullUrlStr) else { return }
        audioPlayer = AVPlayer(url: url)
        audioPlayer?.play()
        playingMessageId = msg.id
    }

    // MARK: - Calling
    private func initiateCall(type: String) async {
        guard let t = thread else { return }
        let name = auth.currentUser?.name ?? "Customer"
        do {
            let session = try await APIService.shared.startSupportCall(threadId: t.id, callType: type, callerName: name, token: auth.token)
            self.activeCall = session
            self.showCallSheet = true
            startCallTimer()
        } catch {
            print("Call start failed: \(error)")
        }
    }

    private func answerIncomingCall(_ call: SupportCallSession) {
        self.activeCall = call
        self.showIncomingCallAlert = false
        self.showCallSheet = true
        startCallTimer()
    }

    private func declineIncomingCall(_ call: SupportCallSession) {
        self.showIncomingCallAlert = false
        self.incomingCall = nil
        Task {
            try? await APIService.shared.endSupportCall(callId: call.id)
        }
    }

    private func endCall() {
        if let call = activeCall {
            Task {
                try? await APIService.shared.endSupportCall(callId: call.id)
            }
        }
        stopCallTimer()
        self.activeCall = nil
        self.showCallSheet = false
    }

    private func startCallTimer() {
        callDurationSeconds = 0
        callTimer?.invalidate()
        callTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            self.callDurationSeconds += 1
        }
    }

    private func stopCallTimer() {
        callTimer?.invalidate()
        callTimer = nil
        callDurationSeconds = 0
    }

    private func cleanupAudio() {
        audioRecorder?.stop()
        audioPlayer?.pause()
        voiceRecordingTimer?.invalidate()
        callTimer?.invalidate()
    }

    private func formatTime(_ dateString: String?) -> String {
        guard let s = dateString else { return "" }
        if s.count >= 16 {
            return String(s.suffix(11).prefix(5))
        }
        return s
    }

    private func formatDuration(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%02d:%02d", m, s)
    }
}
