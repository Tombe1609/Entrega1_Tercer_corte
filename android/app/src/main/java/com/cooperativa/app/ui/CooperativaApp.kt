package com.cooperativa.app.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.cooperativa.app.data.Session
import com.cooperativa.app.ui.screens.AdminAhorrosScreen
import com.cooperativa.app.ui.screens.AdminFuncionariosScreen
import com.cooperativa.app.ui.screens.AdminInteresesScreen
import com.cooperativa.app.ui.screens.AdminMovimientosAhorroScreen
import com.cooperativa.app.ui.screens.AdminPagosScreen
import com.cooperativa.app.ui.screens.AdminPanelScreen
import com.cooperativa.app.ui.screens.AdminPrestamosScreen
import com.cooperativa.app.ui.screens.AdminUsuariosScreen
import com.cooperativa.app.ui.screens.AhorrosScreen
import com.cooperativa.app.ui.screens.DepositarScreen
import com.cooperativa.app.ui.screens.DistribuirInteresesScreen
import com.cooperativa.app.ui.screens.HistorialPagosScreen
import com.cooperativa.app.ui.screens.GestionCuentasAccesoScreen
import com.cooperativa.app.ui.screens.HomeScreen
import com.cooperativa.app.ui.screens.InteresesScreen
import com.cooperativa.app.ui.screens.LoginScreen
import com.cooperativa.app.ui.screens.MovimientosScreen
import com.cooperativa.app.ui.screens.PerfilScreen
import com.cooperativa.app.ui.screens.PrestamoDetalleScreen
import com.cooperativa.app.ui.screens.PrestamosScreen
import com.cooperativa.app.ui.screens.RetirarScreen
import com.cooperativa.app.ui.screens.SolicitarPrestamoScreen
import com.cooperativa.app.ui.screens.TiendaScreen
import com.cooperativa.app.ui.screens.TransferirScreen
import com.cooperativa.app.ui.screens.GestionCatalogoScreen
import com.cooperativa.app.ui.screens.MisComprasScreen
import com.cooperativa.app.ui.theme.CooperativaTheme

private val TABS = listOf(
    "inicio" to "Inicio",
    "ahorros" to "Ahorros",
    "prestamos" to "Préstamos",
    "movimientos" to "Movimientos",
    "perfil" to "Perfil",
)

private fun destinoInicial(s: Session?) = when {
    s == null -> "login"
    s.esAdmin -> "admin"
    else -> "inicio"
}

@Composable
fun CooperativaApp(vm: MainViewModel) {
    val themeSession by vm.session.collectAsState()
    CooperativaTheme(themeSession?.rol) { CooperativaAppContent(vm) }
}

@Composable
private fun CooperativaAppContent(vm: MainViewModel) {
    val nav = rememberNavController()
    val snackbar = remember { SnackbarHostState() }
    val inicio = remember { destinoInicial(vm.session.value) }
    val ruta = nav.currentBackStackEntryAsState().value?.destination?.route

    LaunchedEffect(Unit) { vm.messages.collect { snackbar.showSnackbar(it) } }
    LaunchedEffect(Unit) {
        vm.sessionExpired.collect {
            nav.navigate("login") { popUpTo(nav.graph.id) { inclusive = true } }
            snackbar.showSnackbar("Tu sesión venció. Inicia sesión de nuevo.")
        }
    }

    fun cerrarSesion() {
        vm.logout()
        nav.navigate("login") { popUpTo(nav.graph.id) { inclusive = true } }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        bottomBar = {
            if (ruta in TABS.map { it.first }) {
                BottomBar(TABS, ruta) { destino ->
                    nav.navigate(destino) {
                        popUpTo("inicio") { saveState = false }
                        launchSingleTop = true
                    }
                }
            }
        },
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
    ) { padding ->
        NavHost(nav, startDestination = inicio, modifier = Modifier.padding(padding)) {
            composable("login") {
                LoginScreen(vm) { s ->
                    nav.navigate(destinoInicial(s)) { popUpTo(nav.graph.id) { inclusive = true } }
                }
            }

            // ----- Estudiante -----
            composable("inicio") { HomeScreen(vm, nav) }
            composable("ahorros") { AhorrosScreen(vm, nav) }
            composable("prestamos") { PrestamosScreen(vm, nav) }
            composable("movimientos") { MovimientosScreen(vm, nav) }
            composable("perfil") { PerfilScreen(vm) { cerrarSesion() } }
            composable("depositar") { DepositarScreen(vm, nav) }
            composable("retirar") { RetirarScreen(vm, nav) }
            composable("solicitar") { SolicitarPrestamoScreen(vm, nav) }
            composable("solicitarProducto/{id}") { SolicitarPrestamoScreen(vm,nav,it.arguments?.getString("id")) }
            composable("tienda") { TiendaScreen(vm,nav) }
            composable("misCompras") { MisComprasScreen(vm,nav) }
            composable("transferir") { TransferirScreen(vm,nav) }
            composable("intereses") { InteresesScreen(vm, nav) }
            composable("prestamo/{id}") { PrestamoDetalleScreen(vm, nav, it.arguments?.getString("id").orEmpty()) }
            composable("pagos/{id}") { HistorialPagosScreen(vm, nav, it.arguments?.getString("id").orEmpty()) }

            // ----- Funcionario / rector -----
            composable("admin") { AdminPanelScreen(vm, nav) { cerrarSesion() } }
            composable("a_usuarios") { AdminUsuariosScreen(vm, nav) }
            composable("a_cuentas_acceso") {
                if (vm.session.value?.rol == "rector") GestionCuentasAccesoScreen(vm, nav)
                else androidx.compose.material3.Text("Acceso restringido")
            }
            composable("a_funcionarios") { AdminFuncionariosScreen(vm, nav) }
            composable("a_ahorros") { AdminAhorrosScreen(vm, nav) }
            composable("a_depositos") { AdminMovimientosAhorroScreen(vm, nav, "deposito") }
            composable("a_retiros") { AdminMovimientosAhorroScreen(vm, nav, "retiro") }
            composable("a_prestamos") { AdminPrestamosScreen(vm, nav) }
            composable("a_catalogo") { GestionCatalogoScreen(vm,nav) }
            composable("a_pagos") { AdminPagosScreen(vm, nav) }
            composable("a_intereses") { AdminInteresesScreen(vm, nav) }
            composable("a_movimientos") { AdminMovimientosAhorroScreen(vm, nav, null) }
            composable("a_distribuir") { DistribuirInteresesScreen(vm, nav) }
        }
    }
}
