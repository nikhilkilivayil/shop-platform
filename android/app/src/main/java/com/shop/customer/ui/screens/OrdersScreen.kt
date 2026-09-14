package com.shop.customer.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.ShoppingBag
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
import com.shop.customer.data.models.Order
import com.shop.customer.data.remote.ApiService
import com.shop.customer.ui.components.StatusBadge
import com.shop.customer.ui.components.TrackingStepper
import com.shop.customer.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun OrdersScreen(
    apiService: ApiService,
    prefManager: PreferencesManager,
    language: String = "en",
    onNavigateToLogin: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val token = prefManager.getToken()

    var orders by remember { mutableStateOf<List<Order>>(emptyList()) }
    var selectedOrder by remember { mutableStateOf<Order?>(null) }
    var isLoading by remember { mutableStateOf(false) }

    fun loadOrders() {
        if (token.isNullOrEmpty()) return
        coroutineScope.launch {
            isLoading = true
            try {
                orders = apiService.fetchUserOrders(token)
            } catch (e: Exception) {
                // handle error
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(token) {
        loadOrders()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AppBackground)
    ) {
        if (token.isNullOrEmpty()) {
            // Unauthenticated state
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(32.dp)
                ) {
                    Icon(
                        Icons.Default.ShoppingBag,
                        contentDescription = null,
                        tint = TextSecondary,
                        modifier = Modifier.size(60.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = Localization.get("orders_login_prompt", language),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = Localization.get("orders_login_desc", language),
                        fontSize = 13.sp,
                        color = TextSecondary,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(20.dp))
                    Button(
                        onClick = onNavigateToLogin,
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(Localization.get("login_button", language), fontWeight = FontWeight.Bold)
                    }
                }
            }
        } else if (selectedOrder != null) {
            // Detailed View
            val order = selectedOrder!!
            Column(modifier = Modifier.fillMaxSize()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(AppSurface)
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { selectedOrder = null }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                    Text(
                        text = Localization.get("back_to_orders", language),
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                }

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Header Card
                    item {
                        Card(
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = AppSurface),
                            border = CardDefaults.outlinedCardBorder().copy(brush = SolidColor(AppBorder)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(Localization.get("order_id", language), fontSize = 11.sp, color = TextSecondary)
                                        Text(order.orderNumber, fontSize = 18.sp, fontWeight = FontWeight.Black, color = TextPrimary)
                                    }
                                    StatusBadge(status = order.status, language = language)
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text("${Localization.get("date", language)} ${order.createdAt}", fontSize = 12.sp, color = TextSecondary)
                            }
                        }
                    }

                    // Stepper
                    item {
                        TrackingStepper(status = order.status, language = language)
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
                                Text(Localization.get("delivery_address_header", language), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(8.dp))
                                Divider(color = AppBorder)
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(order.customerName, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                Text("📞 ${order.customerPhone}", fontSize = 13.sp, color = TextSecondary)
                                Text("${order.deliveryAddress ?: ""}, ${order.city ?: ""} - ${order.pincode ?: ""}", fontSize = 13.sp, color = TextSecondary)
                            }
                        }
                    }

                    // Items List Card
                    item {
                        Card(
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = AppSurface),
                            border = CardDefaults.outlinedCardBorder().copy(brush = SolidColor(AppBorder)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(Localization.get("items_bought", language), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(8.dp))
                                Divider(color = AppBorder)
                                Spacer(modifier = Modifier.height(8.dp))

                                order.items.forEach { itm ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = 4.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(itm.productName, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                            Text("₹%.2f x %d".format(itm.price, itm.quantity), fontSize = 11.sp, color = TextSecondary)
                                        }
                                        Text("₹%.2f".format(itm.total), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                    }
                                }

                                Spacer(modifier = Modifier.height(10.dp))
                                Divider(color = AppBorder)
                                Spacer(modifier = Modifier.height(10.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(Localization.get("subtotal_label", language), fontSize = 13.sp, color = TextSecondary)
                                    Text("₹%.2f".format(order.subtotal), fontSize = 13.sp)
                                }
                                Spacer(modifier = Modifier.height(6.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(Localization.get("delivery_label", language), fontSize = 13.sp, color = TextSecondary)
                                    Text(if (order.deliveryFee == 0.0) Localization.get("free_delivery", language) else "₹%.2f".format(order.deliveryFee), fontSize = 13.sp)
                                }

                                if (order.discount > 0.0) {
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(Localization.get("discount_label", language), fontSize = 13.sp, color = EmeraldForest)
                                        Text("-₹%.2f".format(order.discount), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = EmeraldForest)
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))
                                Divider(color = AppBorder)
                                Spacer(modifier = Modifier.height(8.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(Localization.get("grand_total", language), fontSize = 15.sp, fontWeight = FontWeight.Bold)
                                    Text(order.formattedTotal, fontSize = 18.sp, fontWeight = FontWeight.Black, color = EmeraldForest)
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // Master List View
            Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                Text(
                    text = Localization.get("orders_title", language),
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(14.dp))

                if (isLoading) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressView()
                    }
                } else if (orders.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(Localization.get("orders_empty", language), color = TextSecondary)
                    }
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(orders) { order ->
                            Card(
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = AppSurface),
                                border = CardDefaults.outlinedCardBorder().copy(brush = SolidColor(AppBorder)),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { selectedOrder = order }
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(order.orderNumber, fontSize = 15.sp, fontWeight = FontWeight.Black, color = TextPrimary)
                                            Text(order.createdAt, fontSize = 11.sp, color = TextSecondary)
                                        }
                                        StatusBadge(status = order.status, language = language)
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))
                                    Divider(color = AppBorder)
                                    Spacer(modifier = Modifier.height(8.dp))

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(Localization.get("grand_total", language), fontSize = 11.sp, color = TextSecondary)
                                            Text(order.formattedTotal, fontSize = 16.sp, fontWeight = FontWeight.Black, color = EmeraldForest)
                                        }
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = "${order.items.size} ${Localization.get("items_count", language)}",
                                                fontSize = 12.sp,
                                                color = TextSecondary
                                            )
                                            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(16.dp))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
