package com.example.theodoi.security

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

//mã hóa/giải mã dữ liệu nhạy cảm trước khi lưu vào csdl

class CryptoManager {

    //Khởi tạo KeyStore , AndroidKeyStore là nơi Android lưu trữ khóa mã hóa (private key) 1 cách an toàn
    //các kháo này được hệ điều hành bảo vệ
    private val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    private val keyAlias = "FaceRecognitionKey"//tên định danh của khóa trong KeyStore

    //Nếu chưa có khóa tạo khóa mới đã có lấy khóa cũ
    private fun getSecretKey(): SecretKey {
        if (!keyStore.containsAlias(keyAlias)) {//kiểm tra khóa đã tồn tại chưa nếu chưa tạo khóa
            //tạo bộ tạo khóa dùng thuật toán AES và lưu khóa vào AndroidKeyStore
            val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
            keyGenerator.init(
                //cấu hình khóa tên khóa -keyAlias 
                //KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT : khóa được phép mã hóa , giải mã
                //block mode KeyProperties.BLOCK_MODE_GCM bảo đảm toàn vẹn dữ liệu
                // ENCRYPTION_PADDING_NONE: AES-GCM không cần thêm đệm
                KeyGenParameterSpec.Builder(keyAlias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .build()
            )
            //tạo khóa -> AES 256 bit và lưu vào AndroidKeyStore ứng dụng không thấy khóa , chỉ có thể dùng để mã hóa giải mã
            keyGenerator.generateKey()
        }
        //lấy khóa vừa tạo
        return keyStore.getKey(keyAlias, null) as SecretKey
    }

    //mã hóa dữ liệu
    fun encrypt(data: ByteArray): Pair<ByteArray, ByteArray> {
        //tạo bộ  mã hóa AES/GCM
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        //chế độ mã hóa , sử dụng khóa lấy từ AndroidKeyStore
        cipher.init(Cipher.ENCRYPT_MODE, getSecretKey())
        //trả về cặp giá trị gồm dữ liệu đã mã hóa và IV(Initialization Vector)
        return Pair(cipher.doFinal(data), cipher.iv)
    }

    //giải mã dữ liệu gồm dữ liệu mã hóa và iv
    fun decrypt(encryptedData: ByteArray, iv: ByteArray): ByteArray {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        //GCMParameterSpec(128, iv) là độ dài Authentication Tag trong AES-GCM AES-GCM ngoài việc mã hóa còn sinh thêm một Tag để kiểm tra dữ liệu có bị thay đổi hay không
        cipher.init(Cipher.DECRYPT_MODE, getSecretKey(), GCMParameterSpec(128, iv))
        //nếu khóa đúng , IV đúng , dữ liệu không bị chỉnh sửa trả về dữ liệu gốc không sẽ ném ngoại lệ
        return cipher.doFinal(encryptedData)
    }
}