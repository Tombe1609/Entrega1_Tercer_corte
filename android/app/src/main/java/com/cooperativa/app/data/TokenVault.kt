package com.cooperativa.app.data

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/** Guarda el token cifrado con una clave no exportable del Android Keystore. */
class TokenVault(context: Context) {
    private val storage = context.getSharedPreferences(STORAGE_NAME, Context.MODE_PRIVATE)

    @Synchronized
    fun read(): String? {
        val encoded = storage.getString(TOKEN_KEY, null) ?: return null
        return try {
            val packed = Base64.decode(encoded, Base64.NO_WRAP)
            require(packed.size > HEADER_SIZE && packed[0].toInt() == FORMAT_VERSION)
            val ivSize = packed[1].toInt() and 0xFF
            require(ivSize in MIN_IV_SIZE..MAX_IV_SIZE && packed.size > HEADER_SIZE + ivSize)
            val iv = packed.copyOfRange(HEADER_SIZE, HEADER_SIZE + ivSize)
            val ciphertext = packed.copyOfRange(HEADER_SIZE + ivSize, packed.size)
            Cipher.getInstance(TRANSFORMATION).run {
                init(Cipher.DECRYPT_MODE, loadOrCreateKey(), GCMParameterSpec(TAG_BITS, iv))
                String(doFinal(ciphertext), Charsets.UTF_8)
            }
        } catch (_: Exception) {
            // Si la clave se perdió (p. ej., tras restaurar una copia de seguridad),
            // descarta el token inutilizable y permite que la persona vuelva a iniciar sesión.
            clear()
            null
        }
    }

    @Synchronized
    fun write(token: String?) {
        if (token.isNullOrBlank()) {
            clear()
            return
        }
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, loadOrCreateKey())
        val iv = cipher.iv
        val encrypted = cipher.doFinal(token.toByteArray(Charsets.UTF_8))
        val packed = byteArrayOf(FORMAT_VERSION.toByte(), iv.size.toByte()) + iv + encrypted
        storage.edit().putString(TOKEN_KEY, Base64.encodeToString(packed, Base64.NO_WRAP)).apply()
    }

    @Synchronized
    fun clear() {
        storage.edit().remove(TOKEN_KEY).apply()
    }

    private fun loadOrCreateKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        (keyStore.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }

        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)
        generator.init(
            KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build(),
        )
        return generator.generateKey()
    }

    private companion object {
        const val ANDROID_KEYSTORE = "AndroidKeyStore"
        const val KEY_ALIAS = "cooperativa.session.token.v1"
        const val STORAGE_NAME = "cooperativa_secure"
        const val TOKEN_KEY = "encrypted_auth_token"
        const val TRANSFORMATION = "AES/GCM/NoPadding"
        const val TAG_BITS = 128
        const val HEADER_SIZE = 2
        const val FORMAT_VERSION = 1
        const val MIN_IV_SIZE = 12
        const val MAX_IV_SIZE = 16
    }
}
