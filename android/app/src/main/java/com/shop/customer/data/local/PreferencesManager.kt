package com.shop.customer.data.local

import android.content.Context
import android.content.SharedPreferences
import com.shop.customer.data.models.User
import java.util.UUID

class PreferencesManager(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("shop_customer_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_TOKEN = "auth_token"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_PHONE = "user_phone"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_ADDRESS = "user_address"
        private const val KEY_USER_CITY = "user_city"
        private const val KEY_USER_PINCODE = "user_pincode"
        private const val KEY_BASE_URL = "api_base_url"
    }

    fun getDeviceId(): String {
        var id = prefs.getString(KEY_DEVICE_ID, null)
        if (id.isNullOrEmpty()) {
            id = "ANDROID-DEV-" + UUID.randomUUID().toString().substring(0, 8).uppercase()
            prefs.edit().putString(KEY_DEVICE_ID, id).apply()
        }
        return id
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun saveToken(token: String) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
    }

    fun clearToken() {
        prefs.edit().remove(KEY_TOKEN).apply()
        clearUser()
    }

    fun saveUser(user: User) {
        prefs.edit().apply {
            putInt(KEY_USER_ID, user.id)
            putString(KEY_USER_NAME, user.name)
            putString(KEY_USER_PHONE, user.phone)
            putString(KEY_USER_EMAIL, user.email)
            putString(KEY_USER_ADDRESS, user.address)
            putString(KEY_USER_CITY, user.city)
            putString(KEY_USER_PINCODE, user.pincode)
            apply()
        }
    }

    fun getUser(): User? {
        val id = prefs.getInt(KEY_USER_ID, -1)
        if (id == -1) return null
        return User(
            id = id,
            name = prefs.getString(KEY_USER_NAME, ""),
            phone = prefs.getString(KEY_USER_PHONE, ""),
            email = prefs.getString(KEY_USER_EMAIL, ""),
            address = prefs.getString(KEY_USER_ADDRESS, ""),
            city = prefs.getString(KEY_USER_CITY, ""),
            pincode = prefs.getString(KEY_USER_PINCODE, ""),
            deviceId = getDeviceId()
        )
    }

    fun clearUser() {
        prefs.edit().apply {
            remove(KEY_USER_ID)
            remove(KEY_USER_NAME)
            remove(KEY_USER_PHONE)
            remove(KEY_USER_EMAIL)
            remove(KEY_USER_ADDRESS)
            remove(KEY_USER_CITY)
            remove(KEY_USER_PINCODE)
            apply()
        }
    }

    fun getBaseUrl(): String {
        return prefs.getString(KEY_BASE_URL, "http://10.0.2.2:3001/api") ?: "http://10.0.2.2:3001/api"
    }

    fun setBaseUrl(url: String) {
        var clean = url.trim()
        if (clean.isEmpty()) {
            clean = "http://10.0.2.2:3001/api"
        }
        if (clean.endsWith("/")) {
            clean = clean.dropLast(1)
        }
        if (!clean.endsWith("/api")) {
            clean = "$clean/api"
        }
        prefs.edit().putString(KEY_BASE_URL, clean).apply()
    }

    fun getLanguage(): String {
        return prefs.getString("app_language", "en") ?: "en"
    }

    fun setLanguage(lang: String) {
        prefs.edit().putString("app_language", lang).apply()
    }
}
