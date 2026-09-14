package com.shop.customer.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shop.customer.data.local.Localization
import com.shop.customer.data.local.PreferencesManager
import com.shop.customer.data.remote.ApiService
import com.shop.customer.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun ProfileScreen(
    apiService: ApiService,
    prefManager: PreferencesManager,
    language: String = "en",
    onLanguageChange: (String) -> Unit = {},
    onLogout: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val user = prefManager.getUser()

    var name by remember { mutableStateOf(user?.name ?: "") }
    var email by remember { mutableStateOf(user?.email ?: "") }
    var address by remember { mutableStateOf(user?.address ?: "") }
    var city by remember { mutableStateOf(user?.city ?: "") }
    var pincode by remember { mutableStateOf(user?.pincode ?: "") }
    var baseUrl by remember { mutableStateOf(prefManager.getBaseUrl()) }

    var isSaving by remember { mutableStateOf(false) }
    var statusMessage by remember { mutableStateOf<String?>(null) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(AppBackground)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // User Info Card
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = AppSurface),
                border = CardDefaults.outlinedCardBorder().copy(brush = SolidColor(AppBorder)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .padding(20.dp)
                        .fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .size(70.dp)
                            .clip(CircleShape)
                            .background(EmeraldLight)
                    ) {
                        Text(
                            text = (user?.name?.take(1) ?: "U").uppercase(),
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Black,
                            color = EmeraldForest
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = user?.name ?: Localization.get("default_customer", language),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "📞 ${user?.phone ?: ""}",
                        fontSize = 13.sp,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(EmeraldLight)
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "${Localization.get("device_id", language)} ${prefManager.getDeviceId()}",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = EmeraldForest
                        )
                    }
                }
            }
        }

        // Language Switcher Card
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = AppSurface),
                border = CardDefaults.outlinedCardBorder().copy(brush = SolidColor(AppBorder)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = Localization.get("language_section", language),
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = Localization.get("language_hint", language),
                        fontSize = 12.sp,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        val isEn = language == "en"
                        Button(
                            onClick = { onLanguageChange("en") },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isEn) EmeraldPrimary else AppBackground
                            ),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(
                                text = "English",
                                color = if (isEn) Color.White else TextPrimary,
                                fontWeight = if (isEn) FontWeight.Bold else FontWeight.Normal
                            )
                        }

                        val isMl = language == "ml"
                        Button(
                            onClick = { onLanguageChange("ml") },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isMl) EmeraldPrimary else AppBackground
                            ),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(
                                text = "മലയാളം",
                                color = if (isMl) Color.White else TextPrimary,
                                fontWeight = if (isMl) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    }
                }
            }
        }

        if (statusMessage != null) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = EmeraldLight),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = statusMessage!!,
                        color = EmeraldForest,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(10.dp)
                    )
                }
            }
        }

        // Delivery Address Card
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = AppSurface),
                border = CardDefaults.outlinedCardBorder().copy(brush = SolidColor(AppBorder)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(Localization.get("saved_address", language), fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text(Localization.get("full_name", language)) },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text(Localization.get("email_optional", language)) },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = address,
                        onValueChange = { address = it },
                        label = { Text(Localization.get("street_address", language)) },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = city,
                            onValueChange = { city = it },
                            label = { Text(Localization.get("city", language)) },
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = pincode,
                            onValueChange = { pincode = it },
                            label = { Text(Localization.get("pincode", language)) },
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = {
                            val token = prefManager.getToken() ?: return@Button
                            isSaving = true
                            statusMessage = null
                            coroutineScope.launch {
                                try {
                                    val updated = apiService.updateUserProfile(
                                        token = token,
                                        name = name,
                                        email = email,
                                        address = address,
                                        city = city,
                                        pincode = pincode
                                    )
                                    prefManager.saveUser(updated)
                                    statusMessage = Localization.get("address_saved_success", language)
                                } catch (e: Exception) {
                                    statusMessage = "Error: ${e.message}"
                                } finally {
                                    isSaving = false
                                }
                            }
                        },
                        enabled = !isSaving,
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(if (isSaving) Localization.get("saving", language) else Localization.get("save_address_btn", language), fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Server Connection URL
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = AppSurface),
                border = CardDefaults.outlinedCardBorder().copy(brush = SolidColor(AppBorder)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("⚙️ API Endpoint URL", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = baseUrl,
                        onValueChange = {
                            baseUrl = it
                            prefManager.setBaseUrl(it)
                            apiService.updateBaseUrl(it)
                        },
                        label = { Text("Base API Endpoint") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Emulator: http://10.0.2.2:3001/api | Device: http://[YOUR-PC-IP]:3001/api", fontSize = 10.sp, color = TextSecondary)
                }
            }
        }

        // Logout
        item {
            Button(
                onClick = {
                    prefManager.clearToken()
                    onLogout()
                },
                colors = ButtonDefaults.buttonColors(containerColor = StatusRedBg),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.ExitToApp, contentDescription = null, tint = StatusRedFg)
                Spacer(modifier = Modifier.width(8.dp))
                Text(Localization.get("logout_btn", language), color = StatusRedFg, fontWeight = FontWeight.Bold)
            }
        }
    }
}
