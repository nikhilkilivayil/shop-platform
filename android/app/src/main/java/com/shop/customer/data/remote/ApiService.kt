package com.shop.customer.data.remote

import com.shop.customer.data.models.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

class ApiService(private var baseUrl: String = "http://10.0.2.2:3001/api") {

    fun updateBaseUrl(newUrl: String) {
        baseUrl = newUrl.trimEnd('/')
        if (!baseUrl.endsWith("/api")) {
            baseUrl += "/api"
        }
    }

    private fun makeRequest(
        endpoint: String,
        method: String = "GET",
        jsonBody: String? = null,
        token: String? = null
    ): String {
        val url = URL("$baseUrl$endpoint")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = method
        conn.connectTimeout = 15000
        conn.readTimeout = 15000
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
        conn.setRequestProperty("Accept", "application/json")
        if (!token.isNullOrEmpty()) {
            conn.setRequestProperty("Authorization", "Bearer $token")
        }

        if (jsonBody != null && (method == "POST" || method == "PUT" || method == "PATCH")) {
            conn.doOutput = true
            OutputStreamWriter(conn.outputStream, "UTF-8").use { writer ->
                writer.write(jsonBody)
                writer.flush()
            }
        }

        val code = conn.responseCode
        val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            ?: throw Exception("HTTP error code: $code")

        val response = BufferedReader(InputStreamReader(stream, "UTF-8")).use { it.readText() }
        if (code !in 200..299) {
            val errorMsg = try {
                JSONObject(response).optString("error", response)
            } catch (e: Exception) {
                response
            }
            throw Exception(errorMsg)
        }
        return response
    }

    suspend fun fetchCategories(): List<Category> = withContext(Dispatchers.IO) {
        val jsonStr = makeRequest("/categories")
        val array = JSONArray(jsonStr)
        val list = mutableListOf<Category>()
        for (i in 0 until array.length()) {
            val obj = array.getJSONObject(i)
            list.add(
                Category(
                    id = obj.getInt("id"),
                    name = obj.getString("name"),
                    slug = obj.optString("slug", null),
                    icon = obj.optString("icon", null),
                    description = obj.optString("description", null)
                )
            )
        }
        list
    }

    suspend fun fetchProducts(
        categoryId: Int? = null,
        search: String? = null,
        sort: String? = null
    ): List<Product> = withContext(Dispatchers.IO) {
        val params = mutableListOf<String>()
        if (categoryId != null && categoryId > 0) params.add("category=$categoryId")
        if (!search.isNullOrEmpty()) params.add("search=${URLEncoder.encode(search, "UTF-8")}")
        if (!sort.isNullOrEmpty()) params.add("sort=${URLEncoder.encode(sort, "UTF-8")}")

        val query = if (params.isNotEmpty()) "?" + params.joinToString("&") else ""
        val jsonStr = makeRequest("/products$query")
        val array = JSONArray(jsonStr)
        val list = mutableListOf<Product>()
        for (i in 0 until array.length()) {
            val obj = array.getJSONObject(i)
            list.add(
                Product(
                    id = obj.getInt("id"),
                    categoryId = obj.optInt("category_id"),
                    categoryName = obj.optString("category_name", null),
                    name = obj.getString("name"),
                    sku = obj.optString("sku", null),
                    price = obj.getDouble("price"),
                    compareAtPrice = if (obj.has("compare_at_price") && !obj.isNull("compare_at_price")) obj.getDouble("compare_at_price") else null,
                    stock = obj.optInt("stock", 0),
                    description = obj.optString("description", null),
                    imageBadge = obj.optString("image_badge", null),
                    unit = obj.optString("unit", "1 unit")
                )
            )
        }
        list
    }

    suspend fun sendOtp(phone: String, deviceId: String): SendOtpResponse = withContext(Dispatchers.IO) {
        val body = JSONObject().apply {
            put("phone", phone)
            put("device_id", deviceId)
        }.toString()

        val jsonStr = makeRequest("/auth/send-otp", "POST", body)
        val obj = JSONObject(jsonStr)
        SendOtpResponse(
            success = obj.optBoolean("success", true),
            otp = obj.optString("otp", null),
            message = obj.optString("message", null),
            hasName = obj.optBoolean("has_name", false),
            userName = obj.optString("user_name", null)
        )
    }

    suspend fun verifyOtp(phone: String, otp: String, name: String?, deviceId: String): VerifyOtpResponse = withContext(Dispatchers.IO) {
        val body = JSONObject().apply {
            put("phone", phone)
            put("otp", otp)
            put("name", name)
            put("device_id", deviceId)
        }.toString()

        val jsonStr = makeRequest("/auth/verify-otp", "POST", body)
        val obj = JSONObject(jsonStr)
        val success = obj.optBoolean("success", false)
        val token = obj.optString("token", null)
        val userObj = obj.optJSONObject("user")
        val user = if (userObj != null) {
            User(
                id = userObj.getInt("id"),
                name = userObj.optString("name", ""),
                phone = userObj.optString("phone", ""),
                email = userObj.optString("email", ""),
                address = userObj.optString("address", ""),
                city = userObj.optString("city", ""),
                pincode = userObj.optString("pincode", ""),
                deviceId = userObj.optString("device_id", deviceId)
            )
        } else null

        VerifyOtpResponse(
            success = success,
            token = token,
            user = user,
            message = obj.optString("message", null)
        )
    }

    suspend fun fetchUserProfile(token: String): User = withContext(Dispatchers.IO) {
        val jsonStr = makeRequest("/user/profile", "GET", null, token)
        val obj = JSONObject(jsonStr)
        User(
            id = obj.getInt("id"),
            name = obj.optString("name", ""),
            phone = obj.optString("phone", ""),
            email = obj.optString("email", ""),
            address = obj.optString("address", ""),
            city = obj.optString("city", ""),
            pincode = obj.optString("pincode", ""),
            deviceId = obj.optString("device_id", "")
        )
    }

    suspend fun updateUserProfile(
        token: String,
        name: String,
        email: String,
        address: String,
        city: String,
        pincode: String
    ): User = withContext(Dispatchers.IO) {
        val body = JSONObject().apply {
            put("name", name)
            put("email", email)
            put("address", address)
            put("city", city)
            put("pincode", pincode)
        }.toString()

        val jsonStr = makeRequest("/user/profile", "PUT", body, token)
        val obj = JSONObject(jsonStr)
        User(
            id = obj.getInt("id"),
            name = obj.optString("name", ""),
            phone = obj.optString("phone", ""),
            email = obj.optString("email", ""),
            address = obj.optString("address", ""),
            city = obj.optString("city", ""),
            pincode = obj.optString("pincode", ""),
            deviceId = obj.optString("device_id", "")
        )
    }

    suspend fun createOrder(
        token: String?,
        customerName: String,
        customerPhone: String,
        deliveryAddress: String,
        city: String,
        pincode: String,
        items: List<CartItem>,
        paymentMethod: String,
        notes: String?
    ): Order = withContext(Dispatchers.IO) {
        val itemsArray = JSONArray()
        items.forEach { item ->
            val itmObj = JSONObject().apply {
                put("product_id", item.product.id)
                put("quantity", item.quantity)
                put("price", item.product.price)
            }
            itemsArray.put(itmObj)
        }

        val body = JSONObject().apply {
            put("customer_name", customerName)
            put("customer_phone", customerPhone)
            put("delivery_address", deliveryAddress)
            put("city", city)
            put("pincode", pincode)
            put("payment_method", paymentMethod)
            put("payment_status", if (paymentMethod.equals("COD", ignoreCase = true)) "pending" else "completed")
            put("notes", notes ?: "")
            put("items", itemsArray)
        }.toString()

        val jsonStr = makeRequest("/orders", "POST", body, token)
        val resObj = JSONObject(jsonStr)
        val ordObj = resObj.getJSONObject("order")
        parseOrder(ordObj)
    }

    suspend fun fetchUserOrders(token: String): List<Order> = withContext(Dispatchers.IO) {
        val jsonStr = makeRequest("/user/orders", "GET", null, token)
        val array = JSONArray(jsonStr)
        val list = mutableListOf<Order>()
        for (i in 0 until array.length()) {
            list.add(parseOrder(array.getJSONObject(i)))
        }
        list
    }

    suspend fun fetchOrderDetails(orderId: String): Order = withContext(Dispatchers.IO) {
        val jsonStr = makeRequest("/orders/$orderId", "GET")
        val obj = JSONObject(jsonStr)
        parseOrder(obj)
    }

    private fun parseOrder(obj: JSONObject): Order {
        val itemsList = mutableListOf<OrderItem>()
        if (obj.has("items")) {
            val itemsArr = obj.getJSONArray("items")
            for (j in 0 until itemsArr.length()) {
                val itm = itemsArr.getJSONObject(j)
                val itemPrice = itm.optDouble("price", itm.optDouble("unit_price", 0.0))
                val itemQuantity = itm.optInt("quantity", 1)
                val itemTotal = itm.optDouble("total", itm.optDouble("total_price", itemPrice * itemQuantity))
                itemsList.add(
                    OrderItem(
                        id = itm.optInt("id", 0),
                        orderId = itm.optString("order_id", ""),
                        productId = itm.optInt("product_id", 0),
                        productName = itm.optString("product_name", "Item"),
                        quantity = itemQuantity,
                        price = itemPrice,
                        total = itemTotal
                    )
                )
            }
        }

        val orderIdStr = obj.optString("id", obj.optString("order_number", ""))
        val orderNumStr = obj.optString("order_number", orderIdStr)

        return Order(
            id = orderIdStr,
            orderNumber = orderNumStr,
            userId = if (obj.has("user_id") && !obj.isNull("user_id")) obj.optInt("user_id") else null,
            customerName = obj.optString("customer_name", ""),
            customerPhone = obj.optString("customer_phone", ""),
            deliveryAddress = if (obj.has("delivery_address") && !obj.isNull("delivery_address")) obj.optString("delivery_address") else obj.optString("shipping_address", null),
            city = obj.optString("city", null),
            pincode = obj.optString("pincode", null),
            status = obj.optString("status", "pending"),
            paymentMethod = obj.optString("payment_method", "UPI"),
            paymentStatus = obj.optString("payment_status", "pending"),
            subtotal = obj.optDouble("subtotal", 0.0),
            deliveryFee = obj.optDouble("delivery_fee", 0.0),
            discount = obj.optDouble("discount", 0.0),
            total = obj.optDouble("total", obj.optDouble("total_amount", 0.0)),
            notes = obj.optString("notes", null),
            createdAt = obj.optString("created_at", ""),
            items = itemsList
        )
    }
}
