package com.shop.customer.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shop.customer.data.models.Product
import com.shop.customer.ui.theme.*

@Composable
fun StatusBadge(status: String, language: String = "en") {
    val (label, bg, fg) = when (status.lowercase()) {
        "delivered" -> Triple(if (language == "ml") "ലഭിച്ചു (Delivered)" else "Delivered", StatusGreenBg, StatusGreenFg)
        "shipped" -> Triple(if (language == "ml") "അയച്ചു (Shipped)" else "Shipped", StatusBlueBg, StatusBlueFg)
        "processing" -> Triple(if (language == "ml") "പാക്കിങ് (Processing)" else "Processing", StatusOrangeBg, StatusOrangeFg)
        "cancelled" -> Triple(if (language == "ml") "റദ്ദാക്കി (Cancelled)" else "Cancelled", StatusRedBg, StatusRedFg)
        else -> Triple(if (language == "ml") "ലഭിച്ചു (Pending)" else "Pending", AmberLight, StatusOrangeFg)
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bg)
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = fg
        )
    }
}

@Composable
fun TrackingStepper(status: String, language: String = "en") {
    val steps = if (language == "ml") {
        listOf(
            "ഓർഡർ ലഭിച്ചു",
            "പാക്കിങ് നടക്കുന്നു",
            "ഡെലിവറിക്ക് അയച്ചു",
            "ഡെലിവറി പൂർത്തിയായി"
        )
    } else {
        listOf(
            "Order Placed",
            "Processing",
            "Out for Delivery",
            "Delivered"
        )
    }

    val currentStep = when (status.lowercase()) {
        "processing" -> 1
        "shipped" -> 2
        "delivered" -> 3
        else -> 0
    }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = AppSurface),
        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(AppBorder)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "ഡെലിവറി സ്റ്റാറ്റസ് ട്രാക്കർ",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Spacer(modifier = Modifier.height(14.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                steps.forEachIndexed { index, stepName ->
                    val isDone = index < currentStep
                    val isCurrent = index == currentStep
                    val isFuture = index > currentStep

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.weight(1f)
                    ) {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(
                                    if (isDone || isCurrent) EmeraldPrimary else Color(0xFFE2E8F0)
                                )
                        ) {
                            if (isDone) {
                                Icon(
                                    Icons.Default.Check,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(16.dp)
                                )
                            } else {
                                Text(
                                    text = "${index + 1}",
                                    color = if (isCurrent) Color.White else TextSecondary,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = stepName,
                            fontSize = 9.sp,
                            textAlign = TextAlign.Center,
                            fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal,
                            color = if (isCurrent) EmeraldForest else TextSecondary,
                            maxLines = 2
                        )
                    }

                    if (index < steps.size - 1) {
                        Box(
                            modifier = Modifier
                                .weight(0.6f)
                                .height(3.dp)
                                .background(if (index < currentStep) EmeraldPrimary else Color(0xFFE2E8F0))
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ProductCard(
    product: Product,
    quantityInCart: Int,
    language: String = "en",
    onAddToCart: () -> Unit,
    onIncrement: () -> Unit,
    onDecrement: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = AppSurface),
        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(AppBorder)),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            // Top Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = product.categoryName ?: "General",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = EmeraldForest,
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(EmeraldLight)
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                )

                if (!product.inStock) {
                    Text(
                        text = if (language == "ml") "സ്റ്റോക്കില്ല" else "Out of Stock",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = StatusRedFg
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Product Name
            Text(
                text = product.name,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.height(40.dp)
            )

            // Unit
            Text(
                text = product.unit ?: "1 unit",
                fontSize = 11.sp,
                color = TextSecondary
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Price & Compare Price
            Row(
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = product.formattedPrice,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Black,
                    color = EmeraldForest
                )

                if (product.compareAtPrice != null && product.compareAtPrice > product.price) {
                    Text(
                        text = "₹%.2f".format(product.compareAtPrice),
                        fontSize = 12.sp,
                        textDecoration = TextDecoration.LineThrough,
                        color = TextSecondary
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Cart Action Buttons
            if (quantityInCart > 0) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    IconButton(
                        onClick = onDecrement,
                        modifier = Modifier
                            .size(32.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(EmeraldLight)
                    ) {
                        Icon(Icons.Default.Remove, contentDescription = "Decrease", tint = EmeraldForest, modifier = Modifier.size(16.dp))
                    }

                    Text(
                        text = "$quantityInCart",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    IconButton(
                        onClick = onIncrement,
                        modifier = Modifier
                            .size(32.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(EmeraldPrimary)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Increase", tint = Color.White, modifier = Modifier.size(16.dp))
                    }
                }
            } else {
                Button(
                    onClick = onAddToCart,
                    enabled = product.inStock,
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(vertical = 6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.ShoppingCart, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(if (language == "ml") "വാങ്ങുക +" else "Add +", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
