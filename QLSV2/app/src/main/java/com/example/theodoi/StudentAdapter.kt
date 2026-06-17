package com.example.theodoi

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.qlsv2.R

class StudentAdapter(
    private val students: List<Student>,
    private val onDelete: (Student) -> Unit
) : RecyclerView.Adapter<StudentAdapter.StudentViewHolder>() {

    inner class StudentViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val txtName: TextView = view.findViewById(R.id.txtName)
        val txtMSSV: TextView = view.findViewById(R.id.txtMSSV)
        val txtPhone: TextView = view.findViewById(R.id.txtPhone)

        init {
            view.setOnLongClickListener {
                val student = students[adapterPosition]
                onDelete(student)
                true
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StudentViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_student, parent, false)
        return StudentViewHolder(view)
    }

    override fun onBindViewHolder(holder: StudentViewHolder, position: Int) {
        val s = students[position]
        holder.txtName.text = s.name
        holder.txtMSSV.text = "MSSV: ${s.studentId}"
        holder.txtPhone.text = "SĐT: ${s.phone}"
    }

    override fun getItemCount() = students.size
}
