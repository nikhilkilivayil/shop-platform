package com.shop.customer.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
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
import com.shop.customer.data.models.CartItem
import com.shop.customer.data.models.Order
import com.shop.customer.data.remote.ApiService
import com.shop.customer.ui.components.TrackingStepper
import com.shop.customer.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun CheckoutScreen(
    apiService: ApiService,
    prefManager: PreferencesManager,
    cartItems: List<CartItem>,
    language: String = "en",
    onBack: () -> Unit,
    onOrderSuccess: (Order) -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val savedUser = prefManager.getUser()

    var name by remember { mutableStateOf(savedUser?.name ?: "") }
    var phone by remember { mutableStateOf(savedUser?.phone ?: "") }
    var address by remember { mutableStateOf(savedUser?.address ?: "") }
    var city by remember { mutableStateOf(savedUser?.city ?: "Kochi") }
    var pincode by remember { mutableStateOf(savedUser?.pincode ?: "682001") }
    var notes by remember { mutableStateOf("") }
    var paymentMethod by remember { mutableStateOf("UPI") }

    var isSubmitting by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var placedOrder by remember { mutableStateOf<Order?>(null) }

    val subtotal = cartItems.sumOf { it.total }
    val deliveryFee = if (subtotal == 0.0 || subtotal >= 500.0) 0.0 else 40.0
    val discount = if (subtotal >= 1000.0) kotlin.math.round(subtotal * 0.10) else 0.0
    val grandTotal = maxOf(0.0, subtotal + deliveryFee - discount)

    val paymentOptions = listOf(
        "UPI" to "📲 UPI (GPay, PhonePe, Paytm, QR)",
        "CARD" to "💳 Debit / Credit Card",
        "NETBANKING" to "🏛️ Net Banking",
        "COD" to "💵 Cash on Delivery (COD)"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AppBackground)
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(AppSurface)
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary)
            }
            Text(
                text = Localization.get("checkout_title", language),
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        }

        if (placedOrder != null) {
            // Order Placed Success Screen
            val order = placedOrder!!
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    Icon(
                        Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = EmeraldPrimary,
                        modifier = Modifier.size(72.dp)
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = Localization.get("order_success_title", language),
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        color = TextPrimary
                    )
                }

                item {
                    Card(
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = AppSurface),
                        border = CardDefaults.outlinedCardBorder().copy(brush = SolidColor(AppBorder)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(Localization.get("order_number_label", language), fontSize = 12.sp, color = TextSecondary)
                            Text(order.orderNumber, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = EmeraldForest)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(Localization.get("total_amount_label", language), fontSize = 12.sp, color = TextSecondary)
                            Text(order.formattedTotal, fontSize = 20.sp, fontWeight = FontWeight.Black, color = TextPrimary)
                        }
                    }
                }

                item {
                    TrackingStepper(status = order.status, language = language)
                }

                item {
                    Button(
                        onClick = { onOrderSuccess(order) },
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(Localization.get("continue_shopping", language), fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
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

                // Address Card
                item {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = AppSurface),
                        border = CardDefaults.outlinedCardBorder().copy(brush = SolidColor(AppBorder)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(Localization.get("delivery_address_header", language), fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(12.dp))

                            OutlinedTextField(
                                value = name,
                                onValueChange = { name = it },
                                label = { Text(Localization.get("full_name", language)) },
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(modifier = Modifier.height(8.dp))

                            OutlinedTextField(
                                value = phone,
                                onValueChange = { phone = it },
                                label = { Text(Localization.get("phone_number", language)) },
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
                        }
                    }
                }

                // Payment Options Card
                item {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = AppSurface),
                        border = CardDefaults.outlinedCardBorder().copy(brush = SolidColor(AppBorder)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(Localization.get("payment_method_header", language), fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(12.dp))

                            paymentOptions.forEach { (code, label) ->
                                val selected = paymentMethod == code
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(if (selected) EmeraldLight else Color.Transparent)
                                        .clickable { paymentMethod = code }
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    RadioButton(
                                        selected = selected,
                                        onClick = { paymentMethod = code },
                                        colors = RadioButtonDefaults.colors(selectedColor = EmeraldPrimary)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = label,
                                        fontSize = 14.sp,
                                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                        color = TextPrimary
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Bottom Confirm Button
            Card(
                shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
                colors = CardDefaults.cardColors(containerColor = AppSurface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Button(
                    onClick = {
                        if (name.isBlank()) {
                            errorMessage = Localization.get("err_enter_name", language)
                            return@Button
                        }
                        if (phone.isBlank()) {
                            errorMessage = Localization.get("err_enter_phone", language)
                            return@Button
                        }
                        if (address.isBlank()) {
                            errorMessage = Localization.get("err_enter_address", language)
                            return@Button
                        }

                        isSubmitting = true
                        errorMessage = null

                        coroutineScope.launch {
                            try {
                                val order = apiService.createOrder(
                                    token = prefManager.getToken(),
                                    customerName = name,
                                    customerPhone = phone,
                                    deliveryAddress = address,
                                    city = city,
                                    pincode = pincode,
                                    items = cartItems,
                                    paymentMethod = paymentMethod,
                                    notes = notes
                                )
                                placedOrder = order
                            } catch (e: Exception) {
                                errorMessage = e.message ?: Localization.get("err_order_failed", language)
                            } finally {
                                isSubmitting = false
                            }
                        }
                    },
                    enabled = !isSubmitting,
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    if (isSubmitting) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(Localization.get("submitting_order", language))
                    } else {
                        Text("${Localization.get("confirm_order", language)} (₹%.2f)".format(grandTotal), fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
