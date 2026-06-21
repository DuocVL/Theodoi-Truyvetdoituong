package com.example.theodoi.ui

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.example.theodoi.data.CheckinRepository
import com.example.theodoi.databinding.ActivityCheckinDetailBinding
import com.example.theodoi.network.ApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.osmdroid.config.Configuration
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.overlay.Marker

class CheckinDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCheckinDetailBinding
    private val repository = CheckinRepository()
    private var checkinId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 🔥 BẮT BUỘC: Cấu hình User-Agent để OSM cho phép tải bản đồ miễn phí
        Configuration.getInstance().userAgentValue = packageName

        binding = ActivityCheckinDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        checkinId = intent.getStringExtra("EXTRA_CHECKIN_ID")
        setupToolbar()

        // Bật tính năng zoom bằng 2 ngón tay và nút bấm zoom trên bản đồ
        binding.mapViewDetail.setMultiTouchControls(true)

        if (!checkinId.isNullOrEmpty()) {
            loadCheckinDetail(checkinId!!)
        } else {
            Toast.makeText(this, "Không tìm thấy ID bản ghi", Toast.LENGTH_SHORT).show()
            finish()
        }
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbarDetail)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbarDetail.setNavigationOnClickListener {
            onBackPressedDispatcher.onBackPressed()
        }
    }

    private fun loadCheckinDetail(id: String) {
        binding.progressDetail.visibility = View.VISIBLE
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val response = repository.getCheckinById(id)
                withContext(Dispatchers.Main) {
                    binding.progressDetail.visibility = View.GONE
                    if (response.isSuccessful && response.body() != null) {
                        val detail = response.body()!!.data

                        // Hiển thị text dữ liệu
                        binding.txtDetailTime.text = "Thời gian: ${detail.checkinTime.replace("T", " ").substring(0, 19)}"
                        binding.txtDetailStatus.text = "Trạng thái: ${detail.status}"
                        binding.txtDetailLocation.text = "Tọa độ: ${detail.latitude}, ${detail.longitude}"
                        binding.txtDetailNotes.text = "Ghi chú: ${detail.notes ?: "Không có ghi chú"}"

                        // 🔥 XỬ LÝ HIỂN THỊ BẢN ĐỒ OPENSTREETMAP
                        val lat = detail.latitude
                        val lng = detail.longitude
                        if (lat != 0.0 && lng != 0.0) {
                            val position = GeoPoint(lat, lng)

                            // Di chuyển camera và thiết lập độ Zoom (Ví dụ: 16.5)
                            val mapController = binding.mapViewDetail.controller
                            mapController.setZoom(16.5)
                            mapController.setCenter(position)

                            // Tạo và cắm ghim Marker lên vị trí truy vết
                            val marker = Marker(binding.mapViewDetail)
                            marker.position = position
                            marker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                            marker.title = "Vị trí đối tượng"

                            binding.mapViewDetail.overlays.clear() // Xóa marker cũ nếu có
                            binding.mapViewDetail.overlays.add(marker)
                            binding.mapViewDetail.invalidate() // Làm mới bản đồ
                        }

                        // Tải ảnh khuôn mặt
                        val imageUrl = detail.image?.url
                        if (!imageUrl.isNullOrEmpty()) {
                            val absoluteUrl = ApiClient.getAbsoluteImageUrl(imageUrl)
                            Glide.with(this@CheckinDetailActivity)
                                .load(absoluteUrl)
                                .into(binding.imgCheckinEvidence)
                        }
                    } else {
                        Toast.makeText(this@CheckinDetailActivity, "Không thể tải chi tiết", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.progressDetail.visibility = View.GONE
                    Toast.makeText(this@CheckinDetailActivity, "Lỗi kết nối mạng", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    // Quản lý vòng đời đơn giản cho Osmdroid
    override fun onResume() {
        super.onResume()
        binding.mapViewDetail.onResume()
    }

    override fun onPause() {
        super.onPause()
        binding.mapViewDetail.onPause()
    }
}