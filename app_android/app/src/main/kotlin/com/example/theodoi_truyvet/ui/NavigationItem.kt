
package com.example.theodoi_truyvet.ui

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Person
import androidx.compose.ui.graphics.vector.ImageVector

sealed class NavigationItem(val route: String, val icon: ImageVector, val title: String) {
    object CheckIn : NavigationItem("checkin", Icons.Default.CheckCircle, "Check-in")
    object History : NavigationItem("history", Icons.Default.History, "History")
    object Profile : NavigationItem("profile", Icons.Default.Person, "Profile")
}
