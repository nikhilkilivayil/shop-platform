package com.shop.customer.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Key
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shop.customer.data.local.Localization
import com.shop.customer.data.local.PreferencesManager
import com.shop.customer.data.remote.ApiService
import com.shop.customer.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    apiService: ApiService,
    prefManager: PreferencesManager,
    language: String = "en",
    onLoginSuccess: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    var phone by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }

    var otpSent by remember { mutableStateOf(false) }
    var isExistingUser by remember { mutableStateOf(false) }
    var existingUserName by remember { mutableStateOf("") }
    var testOtpCode by remember { mutableStateOf<String?>(null) }

    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(AppBackground)
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(10.dp))
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(70.dp)
                    .clip(CircleShape)
                    .background(EmeraldLight)
            ) {
                Icon(
                    Icons.Default.Key,
                    contentDescription = null,
                    tint = EmeraldForest,
                    modifier = Modifier.size(36.dp)
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = Localization.get("login_title", language),
                fontSize = 20.sp,
                fontWeight = FontWeight.Black,
                color = TextPrimary
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = Localization.get("login_desc", language),
                fontSize = 12.sp,
                color = TextSecondary,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
        }

        if (errorMessage != null) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = StatusRedBg),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = errorMessage!!,
                        color = StatusRedFg,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(10.dp)
                    )
                }
            }
        }

        if (successMessage != null) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = EmeraldLight),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = successMessage!!,
                        color = EmeraldForest,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(10.dp)
                    )
                }
            }
        }

        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = AppSurface),
                border = CardDefaults.outlinedCardBorder().copy(brush = SolidColor(AppBorder)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text("📱 ${Localization.get("mobile_label", language)}", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        placeholder = { Text("10-digit mobile number") },
                        prefix = { Text("+91  ", fontWeight = FontWeight.Bold) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    if (!otpSent) {
                        Button(
                            onClick = {
                                if (phone.length < 10) {
                                    errorMessage = Localization.get("err_enter_phone", language)
                                    return@Button
                                }
                                isLoading = true
                                errorMessage = null
                                coroutineScope.launch {
                                    try {
                                        val res = apiService.sendOtp(phone, prefManager.getDeviceId())
                                        otpSent = true
                                        testOtpCode = res.otp
                                        if (res.hasName == true) {
                                            isExistingUser = true
                                            existingUserName = res.userName ?: ""
                                        } else {
                                            isExistingUser = false
                                            existingUserName = ""
                                        }
                                        successMessage = res.message ?: "OTP sent successfully"
                                    } catch (e: Exception) {
                                        errorMessage = e.message ?: "Failed to send OTP"
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            },
                            enabled = !isLoading && phone.length >= 10,
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            if (isLoading) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                            } else {
                                Text(Localization.get("send_otp", language), fontWeight = FontWeight.Bold)
                            }
                        }
                    } else {
                        // Returning User Greeting without prompt for name!
                        if (isExistingUser) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(EmeraldLight)
                                    .padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = EmeraldForest, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = if (language == "ml") "തിരികെ സ്വാഗതം, $existingUserName! ദയവായി OTP നൽകുക:" else "Welcome back, $existingUserName! Please enter the OTP below:",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = EmeraldForest
                                )
                            }
                            Spacer(modifier = Modifier.height(10.dp))
                        } else {
                            Text("👤 ${Localization.get("name_label", language)}", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(6.dp))
                            OutlinedTextField(
                                value = name,
                                onValueChange = { name = it },
                                label = { Text(Localization.get("full_name", language)) },
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                        }

                        Text("🔑 ${Localization.get("otp_label", language)}", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(6.dp))
                        OutlinedTextField(
                            value = otp,
                            onValueChange = { otp = it },
                            placeholder = { Text("Enter 4-digit OTP") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth()
                        )

                        if (testOtpCode != null) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "💡 Test OTP: $testOtpCode",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = TextSecondary
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = {
                                if (otp.length < 4) {
                                    errorMessage = "Please enter 4-digit OTP"
                                    return@Button
                                }
                                if (!isExistingUser && name.isBlank()) {
                                    errorMessage = Localization.get("err_enter_name", language)
                                    return@Button
                                }
                                isLoading = true
                                errorMessage = null
                                coroutineScope.launch {
                                    try {
                                        val res = apiService.verifyOtp(phone, otp, name.ifEmpty { null }, prefManager.getDeviceId())
                                        if (res.token != null) {
                                            prefManager.saveToken(res.token)
                                            if (res.user != null) {
                                                prefManager.saveUser(res.user)
                                            }
                                            onLoginSuccess()
                                        } else {
                                            errorMessage = res.message ?: "Invalid OTP"
                                        }
                                    } catch (e: Exception) {
                                        errorMessage = e.message ?: "Verification failed"
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            },
                            enabled = !isLoading && otp.length >= 4,
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            if (isLoading) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                            } else {
                                Text(Localization.get("verify_login", language), fontWeight = FontWeight.Bold)
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        TextButton(
                            onClick = {
                                otpSent = false
                                otp = ""
                                errorMessage = null
                                successMessage = null
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(Localization.get("change_number", language), color = TextSecondary, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}
