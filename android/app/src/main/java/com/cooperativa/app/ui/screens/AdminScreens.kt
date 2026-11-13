package com.cooperativa.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.clickable
import androidx.compose.material3.Text
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.cooperativa.app.ui.AdminData
import com.cooperativa.app.ui.AppCard
import com.cooperativa.app.ui.AppTextField
import com.cooperativa.app.ui.ChipKind
import com.cooperativa.app.ui.Divider
import com.cooperativa.app.ui.DropdownField
import com.cooperativa.app.ui.ErrorText
import com.cooperativa.app.ui.Fmt
import com.cooperativa.app.ui.InfoBox
import com.cooperativa.app.ui.LabelValue
import com.cooperativa.app.ui.ListRow
import com.cooperativa.app.ui.MainViewModel
import com.cooperativa.app.ui.PrestamoAdmin
import com.cooperativa.app.ui.MoneyField
import com.cooperativa.app.ui.PrimaryButton
import com.cooperativa.app.ui.RowLine
import com.cooperativa.app.ui.ScreenScaffold
import com.cooperativa.app.ui.SecondaryButton
import com.cooperativa.app.ui.StateContent
import com.cooperativa.app.ui.StatusChip
import com.cooperativa.app.ui.WarningBox
import com.cooperativa.app.ui.Tile
import com.cooperativa.app.ui.UiState
import com.cooperativa.app.ui.montoDe
import com.cooperativa.app.ui.theme.GreenText
import com.cooperativa.app.ui.theme.Ink
import com.cooperativa.app.ui.theme.Muted
import com.cooperativa.app.ui.theme.RedText

val CARGOS = listOf(
    "Director financiero", "Asesor de créditos", "Tesorero",
    "Auxiliar administrativo", "Analista financiero", "Coordinador de cartera",
)

private fun UiState<AdminData>.data(): AdminData? = (this as? UiState.Success)?.data

// =====================================================================
// PANEL ADMINISTRATIVO
// =====================================================================
@Composable
fun AdminPanelScreen(vm: MainViewModel, nav: NavController, onLogout: () -> Unit) {
    val session by vm.session.collectAsState()
    val st by vm.admin.collectAsState()
    LaunchedEffect(Unit) { vm.cargarAdmin() }

    val esRector = session?.rol == "rector"
    val nombre = session?.nombre?.trim()?.takeIf { it.isNotEmpty() }?.split(" ")?.firstOrNull() ?: "bienvenido"
    ScreenScaffold(
        title = "Hola, $nombre",
        subtitle = if (esRector) "Panel del rector · Control general" else "Panel del funcionario · Gestión diaria",
    ) {
        Text(if (esRector) "COOPERATIVA · DIRECCIÓN" else "COOPERATIVA · OPERACIONES", color = Color.White.copy(alpha = 0.78f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
        StateContent(st, onRetry = { vm.cargarAdmin() }) { d ->
            val s = d.stats
            val activos = s.prestamos?.porEstado?.firstOrNull { it.estado == "activo" }?.cantidad ?: 0
            val pendientes = s.prestamos?.porEstado?.firstOrNull { it.estado == "pendiente" }?.cantidad ?: 0
            val pagados = s.prestamos?.porEstado?.firstOrNull { it.estado == "pagado" }?.cantidad ?: 0
            Text("Resumen de la cooperativa", color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 19.sp)
            Text("Indicadores generales", color = Muted, fontSize = 13.sp)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                AppCard(Modifier.weight(1f)) { LabelValue("Total de usuarios", "${s.estudiantes?.cantidad ?: 0}", valueColor = MaterialTheme.colorScheme.primary) }
                AppCard(Modifier.weight(1f)) { LabelValue("Total de ahorros", Fmt.money(s.ahorros?.totalAhorrado ?: 0.0), valueColor = MaterialTheme.colorScheme.primary) }
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                AppCard(Modifier.weight(1f)) { LabelValue("Total prestado", Fmt.money(s.prestamos?.totalPrestado ?: 0.0), valueColor = MaterialTheme.colorScheme.secondary) }
                AppCard(Modifier.weight(1f)) { LabelValue("Intereses pendientes", Fmt.money(s.prestamos?.totalInteresesPendientes ?: 0.0), valueColor = MaterialTheme.colorScheme.secondary) }
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                AppCard(Modifier.weight(1f)) { LabelValue("Préstamos activos", "$activos", valueColor = MaterialTheme.colorScheme.primary) }
                AppCard(Modifier.weight(1f)) { LabelValue("Préstamos pagados", "$pagados", valueColor = MaterialTheme.colorScheme.primary) }
            }
            AppCard { LabelValue("Solicitudes por aprobar", "$pendientes", valueColor = MaterialTheme.colorScheme.secondary) }
        }
        Text("Accesos rápidos", color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp)
        Text("Selecciona un módulo para continuar", color = Muted, fontSize = 13.sp)
        val tiles = buildList {
            add("Usuarios" to "a_usuarios")
            add("Funcionarios" to "a_funcionarios")
            if (session?.rol == "rector") add("Cuentas de acceso" to "a_cuentas_acceso")
            add("Ahorros" to "a_ahorros")
            add("Depósitos" to "a_depositos")
            add("Retiros" to "a_retiros")
            add("Préstamos" to "a_prestamos")
            add("Catálogo" to "a_catalogo")
            add("Pagos" to "a_pagos")
            add("Intereses" to "a_intereses")
            add("Movimientos" to "a_movimientos")
            if (session?.rol == "rector") add("Distribuir intereses" to "a_distribuir")
        }
        tiles.chunked(2).forEachIndexed { fila, par ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                par.forEachIndexed { col, (texto, ruta) ->
                    Tile(texto, if (col == 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondary, Modifier.weight(1f)) { nav.navigate(ruta) }
                }
            }
        }
        SecondaryButton("Cerrar sesión", color = RedText) { onLogout() }
    }
}

// =====================================================================
// USUARIOS
// =====================================================================
@Composable
fun AdminUsuariosScreen(vm: MainViewModel, nav: NavController) {
    val st by vm.admin.collectAsState()
    val session by vm.session.collectAsState()
    LaunchedEffect(Unit) { vm.cargarAdmin() }
    var busqueda by remember { mutableStateOf("") }
    var seleccionado by remember { mutableStateOf<String?>(null) }

    ScreenScaffold("Gestionar usuarios", onBack = { nav.popBackStack() }) {
        AppTextField("Buscar usuario", busqueda, { busqueda = it }, placeholder = "Nombre o documento")
        StateContent(st, onRetry = { vm.cargarAdmin() }) { d ->
            val lista = d.estudiantes.filter {
                busqueda.isBlank() || it.nombre.contains(busqueda, true) || it.documento.contains(busqueda)
            }
            if (lista.isEmpty()) Text("No se encontraron usuarios.", color = Muted)
            lista.forEach { u ->
                val saldo = d.cuentas.firstOrNull { it.usuarioId == u.usuarioId }?.saldo
                AppCard {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text(u.nombre, color = Ink, fontWeight = FontWeight.Bold, fontSize = 18.sp, modifier = Modifier.weight(1f))
                        StatusChip(u.estado.replaceFirstChar { it.uppercase() }, if (u.estado == "activo") ChipKind.GREEN else ChipKind.ORANGE)
                    }
                    Text("Doc. ${u.documento} · ${u.telefono}", color = Muted, fontSize = 14.sp)
                    Text("${u.email} · Socio estudiante", color = Muted, fontSize = 14.sp)
                    Spacer(Modifier.height(10.dp))
                    SecondaryButton(if (seleccionado == u.usuarioId) "Ocultar" else "Ver todo") {
                        seleccionado = if (seleccionado == u.usuarioId) null else u.usuarioId
                    }
                    if (seleccionado == u.usuarioId) {
                        Spacer(Modifier.height(8.dp))
                        RowLine("ID", u.usuarioId)
                        RowLine("Saldo de ahorro", saldo?.let { Fmt.money(it) } ?: "Sin cuenta")
                        val pres = d.prestamos.filter { it.prestamo.prestamoId.isNotBlank() && it.usuarioId == u.usuarioId }
                        RowLine("Préstamos", "${pres.size}")
                    }
                }
            }
        }
        if (session?.rol == "rector") {
            PrimaryButton("Crear cuenta de acceso") { nav.navigate("a_cuentas_acceso") }
        }
    }
}

// =====================================================================
// FUNCIONARIOS
// =====================================================================
@Composable
fun AdminFuncionariosScreen(vm: MainViewModel, nav: NavController) {
    val st by vm.admin.collectAsState()
    val session by vm.session.collectAsState()
    LaunchedEffect(Unit) { vm.cargarAdmin() }
    ScreenScaffold("Funcionarios", onBack = { nav.popBackStack() }) {
        StateContent(st, onRetry = { vm.cargarAdmin() }) { d ->
            d.funcionarios.forEach { f ->
                AppCard {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text(f.nombre, color = Ink, fontWeight = FontWeight.Bold, fontSize = 18.sp, modifier = Modifier.weight(1f))
                        StatusChip(f.estado.replaceFirstChar { it.uppercase() }, if (f.estado == "activo") ChipKind.GREEN else ChipKind.ORANGE)
                    }
                    Text("${f.funcionarioId} · ${f.cargo}", color = Muted, fontSize = 14.sp)
                    Text("${f.email} · ${f.telefono}", color = Muted, fontSize = 14.sp)
                }
            }
        }
        if (session?.rol == "rector") {
            PrimaryButton("Crear cuenta de acceso") { nav.navigate("a_cuentas_acceso") }
        }
    }
}

// =====================================================================
// CREACIÓN DE CUENTAS CON CREDENCIALES (solo rector; el backend vuelve a validar el rol)
// =====================================================================
@Composable
fun GestionCuentasAccesoScreen(vm: MainViewModel, nav: NavController) {
    val busy by vm.busy.collectAsState()
    val error by vm.formError.collectAsState()
    LaunchedEffect(Unit) { vm.limpiarError() }
    var tipo by remember { mutableStateOf("Estudiante") }
    var nombre by remember { mutableStateOf("") }
    var documento by remember { mutableStateOf("") }
    var telefono by remember { mutableStateOf("") }
    var correo by remember { mutableStateOf("") }
    var cargo by remember { mutableStateOf(CARGOS[0]) }
    var password by remember { mutableStateOf("") }
    val tipos = listOf("Estudiante", "Funcionario")

    ScreenScaffold(
        "Cuentas de acceso",
        "Crea usuarios que puedan iniciar sesión en CooperativaApp",
        onBack = { nav.popBackStack() },
    ) {
        AppCard {
            DropdownField("Tipo de cuenta", tipo, tipos, { tipo = tipos[it] })
            AppTextField("Nombre completo", nombre, { nombre = it })
            if (tipo == "Estudiante") {
                AppTextField("Documento", documento, { documento = it.filter(Char::isDigit) }, keyboard = KeyboardType.Number)
            } else {
                DropdownField("Cargo", cargo, CARGOS, { cargo = CARGOS[it] })
            }
            AppTextField("Teléfono", telefono, { telefono = it.filter(Char::isDigit) }, keyboard = KeyboardType.Phone)
            AppTextField("Correo electrónico", correo, { correo = it }, keyboard = KeyboardType.Email)
            AppTextField("Contraseña inicial (mínimo 8 caracteres)", password, { password = it }, password = true)
            Spacer(Modifier.height(4.dp))
            Text(
                "La contraseña se guarda mediante un hash seguro. Comunica la contraseña inicial al usuario por un canal seguro y pídele cambiarla cuando esté disponible esa función.",
                color = Muted, fontSize = 13.sp,
            )
        }
        ErrorText(error)
        PrimaryButton("Crear cuenta", loading = busy) {
            when {
                nombre.isBlank() || correo.isBlank() || telefono.isBlank() || password.isBlank() -> vm.avisar("Completa los campos obligatorios.")
                tipo == "Estudiante" && documento.isBlank() -> vm.avisar("Escribe el documento del estudiante.")
                password.length < 8 -> vm.avisar("La contraseña debe tener mínimo 8 caracteres.")
                else -> vm.crearCuentaAcceso(tipo, nombre, documento, telefono, correo, cargo, password) {
                    nav.popBackStack()
                }
            }
        }
    }
}

// =====================================================================
// LISTAS GENERALES (ahorros, depósitos, retiros, préstamos, pagos, intereses, movimientos)
// =====================================================================
@Composable
fun AdminAhorrosScreen(vm: MainViewModel, nav: NavController) {
    val st by vm.admin.collectAsState()
    LaunchedEffect(Unit) { vm.cargarAdmin() }
    ScreenScaffold("Ahorros", "Cuentas de los socios", onBack = { nav.popBackStack() }) {
        StateContent(st, onRetry = { vm.cargarAdmin() }) { d ->
            AppCard {
                d.cuentas.forEachIndexed { i, c ->
                    if (i > 0) Divider()
                    ListRow(
                        title = d.nombreDe(c.usuarioId),
                        subtitle = "${c.ahorroId} · ${c.usuarioId}",
                        trailing = Fmt.money(c.saldo),
                        badge = { StatusChip(c.estado.replaceFirstChar { it.uppercase() }, if (c.estado == "activo") ChipKind.GREEN else ChipKind.GREY) },
                    )
                }
            }
        }
    }
}

@Composable
fun AdminMovimientosAhorroScreen(vm: MainViewModel, nav: NavController, tipo: String?) {
    val st by vm.admin.collectAsState()
    val busy by vm.busy.collectAsState()
    val error by vm.formError.collectAsState()
    LaunchedEffect(Unit) { vm.cargarAdmin(); vm.limpiarError() }
    var mostrarForm by remember { mutableStateOf(false) }
    var cuentaIdx by remember { mutableStateOf(-1) }
    var monto by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }
    val titulo = when (tipo) { "deposito" -> "Depósitos"; "retiro" -> "Retiros"; else -> "Movimientos" }

    ScreenScaffold(titulo, "Registro de la cooperativa", onBack = { nav.popBackStack() }) {
        if (tipo != null) {
            if (!mostrarForm) {
                PrimaryButton(if (tipo == "deposito") "Registrar depósito" else "Registrar retiro") { mostrarForm = true }
            } else {
                val d = st.data()
                val cuentas = d?.cuentas.orEmpty()
                AppCard {
                    DropdownField("Cuenta", cuentas.getOrNull(cuentaIdx)?.let { "${it.ahorroId} · ${d?.nombreDe(it.usuarioId)}" }.orEmpty(),
                        cuentas.map { "${it.ahorroId} · ${d?.nombreDe(it.usuarioId)} (${Fmt.money(it.saldo)})" }, { cuentaIdx = it })
                    Spacer(Modifier.height(10.dp))
                    MoneyField("Monto", monto, { monto = it })
                    Spacer(Modifier.height(10.dp))
                    AppTextField("Descripción", desc, { desc = it })
                    Spacer(Modifier.height(10.dp))
                    ErrorText(error)
                    Spacer(Modifier.height(10.dp))
                    PrimaryButton("Confirmar", enabled = cuentaIdx >= 0 && montoDe(monto) > 0, loading = busy) {
                        vm.movimientoAdmin(cuentas[cuentaIdx].ahorroId, tipo, montoDe(monto), desc) {
                            mostrarForm = false; monto = ""; desc = ""; cuentaIdx = -1
                        }
                    }
                }
            }
        }
        StateContent(st, onRetry = { vm.cargarAdmin() }) { d ->
            val lista = d.movimientos.filter { tipo == null || it.tipo == tipo }
                .sortedByDescending { Fmt.parse(it.fecha) ?: java.time.Instant.EPOCH }
            AppCard {
                if (lista.isEmpty()) Text("No hay registros.", color = Muted)
                lista.forEachIndexed { i, m ->
                    val dep = m.tipo == "deposito"
                    if (i > 0) Divider()
                    ListRow(
                        title = if (dep) "Depósito" else "Retiro",
                        subtitle = "${d.nombreDe(m.usuarioId)} · ${Fmt.fechaCorta(m.fecha)}",
                        extra = m.descripcion,
                        trailing = Fmt.signed(if (dep) m.valor else -m.valor),
                        trailingColor = if (dep) GreenText else RedText,
                    )
                }
            }
        }
    }
}

@Composable
fun AdminPrestamosScreen(vm: MainViewModel, nav: NavController) {
    val st by vm.admin.collectAsState()
    val busy by vm.busy.collectAsState()
    val error by vm.formError.collectAsState()
    var solicitudAprobar by remember { mutableStateOf<PrestamoAdmin?>(null) }
    LaunchedEffect(Unit) { vm.cargarAdmin() }
    ScreenScaffold("Préstamos", "Préstamos educativos al 5% de interés", onBack = { nav.popBackStack() }) {
        StateContent(st, onRetry = { vm.cargarAdmin() }) { d ->
            d.prestamos.sortedByDescending { it.prestamo.prestamoId }.forEach { pa ->
                val p = pa.prestamo
                val pendiente = p.estado == "pendiente"
                AppCard {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("${p.prestamoId} · ${pa.nombre}", color = Ink, fontWeight = FontWeight.Bold, fontSize = 17.sp, modifier = Modifier.weight(1f))
                        StatusChip(
                            when (p.estado) { "pendiente" -> "Pendiente"; "activo" -> "Activo"; else -> p.estado.replaceFirstChar { it.uppercase() } },
                            when { pendiente -> ChipKind.ORANGE; p.estado == "activo" -> ChipKind.GREEN; else -> ChipKind.GREY },
                        )
                    }
                    Text("${p.finalidad ?: p.finId} · ${Fmt.fechaLarga(p.fechaSolicitud)}", color = Muted, fontSize = 13.sp)
                    Spacer(Modifier.height(8.dp))
                    Row(Modifier.fillMaxWidth()) {
                        LabelValue(if (pendiente) "Monto solicitado" else "Monto inicial", Fmt.money(p.capitalInicial), Modifier.weight(1f))
                        LabelValue(if (pendiente) "Interés estimado" else "Capital pendiente", Fmt.money(if (pendiente) p.interesPendiente else p.capitalPendiente), Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(6.dp))
                    if (pendiente) {
                        Text("El saldo de ahorro no cambia hasta aprobar el desembolso.", color = Muted, fontSize = 13.sp)
                        Spacer(Modifier.height(10.dp))
                        PrimaryButton("Revisar y aprobar solicitud") {
                            vm.limpiarError()
                            solicitudAprobar = pa
                        }
                    } else {
                        LabelValue("Interés pendiente", Fmt.money(p.interesPendiente))
                        p.fechaDesembolso?.let { Text("Desembolsado: ${Fmt.fechaLarga(it)}", color = Muted, fontSize = 13.sp) }
                        if (p.estado == "activo" && p.fechaDesembolso == null) {
                            Spacer(Modifier.height(8.dp))
                            WarningBox("Falta la fecha de desembolso histórica. Verifica el soporte antes de conciliar este préstamo.")
                        }
                        if (p.estado == "activo" && p.cuotas.isEmpty()) {
                            Spacer(Modifier.height(8.dp))
                            WarningBox("Falta el plan de cuotas. Registra el plazo y la primera fecha de pago antes de que el estudiante pueda pagar.")
                        }
                    }
                }
            }
        }
        solicitudAprobar?.let { solicitud ->
            AlertDialog(
                onDismissRequest = { if (!busy) solicitudAprobar = null },
                title = { Text("Aprobar y desembolsar") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Se acreditarán ${Fmt.money(solicitud.prestamo.capitalInicial)} a la cuenta de ahorro de ${solicitud.nombre} y se guardará el movimiento en MongoDB.")
                        error?.let { Text(it, color = RedText) }
                    }
                },
                confirmButton = {
                    TextButton(enabled = !busy, onClick = {
                        vm.aprobarPrestamo(solicitud.prestamo.prestamoId) { solicitudAprobar = null }
                    }) { Text(if (busy) "Procesando…" else "Confirmar desembolso") }
                },
                dismissButton = {
                    TextButton(enabled = !busy, onClick = { solicitudAprobar = null }) { Text("Cancelar") }
                },
            )
        }
    }
}

@Composable
fun AdminPagosScreen(vm: MainViewModel, nav: NavController) {
    val st by vm.admin.collectAsState()
    LaunchedEffect(Unit) { vm.cargarAdmin() }
    ScreenScaffold("Pagos", "Cuotas debitadas desde ahorros", onBack = { nav.popBackStack() }) {
        StateContent(st, onRetry = { vm.cargarAdmin() }) { d ->
            val lista = d.pagos.sortedByDescending { Fmt.parse(it.fecha) ?: java.time.Instant.EPOCH }
            AppCard {
                if (lista.isEmpty()) Text("No hay pagos registrados.", color = Muted)
                lista.forEachIndexed { i, pg ->
                    if (i > 0) Divider()
                    val cuota = pg.tipoAbono == "cuota"
                    val cap = pg.tipoAbono == "capital"
                    ListRow(
                        title = "${pg.pagoId} · ${if (cuota) "Cuota ${pg.cuotaNumero}" else if (cap) "Capital" else "Interés"}",
                        subtitle = "${d.nombreDe(pg.usuarioId)} · ${pg.prestamoId} · ${Fmt.fechaCorta(pg.fecha)}",
                        trailing = Fmt.money(pg.valor),
                    )
                }
            }
        }
    }
}

@Composable
fun AdminInteresesScreen(vm: MainViewModel, nav: NavController) {
    val st by vm.admin.collectAsState()
    LaunchedEffect(Unit) { vm.cargarAdmin() }
    ScreenScaffold("Intereses", "Intereses pendientes por préstamo activo", onBack = { nav.popBackStack() }) {
        StateContent(st, onRetry = { vm.cargarAdmin() }) { d ->
            InfoBox { RowLine("Total pendiente", Fmt.money(d.stats.prestamos?.totalInteresesPendientes ?: 0.0)) }
            AppCard {
                val activos = d.prestamos.filter { it.prestamo.estado == "activo" }
                if (activos.isEmpty()) Text("No hay préstamos activos.", color = Muted)
                activos.forEachIndexed { i, pa ->
                    if (i > 0) Divider()
                    ListRow(
                        title = pa.nombre,
                        subtitle = "${pa.prestamo.prestamoId} · capital ${Fmt.money(pa.prestamo.capitalPendiente)}",
                        trailing = Fmt.money(pa.prestamo.interesPendiente),
                    )
                }
            }
        }
    }
}

// =====================================================================
// DISTRIBUIR INTERESES
// =====================================================================
@Composable
fun DistribuirInteresesScreen(vm: MainViewModel, nav: NavController) {
    val admin by vm.admin.collectAsState()
    val calculo by vm.calculo.collectAsState()
    val busy by vm.busy.collectAsState()
    val error by vm.formError.collectAsState()
    var periodo by remember { mutableStateOf(Fmt.periodoActual()) }
    var intereses by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        vm.limpiarError()
        vm.cargarAdmin()
    }
    // Valor inicial: los intereses pendientes del panel (solo la primera vez)
    LaunchedEffect(admin) {
        val d = admin.data()
        if (d != null && intereses.isBlank()) {
            val v = d.stats.prestamos?.totalInteresesPendientes ?: 0.0
            if (v > 0) { intereses = v.toLong().toString(); vm.calcularDistribucion(v) }
        }
    }

    ScreenScaffold("Distribuir intereses", "Periodo: $periodo", onBack = { nav.popBackStack() }) {
        AppTextField("Periodo (AAAA-MM)", periodo, { periodo = it.take(7) }, keyboard = KeyboardType.Number)
        MoneyField("Intereses generados a distribuir", intereses, { intereses = it })
        SecondaryButton("Calcular distribución") {
            if (montoDe(intereses) > 0) vm.calcularDistribucion(montoDe(intereses)) else vm.avisar("Escribe los intereses a distribuir.")
        }
        StateContent(calculo, onRetry = { vm.calcularDistribucion(montoDe(intereses)) }) { c ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                AppCard(Modifier.weight(1f)) { LabelValue("Generados", Fmt.money(c.interesesGenerados)) }
                AppCard(Modifier.weight(1f)) { LabelValue("A distribuir", Fmt.money(c.sumaDistribuida)) }
            }
            AppCard {
                val d = admin.data()
                c.distribucion.forEachIndexed { i, x ->
                    if (i > 0) Divider()
                    ListRow(
                        title = d?.nombreDe(x.usuarioId) ?: x.usuarioId,
                        subtitle = "${Fmt.porcentaje(x.participacion)} de los ahorros",
                        trailing = Fmt.money(x.interesRecibido),
                        trailingColor = GreenText,
                    )
                }
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Fecha: ${Fmt.finDeMes(periodo)} · ${c.cantidadAhorradores} beneficiarios", color = Muted, fontSize = 13.sp, modifier = Modifier.weight(1f))
                StatusChip("Pendiente", ChipKind.ORANGE)
            }
            ErrorText(error)
            PrimaryButton("Confirmar distribución", loading = busy) {
                vm.confirmarDistribucion(periodo, montoDe(intereses)) { nav.popBackStack() }
            }
        }
    }
}
