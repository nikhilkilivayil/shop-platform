package com.shop.customer

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import com.shop.customer.data.local.Localization
import com.shop.customer.data.local.PreferencesManager
import com.shop.customer.data.models.CartItem
import com.shop.customer.data.models.Product
import com.shop.customer.data.remote.ApiService
import com.shop.customer.ui.screens.*
import com.shop.customer.ui.theme.EmeraldPrimary
import com.shop.customer.ui.theme.ShopCustomerTheme

enum class Screen(val key: String, val icon: ImageVector) {
    HOME("tab_shop", Icons.Default.Storefront),
    CATEGORIES("tab_categories", Icons.Default.Category),
    CART("tab_cart", Icons.Default.ShoppingCart),
    ORDERS("tab_orders", Icons.Default.ShoppingBag),
    PROFILE("tab_profile", Icons.Default.Person),
    CHECKOUT("checkout_title", Icons.Default.ShoppingCart),
    SUPPORT("support_title", Icons.Default.Headphones)
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val prefManager = PreferencesManager(this)
        val apiService = ApiService(prefManager.getBaseUrl())

        setContent {
            ShopCustomerTheme {
                var currentScreen by remember { mutableStateOf(Screen.HOME) }
                var currentLanguage by remember { mutableStateOf(prefManager.getLanguage()) }
                val cartItemsMap = remember { mutableStateMapOf<Int, CartItem>() }
                var isLoggedIn by remember { mutableStateOf(!prefManager.getToken().isNullOrEmpty()) }

                val totalCartCount = cartItemsMap.values.sumOf { it.quantity }

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    bottomBar = {
                        if (currentScreen != Screen.CHECKOUT && currentScreen != Screen.SUPPORT) {
                            NavigationBar {
                                Screen.values().filter { it != Screen.CHECKOUT && it != Screen.SUPPORT }.forEach { screen ->
                                    val selected = currentScreen == screen
                                    val title = Localization.get(screen.key, currentLanguage)
                                    NavigationBarItem(
                                        selected = selected,
                                        onClick = { currentScreen = screen },
                                        icon = {
                                            if (screen == Screen.CART && totalCartCount > 0) {
                                                BadgedBox(
                                                    badge = {
                                                        Badge(containerColor = EmeraldPrimary) {
                                                            Text("$totalCartCount")
                                                        }
                                                    }
                                                ) {
                                                    Icon(screen.icon, contentDescription = title)
                                                }
                                            } else {
                                                Icon(screen.icon, contentDescription = title)
                                            }
                                        },
                                        label = { Text(title) }
                                    )
                                }
                            }
                        }
                    }
                ) { innerPadding ->
                    Surface(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        when (currentScreen) {
                            Screen.HOME -> HomeScreen(
                                apiService = apiService,
                                cartItems = cartItemsMap.mapValues { it.value.quantity },
                                language = currentLanguage,
                                onAddToCart = { product ->
                                    val existing = cartItemsMap[product.id]
                                    if (existing != null) {
                                        if (existing.quantity < product.stock) {
                                            cartItemsMap[product.id] = existing.copy(quantity = existing.quantity + 1)
                                        }
                                    } else {
                                        cartItemsMap[product.id] = CartItem(product = product, quantity = 1)
                                    }
                                },
                                onIncrement = { productId ->
                                    val existing = cartItemsMap[productId]
                                    if (existing != null && existing.quantity < existing.product.stock) {
                                        cartItemsMap[productId] = existing.copy(quantity = existing.quantity + 1)
                                    }
                                },
                                onDecrement = { productId ->
                                    val existing = cartItemsMap[productId]
                                    if (existing != null) {
                                        if (existing.quantity > 1) {
                                            cartItemsMap[productId] = existing.copy(quantity = existing.quantity - 1)
                                        } else {
                                            cartItemsMap.remove(productId)
                                        }
                                    }
                                }
                            )

                            Screen.CATEGORIES -> CategoriesScreen(
                                apiService = apiService,
                                language = currentLanguage,
                                onSelectCategory = {
                                    currentScreen = Screen.HOME
                                }
                            )

                            Screen.CART -> CartScreen(
                                cartItems = cartItemsMap.values.toList(),
                                language = currentLanguage,
                                onIncrement = { productId ->
                                    val existing = cartItemsMap[productId]
                                    if (existing != null && existing.quantity < existing.product.stock) {
                                        cartItemsMap[productId] = existing.copy(quantity = existing.quantity + 1)
                                    }
                                },
                                onDecrement = { productId ->
                                    val existing = cartItemsMap[productId]
                                    if (existing != null) {
                                        if (existing.quantity > 1) {
                                            cartItemsMap[productId] = existing.copy(quantity = existing.quantity - 1)
                                        } else {
                                            cartItemsMap.remove(productId)
                                        }
                                    }
                                },
                                onRemove = { productId ->
                                    cartItemsMap.remove(productId)
                                },
                                onProceedToCheckout = {
                                    currentScreen = Screen.CHECKOUT
                                }
                            )

                            Screen.CHECKOUT -> CheckoutScreen(
                                apiService = apiService,
                                prefManager = prefManager,
                                cartItems = cartItemsMap.values.toList(),
                                language = currentLanguage,
                                onBack = { currentScreen = Screen.CART },
                                onOrderSuccess = {
                                    cartItemsMap.clear()
                                    currentScreen = Screen.ORDERS
                                }
                            )

                            Screen.ORDERS -> OrdersScreen(
                                apiService = apiService,
                                prefManager = prefManager,
                                language = currentLanguage,
                                onNavigateToLogin = {
                                    currentScreen = Screen.PROFILE
                                }
                            )

                            Screen.PROFILE -> {
                                if (isLoggedIn) {
                                    ProfileScreen(
                                        apiService = apiService,
                                        prefManager = prefManager,
                                        language = currentLanguage,
                                        onLanguageChange = { newLang ->
                                            currentLanguage = newLang
                                            prefManager.setLanguage(newLang)
                                        },
                                        onNavigateToSupport = {
                                            currentScreen = Screen.SUPPORT
                                        },
                                        onLogout = {
                                            isLoggedIn = false
                                        }
                                    )
                                } else {
                                    LoginScreen(
                                        apiService = apiService,
                                        prefManager = prefManager,
                                        language = currentLanguage,
                                        onLoginSuccess = {
                                            isLoggedIn = true
                                            currentScreen = Screen.HOME
                                        }
                                    )
                                }
                            }

                            Screen.SUPPORT -> SupportScreen(
                                apiService = apiService,
                                prefManager = prefManager,
                                language = currentLanguage,
                                onBack = {
                                    currentScreen = Screen.PROFILE
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
