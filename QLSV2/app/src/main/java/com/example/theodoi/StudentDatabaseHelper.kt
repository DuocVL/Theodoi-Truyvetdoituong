package com.example.theodoi

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class StudentDatabaseHelper(context: Context) :
    SQLiteOpenHelper(context, "StudentDB", null, 1) {

    companion object {
        private const val TABLE_NAME = "students"
        private const val ID = "id"
        private const val NAME = "name"
        private const val STUDENT_ID = "student_id"
        private const val PHONE = "phone"
    }

    override fun onCreate(db: SQLiteDatabase) {
        val createTable = """
            CREATE TABLE $TABLE_NAME (
                $ID INTEGER PRIMARY KEY AUTOINCREMENT,
                $NAME TEXT,
                $STUDENT_ID TEXT,
                $PHONE TEXT
            )
        """.trimIndent()
        db.execSQL(createTable)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_NAME")
        onCreate(db)
    }

    fun insertStudent(student: Student): Long {
        val db = writableDatabase
        val values = ContentValues().apply {
            put(NAME, student.name)
            put(STUDENT_ID, student.studentId)
            put(PHONE, student.phone)
        }
        return db.insert(TABLE_NAME, null, values)
    }

    fun getAllStudents(): List<Student> {
        val list = mutableListOf<Student>()
        val db = readableDatabase
        val cursor = db.rawQuery("SELECT * FROM $TABLE_NAME", null)
        if (cursor.moveToFirst()) {
            do {
                list.add(
                    Student(
                        id = cursor.getInt(0),
                        name = cursor.getString(1),
                        studentId = cursor.getString(2),
                        phone = cursor.getString(3)
                    )
                )
            } while (cursor.moveToNext())
        }
        cursor.close()
        return list
    }

    fun deleteStudent(id: Int): Int {
        val db = writableDatabase
        return db.delete(TABLE_NAME, "id=?", arrayOf(id.toString()))
    }
}
