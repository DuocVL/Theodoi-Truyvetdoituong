package com.example.theodoi.ui

class HistoryCheckinActivity {
}package com.example.theodoi.ui

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.example.theodoi.R
import com.example.theodoi.data.CheckinRepository
import com.example.theodoi.databinding.ActivityHistoryBinding
import com.example.theodoi.databinding.DialogCheckinDetailBinding
import com.example.theodoi.network.ApiClient
import com.google.android.material.bottomsheet.BottomSheetDialog
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class HistoryActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHistoryBinding
    private val repository = CheckinRepository()
    private lateinit var historyAdapter: CheckinHistoryAdapter

    private var currentPage = 1
    private val limitPerPage = 10
    private var totalPages = 1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHistoryBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        loadHistoryData(currentPage)

        binding.btnNext.setOnClickListener {
            if (currentPage < totalPages) {
                currentPage++
                loadHistoryData(currentPage)
            }
        }

        binding.btnPrevious.setOnClickListener {
            if (currentPage > 1) {
                currentPage--
                loadHistoryData(currentPage)
            }
        }
    }

    private fun setupRecyclerView() {
        historyAdapter = CheckinHistoryAdapter(emptyList()) { item ->
            showCheckinDetailBottomSheet(item.id)
        }
        binding.rvHistory.layoutManager = LinearLayoutManager(this)
        binding.rvHistory.adapter = historyAdapter
    }

    private fun loadHistoryData(page: Int) {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val response = repository.getMyCheckins(page, limitPerPage)
                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = View.GONE
                    if (response.isSuccessful && response.body() != null) {
                        val responseData = response.body()!!
                        historyAdapter.updateData(responseData.data)

                        totalPages = responseData.pagination.totalPages
                        binding.txtPageIndicator.text = "Trang $currentPage / $totalPages"

                        binding.btnPrevious.isEnabled = currentPage > 1
                        binding.btnNext.isEnabled = currentPage < totalPages
                    } else {
                        Toast.makeText(this@HistoryActivity, "Không thể lấy dữ liệu lịch sử", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = View.GONE
                    Toast.makeText(this@HistoryActivity, "Lỗi kết nối mạng", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    // Hiển thị BottomSheet chi tiết kèm hình ảnh tải từ server về
    private fun showCheckinDetailBottomSheet(checkinId: String) {
        val dialog = BottomSheetDialog(this)
        val dialogBinding = DialogCheckinDetailBinding.inflate(layoutInflater)
        dialog.setContentView(dialogBinding.root)

        dialogBinding.progressDetail.visibility = View.VISIBLE
        dialog.show()

        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val response = repository.getCheckinById(checkinId)
                withContext(Dispatchers.Main) {
                    dialogBinding.progressDetail.visibility = View.GONE
                    if (response.isSuccessful && response.body() != null) {
                        val detail = response.body()!!.data

                        dialogBinding.txtDetailTime.text = "Thời gian: ${detail.checkinTime.replace("T", " ").substring(0, 19)}"
                        dialogBinding.txtDetailStatus.text = "Trạng thái: ${detail.status}"
                        dialogBinding.txtDetailLocation.text = "Tọa độ: ${detail.latitude}, ${detail.longitude}"
                        dialogBinding.txtDetailNotes.text = "Ghi chú: ${detail.notes ?: "Không có ghi chú"}"

                        // Tải ảnh từ URL đầy đủ của server bằng Glide
                        val imageUrl = detail.image?.url
                        if (!imageUrl.isNullOrEmpty()) {
                            val absoluteUrl = ApiClient.getAbsoluteImageUrl(imageUrl)
                            Glide.with(this@HistoryActivity)
                                .load(absoluteUrl)
                                .placeholder(R.drawable.ic_placeholder_avatar) // Thêm ảnh tạm nếu cần
                                .into(dialogBinding.imgCheckinEvidence)
                        }
                    } else {
                        Toast.makeText(this@HistoryActivity, "Lỗi tải chi tiết", Toast.LENGTH_SHORT).show()
                        dialog.dismiss()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    dialogBinding.progressDetail.visibility = View.GONE
                    Toast.makeText(this@HistoryActivity, "Mất kết nối", Toast.LENGTH_SHORT).show()
                    dialog.dismiss()
                }
            }
        }
    }
}