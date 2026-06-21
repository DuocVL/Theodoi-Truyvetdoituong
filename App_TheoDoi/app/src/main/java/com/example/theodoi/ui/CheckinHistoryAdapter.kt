package com.example.theodoi.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.theodoi.databinding.ItemCheckinHistoryBinding
import com.example.theodoi.network.dto.CheckinSummaryData

class CheckinHistoryAdapter(
    private var items: List<CheckinSummaryData>,
    private val onItemClick: (CheckinSummaryData) -> Unit
) : RecyclerView.Adapter<CheckinHistoryAdapter.HistoryViewHolder>() {

    inner class HistoryViewHolder(val binding: ItemCheckinHistoryBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HistoryViewHolder {
        val binding = ItemCheckinHistoryBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return HistoryViewHolder(binding)
    }

    override fun onBindViewHolder(holder: HistoryViewHolder, position: Int) {
        val item = items[position]
        with(holder.binding) {
            txtTime.text = item.checkinTime.replace("T", " ").substring(0, 19)
            txtStatus.text = item.status
            txtStatus.setTextColor(if (item.status == "ON_TIME") 0xFF4CAF50.toInt() else 0xFFF44336.toInt())
            txtCoordinates.text = "Tọa độ: ${item.latitude}, ${item.longitude}"
            txtFaceVerification.text = "FaceID: ${if (item.faceVerified) "Thành công ✅" else "Thất bại ❌"}"

            root.setOnClickListener { onItemClick(item) }
        }
    }

    override fun getItemCount(): Int = items.size

    fun updateData(newItems: List<CheckinSummaryData>) {
        this.items = newItems
        notifyDataSetChanged()
    }
}