import SwiftUI
import WebKit
import AVFoundation

public struct WebRTCCallView: View {
    let callId: String
    let callType: String
    let role: String
    let callerName: String
    let onCallEnded: () -> Void

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
                onCallEnded: {
                    onCallEnded()
                    dismiss()
                }
            )
            .ignoresSafeArea()
        }
        .onAppear {
            setupAudioSession()
        }
    }

    private func setupAudioSession() {
        #if os(iOS)
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .videoChat, options: [.defaultToSpeaker, .allowBluetooth])
            try session.setActive(true)
        } catch {
            print("Failed to configure audio session for call: \\(error)")
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

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.uiDelegate = context.coordinator
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.isScrollEnabled = false

        let cleanBase = APIService.shared.baseURL.replacingOccurrences(of: "/api", with: "")
        let encodedName = callerName.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "Customer"
        let urlString = "\\(cleanBase)/call.html?call_id=\\(callId)&role=\\(role)&type=\\(callType)&name=\\(encodedName)"

        if let url = URL(string: urlString) {
            let request = URLRequest(url: url)
            webView.load(request)
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

        @available(iOS 15.0, *)
        func webView(
            _ webView: WKWebView,
            requestMediaCapturePermissionFor origin: WKSecurityOrigin,
            initiatedByFrame frame: WKFrameInfo,
            type: WKMediaCaptureType,
            decisionHandler: @escaping (WKPermissionDecision) -> Void
        ) {
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
    let onCallEnded: () -> Void

    var body: some View {
        VStack {
            Text("WebRTC Call Active: \\(callId)")
            Button("End Call") {
                onCallEnded()
            }
        }
    }
}
#endif
