import SwiftUI
import WebKit
import AVFoundation

public struct WebRTCCallView: View {
    let callId: String
    let callType: String
    let role: String
    let callerName: String
    let onCallEnded: () -> Void

    @State private var isLoading: Bool = true
    @Environment(\.dismiss) private var dismiss

    public init(
        callId: String,
        callType: String,
        role: String = "customer",
        callerName: String = "Customer",
        onCallEnded: @escaping () -> Void
    ) {
        self.callId = callId
        self.callType = callType
        self.role = role
        self.callerName = callerName
        self.onCallEnded = onCallEnded
    }

    public var body: some View {
        ZStack {
            Color(red: 15/255, green: 23/255, blue: 42/255)
                .ignoresSafeArea()

            WebRTCCallWebViewRepresentable(
                callId: callId,
                callType: callType,
                role: role,
                callerName: callerName,
                isLoading: $isLoading,
                onCallEnded: {
                    onCallEnded()
                    dismiss()
                }
            )
            .ignoresSafeArea()

            if isLoading {
                VStack(spacing: 16) {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(1.5)
                    Text(callType == "video" ? "വീഡിയോ കോൾ കണക്റ്റ് ചെയ്യുന്നു..." : "ഓഡിയോ കോൾ കണക്റ്റ് ചെയ്യുന്നു...")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.white)
                    Text("Connecting to Customer Care...")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.7))
                }
            }
        }
        .onAppear {
            requestPermissionsAndSetupAudio()
        }
    }

    private func requestPermissionsAndSetupAudio() {
        #if os(iOS)
        // 1. Request Microphone permission natively
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            print("Microphone native permission: \(granted)")
        }

        // 2. Request Camera permission natively if video
        if callType == "video" {
            AVCaptureDevice.requestAccess(for: .video) { granted in
                print("Camera native permission: \(granted)")
            }
        }

        // 3. Audio session speaker routing
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .videoChat, options: [.defaultToSpeaker, .allowBluetooth])
            try session.setActive(true)
        } catch {
            print("Failed to configure audio session for call: \(error)")
        }
        #endif
    }
}

#if os(iOS)
struct WebRTCCallWebViewRepresentable: UIViewRepresentable {
    let callId: String
    let callType: String
    let role: String
    let callerName: String
    @Binding var isLoading: Bool
    let onCallEnded: () -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> WKWebView {
        let contentController = WKUserContentController()
        contentController.add(context.coordinator, name: "callEnded")

        let config = WKWebViewConfiguration()
        config.userContentController = contentController
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.uiDelegate = context.coordinator
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1)
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.isScrollEnabled = false

        let cleanBase = APIService.shared.baseURL.replacingOccurrences(of: "/api", with: "")
        let encodedName = callerName.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "Customer"
        let urlString = "\(cleanBase)/call.html?call_id=\(callId)&role=\(role)&type=\(callType)&name=\(encodedName)"
        print("Loading WebRTC Call URL: \(urlString)")

        if let url = URL(string: urlString) {
            var request = URLRequest(url: url)
            request.cachePolicy = .reloadIgnoringLocalCacheData
            webView.load(request)
        } else {
            print("ERROR: Invalid WebRTC Call URL: \(urlString)")
        }

        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    class Coordinator: NSObject, WKUIDelegate, WKNavigationDelegate, WKScriptMessageHandler {
        var parent: WebRTCCallWebViewRepresentable

        init(_ parent: WebRTCCallWebViewRepresentable) {
            self.parent = parent
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            if message.name == "callEnded" {
                DispatchQueue.main.async {
                    self.parent.onCallEnded()
                }
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = false
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            print("WebRTC Call view didFail: \(error.localizedDescription)")
            DispatchQueue.main.async {
                self.parent.isLoading = false
            }
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            print("WebRTC Call view didFailProvisionalNavigation: \(error.localizedDescription)")
            DispatchQueue.main.async {
                self.parent.isLoading = false
            }
        }

        @available(iOS 15.0, *)
        func webView(
            _ webView: WKWebView,
            requestMediaCapturePermissionFor origin: WKSecurityOrigin,
            initiatedByFrame frame: WKFrameInfo,
            type: WKMediaCaptureType,
            decisionHandler: @escaping (WKPermissionDecision) -> Void
        ) {
            print("WKWebView granting media capture permission for type: \(type.rawValue)")
            decisionHandler(.grant)
        }
    }
}
#else
struct WebRTCCallWebViewRepresentable: View {
    let callId: String
    let callType: String
    let role: String
    let callerName: String
    @Binding var isLoading: Bool
    let onCallEnded: () -> Void

    var body: some View {
        VStack {
            Text("WebRTC Call Active: \(callId)")
            Button("End Call") {
                onCallEnded()
            }
        }
    }
}
#endif
