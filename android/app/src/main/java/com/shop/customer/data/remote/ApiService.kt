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

class ApiService(private var baseUrl: String = "https://shop-platform-ky2m.onrender.com/api") {

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
                    nameMl = if (obj.has("name_ml") && !obj.isNull("name_ml")) obj.getString("name_ml") else null,
                    sku = obj.optString("sku", null),
                    price = obj.getDouble("price"),
                    compareAtPrice = if (obj.has("compare_at_price") && !obj.isNull("compare_at_price")) obj.getDouble("compare_at_price") else null,
                    mrp = if (obj.has("mrp") && !obj.isNull("mrp")) obj.getDouble("mrp") else null,
                    stock = obj.optInt("stock", 0),
                    description = obj.optString("description", null),
                    imageUrl = if (obj.has("image_url") && !obj.isNull("image_url")) obj.getString("image_url") else null,
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

    // MARK: - Customer Care Support
    suspend fun getOrCreateSupportThread(name: String, phone: String, token: String?): SupportThread = withContext(Dispatchers.IO) {
        val payload = JSONObject().apply {
            put("name", name)
            put("phone", phone)
        }
        val resStr = makeRequest("/support/threads", method = "POST", jsonBody = payload.toString(), token = token)
        val obj = JSONObject(resStr).getJSONObject("thread")
        SupportThread(
            id = obj.getInt("id"),
            userId = if (obj.has("user_id") && !obj.isNull("user_id")) obj.optInt("user_id") else null,
            customerName = obj.optString("customer_name", "Customer"),
            customerPhone = obj.optString("customer_phone", ""),
            status = obj.optString("status", "open"),
            createdAt = obj.optString("created_at", null),
            updatedAt = obj.optString("updated_at", null)
        )
    }

    suspend fun fetchSupportMessages(threadId: Int, token: String?): List<SupportMessage> = withContext(Dispatchers.IO) {
        val resStr = makeRequest("/support/threads/$threadId/messages", method = "GET", token = token)
        val obj = JSONObject(resStr)
        val arr = obj.getJSONArray("messages")
        val list = mutableListOf<SupportMessage>()
        for (i in 0 until arr.length()) {
            val item = arr.getJSONObject(i)
            list.add(
                SupportMessage(
                    id = item.getInt("id"),
                    threadId = item.getInt("thread_id"),
                    senderRole = item.optString("sender_role", "customer"),
                    senderId = if (item.has("sender_id") && !item.isNull("sender_id")) item.optInt("sender_id") else null,
                    senderName = item.optString("sender_name", "User"),
                    messageType = item.optString("message_type", "text"),
                    content = item.optString("content", ""),
                    audioDuration = item.optDouble("audio_duration", 0.0),
                    isRead = item.optInt("is_read", 0),
                    createdAt = item.optString("created_at", null)
                )
            )
        }
        list
    }

    suspend fun sendSupportMessage(
        threadId: Int,
        content: String,
        type: String = "text",
        duration: Double = 0.0,
        token: String?,
        senderName: String
    ): SupportMessage = withContext(Dispatchers.IO) {
        val payload = JSONObject().apply {
            put("message_type", type)
            put("content", content)
            put("audio_duration", duration)
            put("sender_role", "customer")
            put("sender_name", senderName)
        }
        val resStr = makeRequest("/support/threads/$threadId/messages", method = "POST", jsonBody = payload.toString(), token = token)
        val item = JSONObject(resStr).getJSONObject("message")
        SupportMessage(
            id = item.getInt("id"),
            threadId = item.getInt("thread_id"),
            senderRole = item.optString("sender_role", "customer"),
            senderId = if (item.has("sender_id") && !item.isNull("sender_id")) item.optInt("sender_id") else null,
            senderName = item.optString("sender_name", senderName),
            messageType = item.optString("message_type", type),
            content = item.optString("content", content),
            audioDuration = item.optDouble("audio_duration", duration),
            isRead = item.optInt("is_read", 0),
            createdAt = item.optString("created_at", null)
        )
    }

    suspend fun uploadVoiceNote(base64Audio: String, format: String = "m4a", duration: Double = 0.0): String = withContext(Dispatchers.IO) {
        val payload = JSONObject().apply {
            put("audio_data", base64Audio)
            put("format", format)
            put("duration", duration)
        }
        val resStr = makeRequest("/support/upload-audio", method = "POST", jsonBody = payload.toString())
        JSONObject(resStr).getString("audio_url")
    }

    suspend fun startSupportCall(
        threadId: Int,
        callType: String,
        callerName: String,
        token: String?
    ): SupportCallSession = withContext(Dispatchers.IO) {
        val payload = JSONObject().apply {
            put("thread_id", threadId)
            put("call_type", callType)
            put("caller_role", "customer")
            put("caller_name", callerName)
        }
        val resStr = makeRequest("/support/call/start", method = "POST", jsonBody = payload.toString(), token = token)
        val obj = JSONObject(resStr)
        SupportCallSession(
            id = obj.getString("call_id"),
            threadId = obj.getInt("thread_id"),
            callerRole = obj.optString("caller_role", "customer"),
            callerName = obj.optString("caller_name", callerName),
            callType = obj.optString("call_type", callType),
            status = obj.optString("status", "ringing")
        )
    }

    suspend fun checkActiveCall(threadId: Int): SupportCallSession? = withContext(Dispatchers.IO) {
        try {
            val resStr = makeRequest("/support/call/active?thread_id=$threadId", method = "GET")
            val obj = JSONObject(resStr)
            if (obj.optBoolean("active", false) && obj.has("call") && !obj.isNull("call")) {
                val callObj = obj.getJSONObject("call")
                SupportCallSession(
                    id = callObj.getString("id"),
                    threadId = callObj.getInt("thread_id"),
                    callerRole = callObj.optString("caller_role", "customer"),
                    callerName = callObj.optString("caller_name", "Support"),
                    callType = callObj.optString("call_type", "audio"),
                    status = callObj.optString("status", "ringing")
                )
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    suspend fun endSupportCall(callId: String) = withContext(Dispatchers.IO) {
        val payload = JSONObject().apply {
            put("call_id", callId)
            put("status", "ended")
        }
        makeRequest("/support/call/end", method = "POST", jsonBody = payload.toString())
    }
}
