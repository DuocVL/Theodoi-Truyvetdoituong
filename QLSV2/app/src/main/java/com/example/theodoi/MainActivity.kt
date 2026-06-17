package com.example.theodoi

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.qlsv2.R
import kotlin.collections.mutableListOf
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    //private lateinit var db: StudentDatabaseHelper
    private lateinit var db: StudentDatabase
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: StudentAdapter
    private var studentList = mutableListOf<Student>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

//        db = StudentDatabaseHelper(this)
//        recyclerView = findViewById(R.id.recyclerView)
//        recyclerView.layoutManager = LinearLayoutManager(this)
//
//        val edtName: EditText = findViewById(R.id.edtName)
//        val edtMSSV: EditText = findViewById(R.id.edtMSSV)
//        val edtPhone: EditText = findViewById(R.id.edtPhone)
//        val btnAdd: Button = findViewById(R.id.btnAdd)
//
//        btnAdd.setOnClickListener {
//            val name = edtName.text.toString()
//            val mssv = edtMSSV.text.toString()
//            val phone = edtPhone.text.toString()
//
//            if (name.isNotEmpty() && mssv.isNotEmpty() && phone.isNotEmpty()) {
//                db.insertStudent(Student(name = name, studentId = mssv, phone = phone))
//                edtName.text.clear()
//                edtMSSV.text.clear()
//                edtPhone.text.clear()
//                refreshList()
//            }
//        }
//
//        refreshList()
//    }
//
//    private fun refreshList() {
//        studentList = db.getAllStudents().toMutableList()
//        adapter = StudentAdapter(studentList) { student ->
//            AlertDialog.Builder(this)
//                .setTitle("Xóa sinh viên")
//                .setMessage("Bạn có chắc muốn xóa ${student.name}?")
//                .setPositiveButton("Xóa") { _, _ ->
//                    db.deleteStudent(student.id)
//                    refreshList()
//                }
//                .setNegativeButton("Hủy", null)
//                .show()
//        }
//        recyclerView.adapter = adapter

        db = StudentDatabase.getDatabase(this)
        recyclerView = findViewById(R.id.recyclerView)
        recyclerView.layoutManager = LinearLayoutManager(this)

        val edtName = findViewById<EditText>(R.id.edtName)
        val edtMSSV = findViewById<EditText>(R.id.edtMSSV)
        val edtPhone = findViewById<EditText>(R.id.edtPhone)
        val btnAdd = findViewById<Button>(R.id.btnAdd)

        btnAdd.setOnClickListener {
            val name = edtName.text.toString()
            val mssv = edtMSSV.text.toString()
            val phone = edtPhone.text.toString()

            if (name.isNotEmpty() && mssv.isNotEmpty() && phone.isNotEmpty()) {
                val student = Student(name = name, studentId = mssv, phone = phone)
                lifecycleScope.launch {
                    db.studentDao().insert(student)
                    edtName.text.clear()
                    edtMSSV.text.clear()
                    edtPhone.text.clear()
                    refreshList()
                }
            }
        }

        refreshList()
   }
    private fun refreshList() {
        lifecycleScope.launch {
            studentList = db.studentDao().getAll().toMutableList()
            adapter = StudentAdapter(studentList) { student ->
                AlertDialog.Builder(this@MainActivity)
                    .setTitle("Xóa sinh viên")
                    .setMessage("Bạn có chắc muốn xóa ${student.name}?")
                    .setPositiveButton("Xóa") { _, _ ->
                        lifecycleScope.launch {
                            db.studentDao().delete(student)
                            refreshList()
                        }
                    }
                    .setNegativeButton("Hủy", null)
                    .show()
            }
            recyclerView.adapter = adapter
        }
    }
}
