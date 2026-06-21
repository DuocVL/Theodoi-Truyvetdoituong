package com.example.theodoi.ui

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.theodoi.data.CheckinRepository
import com.example.theodoi.databinding.ActivityHistoryBinding
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
            showCheckinDetail(item.id)
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

    private fun showCheckinDetail(checkinId: String) {
        // Chuyển sang Activity mới thay vì mở BottomSheetDialog
        val intent = android.content.Intent(this, CheckinDetailActivity::class.java).apply {
            putExtra("EXTRA_CHECKIN_ID", checkinId)
        }
        startActivity(intent)
    }
}