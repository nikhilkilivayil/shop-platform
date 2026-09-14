package com.shop.customer.ui.screens

import android.media.MediaPlayer
import android.media.MediaRecorder
import android.util.Base64
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.shop.customer.data.local.Localization
import com.shop.customer.data.local.PreferencesManager
import com.shop.customer.data.models.SupportCallSession
import com.shop.customer.data.models.SupportMessage
import com.shop.customer.data.models.SupportThread
import com.shop.customer.data.remote.ApiService
import com.shop.customer.ui.theme.EmeraldPrimary
import com.shop.customer.ui.theme.EmeraldDark
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileInputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SupportScreen(
    apiService: ApiService,
    prefManager: PreferencesManager,
    language: String,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val listState = rememberLazyListState()

    var thread by remember { mutableStateOf<SupportThread?>(null) }
    var messages by remember { mutableStateOf<List<SupportMessage>>(emptyList()) }
    var inputText by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(true) }

    // Voice Recording State
    var isRecording by remember { mutableStateOf(false) }
    var recordingDuration by remember { mutableStateOf(0) }
    var mediaRecorder by remember { mutableStateOf<MediaRecorder?>(null) }
    var audioFile by remember { mutableStateOf<File?>(null) }

    // Audio Playback
    var playingMsgId by remember { mutableStateOf<Int?>(null) }
    var mediaPlayer by remember { mutableStateOf<MediaPlayer?>(null) }

    // Calling State
    var activeCall by remember { mutableStateOf<SupportCallSession?>(null) }
    var incomingCall by remember { mutableStateOf<SupportCallSession?>(null) }
    var callSeconds by remember { mutableStateOf(0) }
    var isMicMuted by remember { mutableStateOf(false) }
    var isCameraOn by remember { mutableStateOf(true) }

    val token = prefManager.getToken()
    val customerName = prefManager.getUser()?.name ?: "Customer"
    val customerPhone = prefManager.getUser()?.phone ?: ""

    // 1. Initial Setup: Create/Fetch thread and messages
    LaunchedEffect(Unit) {
        try {
            val t = apiService.getOrCreateSupportThread(customerName, customerPhone, token)
            thread = t
            messages = apiService.fetchSupportMessages(t.id, token)
            isLoading = false
            if (messages.isNotEmpty()) {
                listState.scrollToItem(messages.size - 1)
            }
        } catch (e: Exception) {
            isLoading = false
        }
    }

    // 2. Periodic Polling for Messages and Calls
    LaunchedEffect(thread) {
        val t = thread ?: return@LaunchedEffect
        while (true) {
            delay(2500)
            try {
                // Poll messages
                val updatedMsgs = apiService.fetchSupportMessages(t.id, token)
                if (updatedMsgs.size != messages.size) {
                    messages = updatedMsgs
                    listState.animateScrollToItem(updatedMsgs.size - 1)
                }

                // Poll incoming call if not in call
                if (activeCall == null) {
                    val call = apiService.checkActiveCall(t.id)
                    if (call != null && call.callerRole == "support" && call.status == "ringing") {
                        incomingCall = call
                    } else {
                        incomingCall = null
                    }
                }
            } catch (e: Exception) {
                // Ignore transient network errors
            }
        }
    }

    // Call duration timer
    LaunchedEffect(activeCall) {
        if (activeCall != null) {
            callSeconds = 0
            while (activeCall != null) {
                delay(1000)
                callSeconds++
            }
        }
    }

    // Clean up media recorder and player
    DisposableEffect(Unit) {
        onDispose {
            try {
                mediaRecorder?.release()
                mediaPlayer?.release()
            } catch (e: Exception) {}
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            Localization.get("support_title", language),
                            fontWeight = FontWeight.Bold,
                            fontSize = 17.sp
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(7.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF22C55E))
                            )
                            Spacer(Modifier.width(5.dp))
                            Text(
                                "Support Executive Online",
                                fontSize = 11.sp,
                                color = Color.Gray
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = {
                        val t = thread ?: return@IconButton
                        scope.launch {
                            try {
                                val call = apiService.startSupportCall(t.id, "audio", customerName, token)
                                activeCall = call
                            } catch (e: Exception) {}
                        }
                    }) {
                        Icon(Icons.Default.Phone, contentDescription = "Audio Call", tint = EmeraldPrimary)
                    }

                    IconButton(onClick = {
                        val t = thread ?: return@IconButton
                        scope.launch {
                            try {
                                val call = apiService.startSupportCall(t.id, "video", customerName, token)
                                activeCall = call
                            } catch (e: Exception) {}
                        }
                    }) {
                        Icon(Icons.Default.Videocam, contentDescription = "Video Call", tint = EmeraldPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Color(0xFFF8FAFC))
        ) {
            // Incoming Call Alert Banner
            AnimatedVisibility(visible = incomingCall != null) {
                incomingCall?.let { inc ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(8.dp),
                        colors = CardDefaults.cardColors(containerColor = EmeraldDark),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    if (inc.callType == "video") Icons.Default.Videocam else Icons.Default.Phone,
                                    contentDescription = null,
                                    tint = Color.White
                                )
                                Spacer(Modifier.width(8.dp))
                                Column {
                                    Text(
                                        Localization.get("incoming_call", language),
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                        fontSize = 13.sp
                                    )
                                    Text(
                                        inc.callerName,
                                        color = Color.White.copy(alpha = 0.85f),
                                        fontSize = 11.sp
                                    )
                                }
                            }

                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(
                                    onClick = {
                                        scope.launch {
                                            apiService.endSupportCall(inc.id)
                                            incomingCall = null
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color.Red),
                                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text("✕", fontSize = 12.sp, color = Color.White)
                                }

                                Button(
                                    onClick = {
                                        activeCall = inc
                                        incomingCall = null
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF22C55E)),
                                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text("✓", fontSize = 12.sp, color = Color.White)
                                }
                            }
                        }
                    }
                }
            }

            // Messages List
            Box(modifier = Modifier.weight(1f)) {
                if (isLoading) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = EmeraldPrimary)
                    }
                } else if (messages.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(
                            "No messages yet. Send a query to start.",
                            color = Color.Gray,
                            fontSize = 13.sp
                        )
                    }
                } else {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(messages) { msg ->
                            val isCustomer = msg.senderRole.equals("customer", ignoreCase = true)
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = if (isCustomer) Arrangement.End else Arrangement.Start
                            ) {
                                Column(
                                    horizontalAlignment = if (isCustomer) Alignment.End else Alignment.Start,
                                    modifier = Modifier.widthIn(max = 280.dp)
                                ) {
                                    Card(
                                        shape = RoundedCornerShape(
                                            topStart = 14.dp,
                                            topEnd = 14.dp,
                                            bottomStart = if (isCustomer) 14.dp else 2.dp,
                                            bottomEnd = if (isCustomer) 2.dp else 14.dp
                                        ),
                                        colors = CardDefaults.cardColors(
                                            containerColor = if (isCustomer) EmeraldPrimary else Color.White
                                        ),
                                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                                    ) {
                                        if (msg.messageType == "audio") {
                                            // Audio Message Bubble
                                            Row(
                                                modifier = Modifier.padding(10.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                val isPlaying = playingMsgId == msg.id
                                                IconButton(
                                                    onClick = {
                                                        if (isPlaying) {
                                                            mediaPlayer?.stop()
                                                            mediaPlayer?.release()
                                                            mediaPlayer = null
                                                            playingMsgId = null
                                                        } else {
                                                            try {
                                                                mediaPlayer?.release()
                                                                val mp = MediaPlayer()
                                                                var url = msg.content
                                                                if (!url.startsWith("http")) {
                                                                    val base = prefManager.getBaseUrl().replace("/api", "")
                                                                    url = base + url
                                                                }
                                                                mp.setDataSource(url)
                                                                mp.prepareAsync()
                                                                mp.setOnPreparedListener { it.start() }
                                                                mp.setOnCompletionListener {
                                                                    playingMsgId = null
                                                                }
                                                                mediaPlayer = mp
                                                                playingMsgId = msg.id
                                                            } catch (e: Exception) {
                                                                playingMsgId = null
                                                            }
                                                        }
                                                    }
                                                ) {
                                                    Icon(
                                                        if (isPlaying) Icons.Default.Stop else Icons.Default.PlayArrow,
                                                        contentDescription = "Play",
                                                        tint = if (isCustomer) Color.White else EmeraldPrimary
                                                    )
                                                }
                                                Spacer(Modifier.width(4.dp))
                                                Column {
                                                    Text(
                                                        "Voice Note",
                                                        fontWeight = FontWeight.Bold,
                                                        color = if (isCustomer) Color.White else Color.Black,
                                                        fontSize = 13.sp
                                                    )
                                                    Text(
                                                        "%.1fs".format(msg.audioDuration),
                                                        color = if (isCustomer) Color.White.copy(alpha = 0.8f) else Color.Gray,
                                                        fontSize = 11.sp
                                                    )
                                                }
                                            }
                                        } else {
                                            // Text Message Bubble
                                            Text(
                                                text = msg.content,
                                                color = if (isCustomer) Color.White else Color(0xFF1E293B),
                                                fontSize = 14.sp,
                                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                                            )
                                        }
                                    }

                                    // Meta info
                                    Text(
                                        text = "${msg.senderName} • ${msg.createdAt?.takeLast(8)?.take(5) ?: ""}",
                                        fontSize = 10.sp,
                                        color = Color.Gray,
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Bottom Input Bar
            Surface(
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 4.dp
            ) {
                if (isRecording) {
                    // Recording Active Bar
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(10.dp)
                            .background(Color(0xFFFEE2E2), RoundedCornerShape(24.dp))
                            .padding(horizontal = 14.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            "🔴 Recording: ${callSeconds}s",
                            color = Color(0xFF991B1B),
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )

                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            TextButton(onClick = {
                                try {
                                    mediaRecorder?.stop()
                                    mediaRecorder?.release()
                                    mediaRecorder = null
                                } catch (e: Exception) {}
                                isRecording = false
                            }) {
                                Text("Cancel", color = Color.Gray)
                            }

                            Button(
                                onClick = {
                                    try {
                                        mediaRecorder?.stop()
                                        mediaRecorder?.release()
                                        mediaRecorder = null
                                    } catch (e: Exception) {}
                                    isRecording = false

                                    val f = audioFile
                                    val t = thread
                                    if (f != null && f.exists() && t != null) {
                                        scope.launch {
                                            try {
                                                val bytes = FileInputStream(f).use { it.readBytes() }
                                                val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                                                val audioUrl = apiService.uploadVoiceNote(base64, "m4a", recordingDuration.toDouble())
                                                val newMsg = apiService.sendSupportMessage(
                                                    threadId = t.id,
                                                    content = audioUrl,
                                                    type = "audio",
                                                    duration = recordingDuration.toDouble(),
                                                    token = token,
                                                    senderName = customerName
                                                )
                                                messages = messages + newMsg
                                                listState.animateScrollToItem(messages.size - 1)
                                            } catch (e: Exception) {}
                                        }
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                            ) {
                                Text("Send", color = Color.White)
                            }
                        }
                    }
                } else {
                    // Regular Text Composer
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = inputText,
                            onValueChange = { inputText = it },
                            placeholder = { Text(Localization.get("type_message", language), fontSize = 13.sp) },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(24.dp),
                            maxLines = 3
                        )

                        // Voice Note Record Button
                        IconButton(
                            onClick = {
                                try {
                                    val f = File.createTempFile("voice_note_", ".m4a", context.cacheDir)
                                    audioFile = f
                                    val mr = MediaRecorder().apply {
                                        setAudioSource(MediaRecorder.AudioSource.MIC)
                                        setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                                        setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                                        setOutputFile(f.absolutePath)
                                        prepare()
                                        start()
                                    }
                                    mediaRecorder = mr
                                    isRecording = true
                                    recordingDuration = 0
                                } catch (e: Exception) {
                                    isRecording = false
                                }
                            },
                            modifier = Modifier
                                .size(42.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFE2E8F0))
                        ) {
                            Icon(Icons.Default.Mic, contentDescription = "Record", tint = EmeraldPrimary)
                        }

                        // Send Button
                        IconButton(
                            onClick = {
                                val t = thread ?: return@IconButton
                                val text = inputText.trim()
                                if (text.isNotEmpty()) {
                                    inputText = ""
                                    scope.launch {
                                        try {
                                            val newMsg = apiService.sendSupportMessage(
                                                threadId = t.id,
                                                content = text,
                                                type = "text",
                                                duration = 0.0,
                                                token = token,
                                                senderName = customerName
                                            )
                                            messages = messages + newMsg
                                            listState.animateScrollToItem(messages.size - 1)
                                        } catch (e: Exception) {}
                                    }
                                }
                            },
                            enabled = inputText.trim().isNotEmpty(),
                            modifier = Modifier
                                .size(42.dp)
                                .clip(CircleShape)
                                .background(if (inputText.trim().isNotEmpty()) EmeraldPrimary else Color.LightGray)
                        ) {
                            Icon(Icons.Default.Send, contentDescription = "Send", tint = Color.White)
                        }
                    }
                }
            }
        }
    }

    // In-App Call Dialog
    if (activeCall != null) {
        Dialog(
            onDismissRequest = {},
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF0B1320))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // Top header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                if (activeCall?.callType == "video") "Video Call" else "Audio Call",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                "%02d:%02d".format(callSeconds / 60, callSeconds % 60),
                                color = Color(0xFF22C55E),
                                fontSize = 13.sp
                            )
                        }
                    }

                    // Center Avatar / Video preview
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(120.dp)
                                .clip(CircleShape)
                                .background(EmeraldPrimary.copy(alpha = 0.3f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(90.dp)
                                    .clip(CircleShape)
                                    .background(EmeraldPrimary),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    if (activeCall?.callType == "video") Icons.Default.Videocam else Icons.Default.Headphones,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(44.dp)
                                )
                            }
                        }
                        Spacer(Modifier.height(16.dp))
                        Text(
                            "Vipani Support Executive",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Text(
                            "Connected with Live Support",
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 12.sp
                        )
                    }

                    // Controls
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 20.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = { isMicMuted = !isMicMuted },
                            modifier = Modifier
                                .size(54.dp)
                                .clip(CircleShape)
                                .background(if (isMicMuted) Color.Red else Color.White.copy(alpha = 0.2f))
                        ) {
                            Icon(
                                if (isMicMuted) Icons.Default.MicOff else Icons.Default.Mic,
                                contentDescription = "Mic",
                                tint = Color.White
                            )
                        }

                        if (activeCall?.callType == "video") {
                            IconButton(
                                onClick = { isCameraOn = !isCameraOn },
                                modifier = Modifier
                                    .size(54.dp)
                                    .clip(CircleShape)
                                    .background(if (!isCameraOn) Color.Red else Color.White.copy(alpha = 0.2f))
                            ) {
                                Icon(
                                    if (isCameraOn) Icons.Default.Videocam else Icons.Default.VideocamOff,
                                    contentDescription = "Camera",
                                    tint = Color.White
                                )
                            }
                        }

                        IconButton(
                            onClick = {
                                activeCall?.let {
                                    scope.launch { apiService.endSupportCall(it.id) }
                                }
                                activeCall = null
                            },
                            modifier = Modifier
                                .size(64.dp)
                                .clip(CircleShape)
                                .background(Color.Red)
                        ) {
                            Icon(Icons.Default.CallEnd, contentDescription = "End Call", tint = Color.White)
                        }
                    }
                }
            }
        }
    }
}
