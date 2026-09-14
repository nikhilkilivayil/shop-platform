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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
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

data class ProductVisualMeta(
    val emoji: String,
    val primaryColor: Color,
    val secondaryColor: Color
)

object ProductVisualResolver {
    fun resolve(name: String, nameMl: String? = null, categoryId: Int? = null, rawImageUrl: String? = null): ProductVisualMeta {
        val text = "$name ${nameMl ?: ""}".lowercase()

        if (!rawImageUrl.isNullOrEmpty()) {
            val emoji = extractEmoji(rawImageUrl)
            if (emoji != null) {
                val color = extractColor(rawImageUrl) ?: fallbackColor(categoryId)
                return ProductVisualMeta(emoji, color, color.copy(alpha = 0.82f))
            }
        }

        if (text.contains("honey") || text.contains("തേൻ")) {
            return ProductVisualMeta("🍯", Color(0xFFD97706), Color(0xFF92400E))
        } else if (text.contains("matta") || text.contains("മട്ട")) {
            return ProductVisualMeta("🍚", Color(0xFF8D3318), Color(0xFF5C200E))
        } else if (text.contains("coconut oil") || text.contains("വെളിച്ചെണ്ണ")) {
            return ProductVisualMeta("🥥", Color(0xFF1E6F5C), Color(0xFF134B3E))
        } else if (text.contains("rice") || text.contains("അരി")) {
            return ProductVisualMeta("🌾", Color(0xFF2E4057), Color(0xFF1D2A3A))
        } else if (text.contains("pepper") || text.contains("കുരുമുളക്")) {
            return ProductVisualMeta("🌱", Color(0xFF3A3845), Color(0xFF222129))
        } else if (text.contains("cardamom") || text.contains("ഏലയ്ക്ക")) {
            return ProductVisualMeta("🌿", Color(0xFF2D6A4F), Color(0xFF1B4332))
        } else if (text.contains("banana") || text.contains("നേന്ത്ര")) {
            return ProductVisualMeta("🍌", Color(0xFFE3A857), Color(0xFFB87F30))
        } else if (text.contains("coconut") || text.contains("തേങ്ങ")) {
            return ProductVisualMeta("🥥", Color(0xFF6B4423), Color(0xFF432A14))
        } else if (text.contains("chips") || text.contains("ഉപ്പേരി") || text.contains("വറുത്തത്")) {
            return ProductVisualMeta("🍟", Color(0xFFD4A373), Color(0xFFA87648))
        } else if (text.contains("tea") || text.contains("തേയില") || text.contains("ചായ")) {
            return ProductVisualMeta("☕", Color(0xFFA44A3F), Color(0xFF6B2B23))
        } else if (text.contains("milk") || text.contains("പാൽ")) {
            return ProductVisualMeta("🥛", Color(0xFF4A90E2), Color(0xFF2B6CB0))
        } else if (text.contains("soap") || text.contains("സോപ്പ്")) {
            return ProductVisualMeta("🧼", Color(0xFF588157), Color(0xFF344E33))
        } else if (text.contains("jar") || text.contains("storage") || text.contains("പാത്രം")) {
            return ProductVisualMeta("🏺", Color(0xFF3D5A80), Color(0xFF243750))
        }

        return when (categoryId) {
            1 -> ProductVisualMeta("🌾", Color(0xFF1E6F5C), Color(0xFF134B3E))
            2 -> ProductVisualMeta("🥬", Color(0xFF2D6A4F), Color(0xFF1B4332))
            3 -> ProductVisualMeta("🌶️", Color(0xFFA44A3F), Color(0xFF6B2B23))
            4 -> ProductVisualMeta("☕", Color(0xFFD4A373), Color(0xFFA87648))
            5 -> ProductVisualMeta("🥛", Color(0xFF4A90E2), Color(0xFF2B6CB0))
            6 -> ProductVisualMeta("🏠", Color(0xFF588157), Color(0xFF344E33))
            else -> ProductVisualMeta("📦", Color(0xFF0F766E), Color(0xFF094D48))
        }
    }

    private fun fallbackColor(catId: Int?): Color = when (catId) {
        1 -> Color(0xFF1E6F5C)
        2 -> Color(0xFF2D6A4F)
        3 -> Color(0xFFA44A3F)
        4 -> Color(0xFFD4A373)
        5 -> Color(0xFF4A90E2)
        6 -> Color(0xFF588157)
        else -> Color(0xFF0F766E)
    }

    private fun extractEmoji(raw: String): String? {
        val regex = "<text[^>]*>([^<]+)</text>".toRegex()
        val match = regex.find(raw)
        return match?.groupValues?.getOrNull(1)?.trim()
    }

    private fun extractColor(raw: String): Color? {
        val regex = "fill=\"(#[A-Fa-f0-9]{6})\"".toRegex()
        val match = regex.find(raw)
        val hex = match?.groupValues?.getOrNull(1) ?: return null
        return try {
            Color(android.graphics.Color.parseColor(hex))
        } catch (e: Exception) {
            null
        }
    }
}

@Composable
fun ProductImageBanner(
    name: String,
    nameMl: String? = null,
    categoryId: Int? = null,
    rawImageUrl: String? = null,
    height: Dp = 110.dp,
    cornerRadius: Dp = 12.dp,
    isThumbnail: Boolean = false,
    modifier: Modifier = Modifier
) {
    val meta = ProductVisualResolver.resolve(name, nameMl, categoryId, rawImageUrl)
    val gradientBrush = Brush.linearGradient(
        colors = listOf(meta.primaryColor, meta.secondaryColor)
    )

    Box(
        modifier = modifier
            .then(if (isThumbnail) Modifier.size(height) else Modifier.fillMaxWidth().height(height))
            .clip(RoundedCornerShape(cornerRadius))
            .background(gradientBrush),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .size(if (isThumbnail) height * 0.7f else 54.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.22f)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = meta.emoji,
                fontSize = if (isThumbnail) (height.value * 0.42f).sp else 40.sp,
                textAlign = TextAlign.Center
            )
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
            // Product Visual Image Banner
            ProductImageBanner(
                name = product.name,
                nameMl = product.nameMl,
                categoryId = product.categoryId,
                rawImageUrl = product.imageUrl,
                height = 110.dp,
                cornerRadius = 12.dp,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(10.dp))

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
