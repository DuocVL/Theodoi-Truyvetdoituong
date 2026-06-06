package com.example.theodoi_truyvet.ui

import android.Manifest
import android.content.Context
import android.location.Location
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.google.accompanist.permissions.*
import com.google.android.gms.location.LocationServices
import java.io.File
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen() {
    val navController = rememberNavController()
    val navItems = listOf(NavigationItem.CheckIn, NavigationItem.History, NavigationItem.Profile)
    // --- ADDED: Create a single instance of the camera executor ---
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }

    // --- ADDED: Handle cleanup of the executor ---
    DisposableEffect(Unit) {
        onDispose {
            cameraExecutor.shutdown()
        }
    }

    Scaffold(
        bottomBar = {
            NavigationBar {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination

                navItems.forEach { screen ->
                    NavigationBarItem(
                        icon = { Icon(screen.icon, contentDescription = null) },
                        label = { Text(screen.title) },
                        selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = NavigationItem.CheckIn.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(NavigationItem.CheckIn.route) { CheckInTabScreen(navController) }
            composable(NavigationItem.History.route) { HistoryScreen() }
            composable(NavigationItem.Profile.route) { ProfileScreen() }
            
            // --- ADDED: Camera screen route ---
            composable("camera") {
                val context = LocalContext.current
                CameraView(
                    outputDirectory = context.filesDir, // Example directory
                    executor = cameraExecutor,
                    onImageCaptured = {
                        // TODO: Handle image captured, get location, and send to server
                        Log.d("MainScreen", "Image captured: ${it.absolutePath}")
                        navController.popBackStack()
                    },
                    onError = {
                        Log.e("MainScreen", "Image capture error", it)
                        navController.popBackStack()
                    }
                )
            }
        }
    }
}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun CheckInTabScreen(navController: NavHostController) {
    // --- MODIFIED: Request both Camera and Location permissions ---
    val permissionsState = rememberMultiplePermissionsState(
        permissions = listOf(
            Manifest.permission.CAMERA,
            Manifest.permission.ACCESS_FINE_LOCATION
        )
    )

    var launchPermissions by remember { mutableStateOf(false) }

    if (permissionsState.allPermissionsGranted) {
        // If permissions are granted, show a button to open the camera
        GrantedPermissionScreen(navController)
    } else {
        // If permissions are not granted, show rationale and a button to request them
        RationalePermissionScreen(permissionsState, navController)
    }
}

@Composable
fun GrantedPermissionScreen(navController: NavHostController) {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Permissions granted! Ready to check-in.", modifier = Modifier.padding(16.dp))
        Button(onClick = { navController.navigate("camera") }) {
            Text("Open Camera")
        }
    }
}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun RationalePermissionScreen(permissionsState: MultiplePermissionsState, navController: NavHostController) {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        val textToShow = if (permissionsState.shouldShowRationale) {
            "This app needs access to your camera and location to allow face check-ins. Please grant the permissions."
        } else {
            "Please grant camera and location permissions to use this feature."
        }

        Text(text = textToShow, modifier = Modifier.padding(16.dp))
        Button(onClick = { permissionsState.launchMultiplePermissionRequest() }) {
            Text("Request Permissions")
        }
    }
}

// ... (HistoryScreen and ProfileScreen remain the same) ...
