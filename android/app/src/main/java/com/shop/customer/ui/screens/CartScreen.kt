package com.shop.customer.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shop.customer.data.local.Localization
import com.shop.customer.data.models.CartItem
import com.shop.customer.ui.theme.*

@Composable
fun CartScreen(
    cartItems: List<CartItem>,
    language: String = "en",
    onIncrement: (Int) -> Unit,
    onDecrement: (Int) -> Unit,
    onRemove: (Int) -> Unit,
    onProceedToCheckout: () -> Unit
) {
    val subtotal = cartItems.sumOf { it.total }
    val deliveryFee = if (subtotal == 0.0 || subtotal >= 500.0) 0.0 else 40.0
    val discount = if (subtotal >= 1000.0) kotlin.math.round(subtotal * 0.10) else 0.0
    val grandTotal = maxOf(0.0, subtotal + deliveryFee - discount)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AppBackground)
    ) {
        if (cartItems.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        Icons.Default.ShoppingCart,
                        contentDescription = null,
                        tint = TextSecondary.copy(alpha = 0.5f),
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = Localization.get("cart_empty_title", language),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = Localization.get("cart_empty_desc", language),
                        fontSize = 13.sp,
                        color = TextSecondary
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Free Delivery Promo
                if (subtotal < 500.0) {
                    item {
                        Card(
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = EmeraldLight),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "🚚 " + Localization.get("free_delivery_threshold", language).format(500.0 - subtotal),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = EmeraldForest,
                                modifier = Modifier.padding(12.dp)
                            )
                        }
                    }
                }

                // Cart Items List
                items(cartItems) { item ->
                    Card(
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = AppSurface),
                        border = CardDefaults.outlinedCardBorder().copy(brush = SolidColor(AppBorder)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = item.product.name,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = "${item.product.formattedPrice} / ${item.product.unit ?: Localization.get("unit_default", language)}",
                                    fontSize = 12.sp,
                                    color = TextSecondary
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "₹%.2f".format(item.total),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = EmeraldForest
                                )
                            }

                            // Stepper
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                IconButton(
                                    onClick = { onDecrement(item.product.id) },
                                    modifier = Modifier
                                        .size(30.dp)
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(EmeraldLight)
                                ) {
                                    Icon(Icons.Default.Remove, contentDescription = "Minus", tint = EmeraldForest, modifier = Modifier.size(14.dp))
                                }

                                Text(
                                    text = "${item.quantity}",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 4.dp)
                                )

                                IconButton(
                                    onClick = { onIncrement(item.product.id) },
                                    modifier = Modifier
                                        .size(30.dp)
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(EmeraldPrimary)
                                ) {
                                    Icon(Icons.Default.Add, contentDescription = "Plus", tint = Color.White, modifier = Modifier.size(14.dp))
                                }

                                IconButton(
                                    onClick = { onRemove(item.product.id) },
                                    modifier = Modifier.size(30.dp)
                                ) {
                                    Icon(Icons.Default.Delete, contentDescription = "Remove", tint = StatusRedFg.copy(alpha = 0.7f), modifier = Modifier.size(16.dp))
                                }
                            }
                        }
                    }
                }

                // Bill Summary Card
                item {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = AppSurface),
                        border = CardDefaults.outlinedCardBorder().copy(brush = SolidColor(AppBorder)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = Localization.get("bill_summary", language),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            Divider(color = AppBorder)
                            Spacer(modifier = Modifier.height(10.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(Localization.get("items_total", language), fontSize = 13.sp, color = TextSecondary)
                                Text("₹%.2f".format(subtotal), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                            }
                            Spacer(modifier = Modifier.height(6.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(Localization.get("delivery_fee", language), fontSize = 13.sp, color = TextSecondary)
                                if (deliveryFee == 0.0) {
                                    Text(Localization.get("free_delivery", language), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = EmeraldForest)
                                } else {
                                    Text("₹%.2f".format(deliveryFee), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                }
                            }

                            if (discount > 0.0) {
                                Spacer(modifier = Modifier.height(6.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(Localization.get("special_discount", language), fontSize = 13.sp, color = EmeraldForest)
                                    Text("-₹%.2f".format(discount), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = EmeraldForest)
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))
                            Divider(color = AppBorder)
                            Spacer(modifier = Modifier.height(10.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(Localization.get("grand_total", language), fontSize = 15.sp, fontWeight = FontWeight.Bold)
                                Text("₹%.2f".format(grandTotal), fontSize = 18.sp, fontWeight = FontWeight.Black, color = EmeraldForest)
                            }
                        }
                    }
                }
            }

            // Bottom Sticky Checkout Button
            Card(
                shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
                colors = CardDefaults.cardColors(containerColor = AppSurface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Button(
                    onClick = onProceedToCheckout,
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(Localization.get("proceed_checkout", language), fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        Text("₹%.2f ➔".format(grandTotal), fontSize = 16.sp, fontWeight = FontWeight.Black)
                    }
                }
            }
        }
    }
}
