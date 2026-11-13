package com.cooperativa.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.cooperativa.app.data.PrestamoResumen
import com.cooperativa.app.data.Producto
import com.cooperativa.app.ui.AppCard
import com.cooperativa.app.ui.AppTextField
import com.cooperativa.app.ui.Categoria
import com.cooperativa.app.ui.ChipKind
import com.cooperativa.app.ui.DropdownField
import com.cooperativa.app.ui.DatePickerField
import com.cooperativa.app.ui.Divider
import com.cooperativa.app.ui.ErrorText
import com.cooperativa.app.ui.Fmt
import com.cooperativa.app.ui.InfoBox
import com.cooperativa.app.ui.LabelValue
import com.cooperativa.app.ui.ListRow
import com.cooperativa.app.ui.MainViewModel
import com.cooperativa.app.ui.MoneyField
import com.cooperativa.app.ui.PrimaryButton
import com.cooperativa.app.ui.RowLine
import com.cooperativa.app.ui.ScreenScaffold
import com.cooperativa.app.ui.SecondaryButton
import com.cooperativa.app.ui.StateContent
import com.cooperativa.app.ui.StatusChip
import com.cooperativa.app.ui.StudentData
import com.cooperativa.app.ui.Tile
import com.cooperativa.app.ui.UiState
import com.cooperativa.app.ui.WarningBox
import com.cooperativa.app.ui.historial
import com.cooperativa.app.ui.montoDe
import com.cooperativa.app.ui.periodoTexto
import com.cooperativa.app.ui.theme.GreenText
import com.cooperativa.app.ui.theme.Ink
import com.cooperativa.app.ui.theme.Line
import com.cooperativa.app.ui.theme.Muted
import com.cooperativa.app.ui.theme.RedText
import com.cooperativa.app.ui.theme.Teal

private fun StudentData.prestamoActivo(): PrestamoResumen? = prestamos.prestamos.firstOrNull { it.estado == "activo" }

private fun StudentData.ultimoPago(id: String): String =
    pagos[id].orEmpty().maxByOrNull { Fmt.parse(it.fecha) ?: java.time.Instant.EPOCH }?.let { Fmt.fechaLarga(it.fecha) } ?: "—"

@Composable
private fun SaldoHeader(st: UiState<StudentData>, etiqueta: String) {
    if (st is UiState.Success) {
        Spacer(Modifier.height(12.dp))
        Text(etiqueta, color = Color.White.copy(alpha = 0.8f), fontSize = 14.sp)
        Text(Fmt.money(st.data.cuenta.saldo), color = Color.White, fontSize = 40.sp, fontWeight = FontWeight.ExtraBold)
    }
}

// =====================================================================
// INICIO
// =====================================================================
@Composable
fun HomeScreen(vm: MainViewModel, nav: NavController) {
    val session by vm.session.collectAsState()
    val st by vm.student.collectAsState()
    LaunchedEffect(Unit) { vm.cargarEstudiante() }
    val nombre = session?.nombre?.split(" ")?.firstOrNull().orEmpty()

    ScreenScaffold(
        title = "Hola, $nombre",
        subtitle = "Socio estudiante",
        headerExtra = { SaldoHeader(st, "Saldo total de ahorros") },
    ) {
        StateContent(st, onRetry = { vm.cargarEstudiante() }) { d ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                AppCard(Modifier.weight(1f), onClick = { nav.navigate("prestamos") }) { LabelValue("Capital pendiente", Fmt.money(d.prestamos.totalCapitalPendiente)) }
                AppCard(Modifier.weight(1f), onClick = { nav.navigate("intereses") }) {
                    LabelValue("Intereses pendientes", Fmt.money(d.prestamos.totalInteresPendiente))
                }
            }
            if (d.prestamoActivo() != null) {
                val activo = d.prestamoActivo()!!
                val siguienteCuota = activo.cuotas.firstOrNull { it.estado == "pendiente" }
                if (siguienteCuota != null) {
                    WarningBoxRow("Próxima cuota", Fmt.fechaLarga(siguienteCuota.fechaVencimiento), Fmt.money(siguienteCuota.valor)) {
                        nav.navigate("prestamo/${activo.prestamoId}")
                    }
                } else {
                    WarningBoxRow("Plan de cuotas pendiente", "Requiere revisión", Fmt.money(d.prestamos.totalInteresPendiente)) {
                        nav.navigate("prestamo/${activo.prestamoId}")
                    }
                }
            }
            Text("¿Qué quieres hacer hoy?", color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp)
            Text("Accesos directos a tus servicios", color = Muted, fontSize = 13.sp)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Tile("Depositar ahorro", MaterialTheme.colorScheme.secondary, Modifier.weight(1f)) { nav.navigate("depositar") }
                Tile("Solicitar préstamo", MaterialTheme.colorScheme.primary, Modifier.weight(1f)) { nav.navigate("solicitar") }
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Tile("Realizar pago", MaterialTheme.colorScheme.primary, Modifier.weight(1f)) {
                    val activo = d.prestamoActivo()
                    if (activo != null) nav.navigate("prestamo/${activo.prestamoId}") else vm.avisar("No tienes préstamos activos para pagar.")
                }
                Tile("Ver movimientos", MaterialTheme.colorScheme.secondary, Modifier.weight(1f)) { nav.navigate("movimientos") }
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Tile("Tienda", MaterialTheme.colorScheme.secondary, Modifier.weight(1f)) { nav.navigate("tienda") }
                Tile("Transferir", MaterialTheme.colorScheme.primary, Modifier.weight(1f)) { nav.navigate("transferir") }
            }
        }
    }
}

@Composable
private fun WarningBoxRow(label: String, fecha: String, valor: String, onClick: () -> Unit) {
    Surface(shape = RoundedCornerShape(20.dp), color = com.cooperativa.app.ui.theme.CreamBg, modifier = Modifier.fillMaxWidth().clickable { onClick() }) {
        Row(Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(label, color = com.cooperativa.app.ui.theme.CreamText, fontSize = 14.sp)
                Text(fecha, color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp)
                Text("Toca para ver el préstamo", color = com.cooperativa.app.ui.theme.CreamText, fontSize = 12.sp)
            }
            Text(valor, color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp)
        }
    }
}

// =====================================================================
// AHORROS
// =====================================================================
@Composable
fun AhorrosScreen(vm: MainViewModel, nav: NavController) {
    val st by vm.student.collectAsState()
    LaunchedEffect(Unit) { vm.cargarEstudiante() }

    ScreenScaffold(
        title = "Mis ahorros",
        headerExtra = {
            SaldoHeader(st, "Saldo actual")
            if (st is UiState.Success) {
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("Cuenta ${(st as UiState.Success<StudentData>).data.cuenta.ahorroId}", color = Color.White.copy(alpha = 0.8f), fontSize = 14.sp)
                    StatusChip((st as UiState.Success<StudentData>).data.cuenta.estado.replaceFirstChar { it.uppercase() })
                }
            }
        },
    ) {
        StateContent(st, onRetry = { vm.cargarEstudiante() }) { d ->
            PrimaryButton("Realizar depósito") { nav.navigate("depositar") }
            SecondaryButton("Solicitar retiro") { nav.navigate("retirar") }
            Text("Historial", color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp)
            AppCard {
                val ordenados = d.movimientos.sortedByDescending { Fmt.parse(it.fecha) ?: java.time.Instant.EPOCH }
                if (ordenados.isEmpty()) Text("Aún no tienes movimientos de ahorro.", color = Muted)
                var saldo = d.cuenta.saldo
                ordenados.forEachIndexed { i, m ->
                    val dep = m.tipo == "deposito"
                    val signed = if (dep) m.valor else -m.valor
                    if (i > 0) Divider()
                    ListRow(
                        title = if (dep) "Depósito" else "Retiro",
                        subtitle = "${Fmt.fechaCorta(m.fecha)} · ${m.descripcion.orEmpty()}",
                        extra = "Saldo: ${Fmt.money(saldo)}",
                        trailing = Fmt.signed(signed),
                        trailingColor = if (dep) GreenText else RedText,
                    )
                    saldo -= signed
                }
            }
        }
    }
}

@Composable
fun DepositarScreen(vm: MainViewModel, nav: NavController) {
    val st by vm.student.collectAsState()
    val busy by vm.busy.collectAsState()
    val error by vm.formError.collectAsState()
    LaunchedEffect(Unit) { vm.limpiarError(); vm.cargarEstudiante() }
    var monto by remember { mutableStateOf("") }
    var metodo by remember { mutableStateOf("Transferencia bancaria") }
    var desc by remember { mutableStateOf("Aporte mensual") }
    val metodos = listOf("Transferencia bancaria", "Efectivo", "Tarjeta débito")
    val saldo = (st as? UiState.Success)?.data?.cuenta?.saldo ?: 0.0

    ScreenScaffold("Realizar depósito", (st as? UiState.Success)?.data?.cuenta?.let { "Cuenta ${it.ahorroId}" }, onBack = { nav.popBackStack() }) {
        MoneyField("Monto", monto, { monto = it })
        DropdownField("Método de depósito", metodo, metodos, { metodo = metodos[it] })
        AppTextField("Descripción", desc, { desc = it })
        AppCard { LabelValue("Fecha", "Hoy · ${Fmt.fechaLarga(java.time.Instant.now().toString())}") }
        InfoBox { RowLine("Nuevo saldo", Fmt.money(saldo + montoDe(monto)), Ink) }
        ErrorText(error)
        PrimaryButton("Confirmar depósito", enabled = montoDe(monto) > 0, loading = busy) {
            vm.depositar(montoDe(monto), "${desc.trim()} · $metodo") { nav.popBackStack() }
        }
    }
}

@Composable
fun RetirarScreen(vm: MainViewModel, nav: NavController) {
    val st by vm.student.collectAsState()
    val busy by vm.busy.collectAsState()
    val error by vm.formError.collectAsState()
    LaunchedEffect(Unit) { vm.limpiarError(); vm.cargarEstudiante() }
    var monto by remember { mutableStateOf("") }
    var motivo by remember { mutableStateOf("") }
    val saldo = (st as? UiState.Success)?.data?.cuenta?.saldo ?: 0.0

    ScreenScaffold("Solicitar retiro", "Disponible: ${Fmt.money(saldo)}", onBack = { nav.popBackStack() }) {
        MoneyField("Monto a retirar", monto, { monto = it })
        AppTextField("Motivo", motivo, { motivo = it }, placeholder = "Ej: Materiales de estudio")
        WarningBox("El retiro se descuenta de inmediato y no puede superar tu saldo disponible.")
        ErrorText(error)
        PrimaryButton("Solicitar retiro", enabled = montoDe(monto) > 0, loading = busy) {
            vm.retirar(montoDe(monto), motivo.trim(), saldo) { nav.popBackStack() }
        }
        SecondaryButton("Cancelar") { nav.popBackStack() }
    }
}

// =====================================================================
// PRÉSTAMOS
// =====================================================================
@Composable
fun PrestamosScreen(vm: MainViewModel, nav: NavController) {
    val st by vm.student.collectAsState()
    LaunchedEffect(Unit) { vm.cargarEstudiante() }

    ScreenScaffold("Mis préstamos", "Préstamos educativos al 5% de interés") {
        PrimaryButton("Solicitar préstamo") { nav.navigate("solicitar") }
        StateContent(st, onRetry = { vm.cargarEstudiante() }) { d ->
            if (d.prestamos.prestamos.isEmpty()) Text("Todavía no has solicitado préstamos.", color = Muted)
            d.prestamos.prestamos.sortedByDescending { it.prestamoId }.forEach { p ->
                val activo = p.estado == "activo"
                val pendiente = p.estado == "pendiente"
                AppCard(onClick = { nav.navigate("prestamo/${p.prestamoId}") }) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text(p.prestamoId, color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 22.sp)
                        StatusChip(
                            when (p.estado) { "pendiente" -> "Pendiente"; "activo" -> "Activo"; else -> p.estado.replaceFirstChar { it.uppercase() } },
                            when { activo -> ChipKind.GREEN; pendiente -> ChipKind.ORANGE; else -> ChipKind.GREY },
                        )
                    }
                    Text("${p.finalidad ?: p.finId} · desde ${Fmt.fechaLarga(p.fechaSolicitud)}", color = Muted, fontSize = 14.sp)
                    Spacer(Modifier.height(10.dp))
                    Row(Modifier.fillMaxWidth()) {
                        LabelValue(if (pendiente) "Monto solicitado" else "Monto inicial", Fmt.money(p.capitalInicial), Modifier.weight(1f))
                        LabelValue(
                            if (pendiente) "Desembolso" else "Capital pendiente",
                            if (pendiente) "Por aprobar" else Fmt.money(p.capitalPendiente),
                            Modifier.weight(1f),
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(Modifier.fillMaxWidth()) {
                        LabelValue(if (pendiente) "Interés estimado (5%)" else "Interés pendiente (5%)", Fmt.money(p.interesPendiente), Modifier.weight(1f))
                        LabelValue("Último pago", d.ultimoPago(p.prestamoId), Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

@Composable
fun PrestamoDetalleScreen(vm: MainViewModel, nav: NavController, id: String) {
    val st by vm.student.collectAsState()
    LaunchedEffect(Unit) { vm.cargarEstudiante() }
    val p = (st as? UiState.Success)?.data?.prestamos?.prestamos?.firstOrNull { it.prestamoId == id }

    ScreenScaffold(
        title = "Préstamo $id",
        onBack = { nav.popBackStack() },
        headerExtra = {
            if (p != null) {
                Spacer(Modifier.height(8.dp))
                Text(if (p.estado == "pendiente") "Monto solicitado" else "Capital pendiente", color = Color.White.copy(alpha = 0.8f), fontSize = 14.sp)
                Text(Fmt.money(if (p.estado == "pendiente") p.capitalInicial else p.capitalPendiente), color = Color.White, fontSize = 38.sp, fontWeight = FontWeight.ExtraBold)
            }
        },
    ) {
        StateContent(st, onRetry = { vm.cargarEstudiante() }) { d ->
            if (p == null) { Text("No se encontró el préstamo.", color = Muted); return@StateContent }
            val activo = p.estado == "activo"
            AppCard {
                Row(Modifier.fillMaxWidth()) {
                    LabelValue("Monto inicial", Fmt.money(p.capitalInicial), Modifier.weight(1f))
                    LabelValue("Interés pendiente", Fmt.money(p.interesPendiente), Modifier.weight(1f))
                }
                Spacer(Modifier.height(10.dp))
                Row(Modifier.fillMaxWidth()) {
                    LabelValue("Tasa de interés", "5%", Modifier.weight(1f))
                    val desembolso = when {
                        p.fechaDesembolso != null -> Fmt.fechaLarga(p.fechaDesembolso)
                        p.estado == "pendiente" -> "Pendiente de aprobación"
                        else -> "Sin registro histórico"
                    }
                    LabelValue("Desembolso", desembolso, Modifier.weight(1f))
                }
                Spacer(Modifier.height(10.dp))
                LabelValue("Propósito educativo", p.finalidad ?: p.finId)
                Spacer(Modifier.height(8.dp))
                StatusChip(
                    when (p.estado) { "pendiente" -> "Pendiente de aprobación"; "activo" -> "Activo"; else -> p.estado.replaceFirstChar { it.uppercase() } },
                    when { activo -> ChipKind.GREEN; p.estado == "pendiente" -> ChipKind.ORANGE; else -> ChipKind.GREY },
                )
            }
            if (p.estado == "pendiente") WarningBox("El dinero se acreditará a tus ahorros cuando un funcionario apruebe esta solicitud.")
            if (p.estado == "activo" && p.fechaDesembolso == null) {
                WarningBox("Este préstamo histórico no tiene fecha de desembolso registrada. Confirma su soporte con un funcionario.")
            }
            if (activo) {
                Text("Plan de cuotas", color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp)
                if (p.cuotas.isEmpty()) {
                    WarningBox("Este préstamo no tiene un plan de cuotas registrado. Un funcionario debe completar el plazo y la fecha antes de que puedas pagar.")
                } else {
                    p.cuotas.forEach { cuota ->
                        val vencida = Fmt.cuotaVencida(cuota.fechaVencimiento)
                        val atrasada = Fmt.cuotaAtrasada(cuota.fechaVencimiento)
                        AppCard {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Cuota ${cuota.numero} · ${Fmt.fechaLarga(cuota.fechaVencimiento)}", color = Ink, fontWeight = FontWeight.Bold)
                                StatusChip(
                                    when { cuota.estado == "pagada" -> "Pagada"; atrasada -> "Vencida"; vencida -> "Vence hoy"; else -> "Aún no vence" },
                                    when { cuota.estado == "pagada" -> ChipKind.GREEN; vencida -> ChipKind.ORANGE; else -> ChipKind.GREY },
                                )
                            }
                            RowLine("Capital", Fmt.money(cuota.capital))
                            RowLine("Interés", Fmt.money(cuota.interes))
                            RowLine("Total de la cuota", Fmt.money(cuota.valor))
                            if (cuota.estado == "pendiente") {
                                if (vencida) {
                                    PrimaryButton("Pagar cuota desde ahorros") { vm.pagarCuota(id, cuota.numero) { vm.cargarEstudiante() } }
                                } else {
                                    Text("Podrás pagarla desde el ${Fmt.fechaLarga(cuota.fechaVencimiento)}. El interés total del préstamo ya está incluido en las cuotas.", color = Muted, fontSize = 13.sp)
                                }
                            }
                        }
                    }
                }
            }
            Text("Últimos pagos", color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp)
            val pagos = d.pagos[id].orEmpty().sortedByDescending { Fmt.parse(it.fecha) ?: java.time.Instant.EPOCH }
            AppCard {
                if (pagos.isEmpty()) Text("Este préstamo aún no tiene pagos.", color = Muted)
                pagos.take(2).forEachIndexed { i, pg ->
                    if (i > 0) Divider()
                    ListRow(
                        title = "${pg.pagoId} · ${if (pg.tipoAbono == "capital") "Capital" else "Interés"}",
                        subtitle = Fmt.fechaCorta(pg.fecha),
                        trailing = Fmt.money(pg.valor),
                    )
                }
            }
            SecondaryButton("Ver pagos", color = Muted) { nav.navigate("pagos/$id") }
        }
    }
}

@Composable
fun HistorialPagosScreen(vm: MainViewModel, nav: NavController, id: String) {
    val st by vm.student.collectAsState()
    LaunchedEffect(Unit) { vm.cargarEstudiante() }
    ScreenScaffold("Historial de pagos", "Préstamo $id", onBack = { nav.popBackStack() }) {
        StateContent(st, onRetry = { vm.cargarEstudiante() }) { d ->
            val pagos = d.pagos[id].orEmpty().sortedByDescending { Fmt.parse(it.fecha) ?: java.time.Instant.EPOCH }
            if (pagos.isEmpty()) Text("Este préstamo aún no tiene pagos.", color = Muted)
            pagos.forEach { pg ->
                val cuota = pg.tipoAbono == "cuota"
                val cap = pg.tipoAbono == "capital"
                AppCard {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text(pg.pagoId, color = Ink, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        StatusChip(if (cuota) "Cuota ${pg.cuotaNumero}" else if (cap) "Capital" else "Interés", if (cuota || cap) ChipKind.GREEN else ChipKind.ORANGE)
                    }
                    Row(Modifier.fillMaxWidth().padding(top = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(Fmt.money(pg.valor), color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 22.sp)
                        Text(Fmt.fechaLarga(pg.fecha), color = Muted, fontSize = 14.sp)
                    }
                    Text(if (cuota) "Pago de cuota desde ahorros" else if (cap) "Abono a capital" else "Pago de intereses", color = Muted, fontSize = 13.sp)
                }
            }
        }
    }
}

@Composable
fun InteresesScreen(vm: MainViewModel, nav: NavController) {
    val st by vm.student.collectAsState()
    LaunchedEffect(Unit) { vm.cargarEstudiante() }
    ScreenScaffold(
        title = "Intereses",
        headerExtra = {
            if (st is UiState.Success) {
                Spacer(Modifier.height(10.dp))
                Text("Total pendiente", color = Color.White.copy(alpha = 0.8f), fontSize = 14.sp)
                Text(Fmt.money((st as UiState.Success<StudentData>).data.prestamos.totalInteresPendiente), color = Color.White, fontSize = 40.sp, fontWeight = FontWeight.ExtraBold)
            }
        },
        onBack = { nav.popBackStack() },
    ) {
        StateContent(st, onRetry = { vm.cargarEstudiante() }) { d ->
            val activo = d.prestamoActivo()
            AppCard {
                RowLine("Capital pendiente", Fmt.money(d.prestamos.totalCapitalPendiente))
                Divider()
                RowLine("Tasa aplicada", "5%")
                Divider()
                RowLine("Interés pendiente", Fmt.money(d.prestamos.totalInteresPendiente))
                Divider()
                RowLine("Periodo", Fmt.periodoTexto())
            }
            AppCard {
                Text("Interés fijo del préstamo", color = Muted, fontSize = 14.sp)
                Text(Fmt.money(d.prestamos.totalInteresPendiente), modifier = Modifier.padding(top = 6.dp), fontWeight = FontWeight.ExtraBold, fontSize = 24.sp, color = Teal)
                Text("Este valor ya está incluido en las cuotas pendientes; no se vuelve a calcular cada mes.", color = Muted, fontSize = 13.sp)
            }
            WarningBox("El 5% se calcula una sola vez sobre el capital inicial y ya está incluido en el total del plan de cuotas.")
            if (activo != null) PrimaryButton("Ver plan de cuotas") { nav.navigate("prestamo/${activo.prestamoId}") }
        }
    }
}

@Composable
fun SolicitarPrestamoScreen(vm: MainViewModel, nav: NavController, productoId:String?=null) {
    val st by vm.student.collectAsState()
    val busy by vm.busy.collectAsState()
    val error by vm.formError.collectAsState()
    LaunchedEffect(Unit) { vm.limpiarError(); vm.cargarEstudiante() }
    var monto by remember { mutableStateOf("") }
    var finIndex by remember { mutableStateOf(-1) }
    var descripcion by remember { mutableStateOf("") }
    var plazo by remember { mutableStateOf(1) }
    var fechaEst by remember { mutableStateOf("") }
    val fines = (st as? UiState.Success)?.data?.fines.orEmpty()
    val producto = (st as? UiState.Success)?.data?.productos?.firstOrNull { it.productoId==productoId }
    val interes = Math.round(montoDe(monto) * 0.05 * 100) / 100.0

    ScreenScaffold("Solicitar préstamo", "Préstamo educativo · 5% de interés", onBack = { nav.popBackStack() }) {
        if(producto!=null) AppCard { Text("Financiación para ${producto.nombre}",color=Ink,fontWeight=FontWeight.Bold); RowLine("Monto fijo",Fmt.money(producto.precio)) }
        else {
            MoneyField("Monto solicitado", monto, { monto = it })
            DropdownField("Propósito educativo", fines.getOrNull(finIndex)?.nombre.orEmpty(), fines.map { it.nombre }, { finIndex = it })
        }
        DropdownField("Plazo del préstamo", "$plazo ${if(plazo==1)"mes" else "meses"}", listOf("1 mes","2 meses","3 meses"), { plazo=it+1 })
        DatePickerField("Fecha de primera cuota",fechaEst,{fechaEst=it})
        InfoBox {
            val capital=producto?.precio?:montoDe(monto); val interesCapital=Math.round(capital*0.05*100)/100.0
            RowLine("Monto solicitado", Fmt.money(capital))
            RowLine("Interés calculado (5%)", Fmt.money(interesCapital))
            RowLine("Total estimado", Fmt.money(capital+interesCapital), Ink)
        }
        WarningBox("El saldo de ahorros no cambiará hasta que un funcionario apruebe la solicitud.")
        ErrorText(error)
        PrimaryButton("Enviar solicitud", enabled = (producto!=null || (montoDe(monto)>=1000 && finIndex>=0)) && fechaEst.isNotBlank(), loading = busy) {
            vm.solicitarPrestamo(if(producto==null) fines[finIndex].finId else null,producto?.precio?:montoDe(monto),plazo,fechaEst,{nav.popBackStack()},productoId)
        }
    }
}

@Composable
fun TiendaScreen(vm:MainViewModel,nav:NavController) {
    val st by vm.student.collectAsState(); val busy by vm.busy.collectAsState(); val error by vm.formError.collectAsState()
    LaunchedEffect(Unit){vm.cargarEstudiante()}
    ScreenScaffold("Tienda cooperativa","Productos y servicios disponibles",onBack={nav.popBackStack()}) {
        SecondaryButton("Mis compras") { nav.navigate("misCompras") }
        StateContent(st,onRetry={vm.cargarEstudiante()}) { d ->
            AppCard { LabelValue("Saldo disponible",Fmt.money(d.cuenta.saldo)) }
            if(d.productos.isEmpty()) Text("Aún no hay productos publicados.",color=Muted)
            d.productos.forEach { producto -> AppCard {
                Text(producto.nombre,color=Ink,fontSize=20.sp,fontWeight=FontWeight.ExtraBold)
                Text(producto.categoria,color=Teal,fontWeight=FontWeight.Bold)
                if(producto.descripcion.isNotBlank()) Text(producto.descripcion,color=Muted)
                RowLine("Precio",Fmt.money(producto.precio))
                producto.fechaFin?.let { RowLine("Disponible hasta",Fmt.fechaLarga("${it}T12:00:00Z")) }
                ErrorText(error)
                if(producto.productoId in d.comprasRealizadas) StatusChip("Ya comprado",ChipKind.GREEN)
                else {
                    PrimaryButton("Comprar con ahorros",enabled=d.cuenta.saldo>=producto.precio,loading=busy){vm.comprar(producto){}}
                    SecondaryButton("Solicitar préstamo para este producto"){nav.navigate("solicitarProducto/${producto.productoId}")}
                }
                if(d.cuenta.saldo<producto.precio) Text("Saldo insuficiente. Puedes solicitar un préstamo; la compra se hará después de que lo aprueben y desembolsen.",color=Muted)
            } }
        }
    }
}

@Composable
fun MisComprasScreen(vm:MainViewModel,nav:NavController) {
    val st by vm.student.collectAsState()
    LaunchedEffect(Unit){vm.cargarEstudiante()}
    ScreenScaffold("Mis compras","Historial de productos adquiridos",onBack={nav.popBackStack()}) {
        StateContent(st,onRetry={vm.cargarEstudiante()}) { d ->
            if(d.compras.isEmpty()) AppCard { Text("Aún no tienes compras registradas.",color=Muted) }
            d.compras.sortedByDescending { it.fecha.orEmpty() }.forEach { compra -> AppCard {
                Text(compra.nombreProducto,color=Ink,fontWeight=FontWeight.ExtraBold,fontSize=18.sp)
                RowLine("Fecha",Fmt.fechaLarga(compra.fecha))
                RowLine("Valor",Fmt.money(compra.valor))
                StatusChip(if(compra.estado=="pagada")"Pagada" else compra.estado.replaceFirstChar{it.uppercase()},if(compra.estado=="pagada")ChipKind.GREEN else ChipKind.GREY)
            } }
        }
    }
}

@Composable
fun TransferirScreen(vm:MainViewModel,nav:NavController) {
    val st by vm.student.collectAsState(); val busy by vm.busy.collectAsState(); val error by vm.formError.collectAsState()
    var destino by remember { mutableStateOf("") }; var monto by remember { mutableStateOf("") }
    LaunchedEffect(Unit){vm.cargarEstudiante()}
    ScreenScaffold("Transferir","Envía dinero a otro estudiante",onBack={nav.popBackStack()}) {
        StateContent(st,onRetry={vm.cargarEstudiante()}) { d ->
            AppCard { LabelValue("Saldo",Fmt.money(d.cuenta.saldo)) }
            AppTextField("Código del destinatario",destino,{destino=it.uppercase()},placeholder="U001")
            MoneyField("Valor (mínimo $1.000)",monto,{monto=it})
            WarningBox("Máximo por transferencia: $5.000.000. La operación se registra en las cuentas de origen y destino.")
            ErrorText(error)
            PrimaryButton("Confirmar transferencia",enabled=montoDe(monto)>=1000 && montoDe(monto)<=5000000 && montoDe(monto)<=d.cuenta.saldo && destino.matches(Regex("U\\d{3,}")),loading=busy){vm.transferir(destino,montoDe(monto)){nav.popBackStack()}}
        }
    }
}

@Composable
fun GestionCatalogoScreen(vm:MainViewModel,nav:NavController) {
    val st by vm.admin.collectAsState(); val busy by vm.busy.collectAsState(); val error by vm.formError.collectAsState()
    var nombre by remember { mutableStateOf("") }; var categoria by remember { mutableStateOf("") }; var descripcion by remember { mutableStateOf("") }; var precio by remember { mutableStateOf("") }
    var fechaInicio by remember { mutableStateOf("") }; var fechaFin by remember { mutableStateOf("") }
    var productoEditando by remember { mutableStateOf<Producto?>(null) }
    var filtro by remember { mutableStateOf("Todos") }
    LaunchedEffect(Unit){vm.cargarAdmin()}
    ScreenScaffold("Catálogo","Administra artículos, cursos y servicios",onBack={nav.popBackStack()}) {
        AppCard {
            Text(productoEditando?.let { "Editando: ${it.nombre}" } ?: "Nueva publicación",color=Ink,fontSize=18.sp,fontWeight=FontWeight.ExtraBold)
            AppTextField("Nombre",nombre,{nombre=it}); AppTextField("Categoría",categoria,{categoria=it},placeholder="Curso, libro, asesoría…")
            AppTextField("Descripción",descripcion,{descripcion=it},singleLine=false); MoneyField("Precio",precio,{precio=it})
            DatePickerField("Disponible desde (opcional)",fechaInicio,{fechaInicio=it})
            DatePickerField("Fecha límite de permanencia (obligatoria)",fechaFin,{fechaFin=it})
            ErrorText(error)
            PrimaryButton(if(productoEditando==null)"Publicar producto" else "Guardar cambios",enabled=nombre.isNotBlank()&&categoria.isNotBlank()&&montoDe(precio)>=1000&&fechaFin.isNotBlank(),loading=busy){
                val limpiarFormulario={productoEditando=null;nombre="";categoria="";descripcion="";precio="";fechaInicio="";fechaFin=""}
                val editando=productoEditando
                if(editando==null) vm.crearProducto(nombre,categoria,descripcion,montoDe(precio),fechaInicio.ifBlank{null},fechaFin,limpiarFormulario)
                else vm.actualizarProducto(editando.productoId,nombre,categoria,descripcion,montoDe(precio),fechaInicio.ifBlank{null},fechaFin,limpiarFormulario)
            }
            if(productoEditando!=null) SecondaryButton("Cancelar edición") { productoEditando=null;nombre="";categoria="";descripcion="";precio="";fechaInicio="";fechaFin="" }
        }
        DropdownField("Estado",filtro,listOf("Todos","Vigentes","Vencidos","Cerrados"),{filtro=listOf("Todos","Vigentes","Vencidos","Cerrados")[it]})
        StateContent(st,onRetry={vm.cargarAdmin()}) { d ->
            val hoy=Fmt.hoyColombia()
            val lista=d.productos.filter { p ->
                val vencido=p.fechaFin!=null&&p.fechaFin<hoy&&p.estado=="activo"
                val vigente=p.estado=="activo"&&!vencido&&(p.fechaInicio==null||p.fechaInicio<=hoy)
                when(filtro){"Vigentes"->vigente;"Vencidos"->vencido;"Cerrados"->p.estado=="inactivo";else->true}
            }
            if(lista.isEmpty()) Text("No hay productos en este estado.",color=Muted)
            lista.forEach { p ->
                val hoyActual=Fmt.hoyColombia(); val vencido=p.fechaFin!=null&&p.fechaFin<hoyActual&&p.estado=="activo"; val dentroPeriodo=(p.fechaInicio==null||p.fechaInicio<=hoyActual)&&(p.fechaFin==null||p.fechaFin>=hoyActual); val vigente=p.estado=="activo"&&dentroPeriodo
                AppCard {
                    Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically){Text(p.nombre,color=Ink,fontWeight=FontWeight.Bold,modifier=Modifier.weight(1f));StatusChip(when{vencido->"Vencido";vigente->"Vigente";p.estado=="inactivo"->"Cerrado";else->"Programado"},when{vigente->ChipKind.GREEN;else->ChipKind.ORANGE})}
                    Text("${p.categoria} · ${Fmt.money(p.precio)}",color=Muted)
                    p.fechaFin?.let{Text("Disponible hasta ${Fmt.fechaLarga("${it}T12:00:00Z")}",color=Muted,fontSize=13.sp)}
                    if(p.estado=="activo"||dentroPeriodo) SecondaryButton(if(p.estado=="activo")"Cerrar publicación" else "Reactivar publicación"){vm.cambiarEstadoProducto(p.productoId,if(p.estado=="activo")"inactivo" else "activo")}
                    else Text("Solo se puede reactivar durante su periodo de disponibilidad.",color=Muted,fontSize=13.sp)
                    SecondaryButton("Editar publicación") {
                        productoEditando=p
                        nombre=p.nombre;categoria=p.categoria;descripcion=p.descripcion;precio=p.precio.toString().removeSuffix(".0")
                        fechaInicio=p.fechaInicio.orEmpty();fechaFin=p.fechaFin.orEmpty()
                    }
                }
            }
        }
    }
}

// =====================================================================
// MOVIMIENTOS
// =====================================================================
@Composable
fun MovimientosScreen(vm: MainViewModel, nav: NavController) {
    val st by vm.student.collectAsState()
    LaunchedEffect(Unit) { vm.cargarEstudiante() }
    var filtro by remember { mutableStateOf<Categoria?>(null) }

    ScreenScaffold("Movimientos", "Todo lo que pasa en tu cooperativa") {
        Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf<Pair<String, Categoria?>>("Todos" to null, "Ahorros" to Categoria.AHORROS, "Préstamos" to Categoria.PRESTAMOS, "Pagos" to Categoria.PAGOS)
                .forEach { (texto, cat) ->
                    val activo = filtro == cat
                    Surface(
                        shape = RoundedCornerShape(50), color = if (activo) Teal else Color.White,
                        modifier = Modifier.clickable { filtro = cat },
                    ) {
                        Text(texto, color = if (activo) Color.White else Teal, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp))
                    }
                }
        }
        StateContent(st, onRetry = { vm.cargarEstudiante() }) { d ->
            val lista = d.historial().filter { filtro == null || it.categoria == filtro }
            AppCard {
                if (lista.isEmpty()) Text("No hay movimientos para mostrar.", color = Muted)
                lista.forEachIndexed { i, m ->
                    if (i > 0) Divider()
                    ListRow(
                        title = m.titulo,
                        subtitle = "${Fmt.fechaCorta(m.fecha)} · ${m.detalle}",
                        trailing = Fmt.signed(m.valor),
                        trailingColor = if (m.valor >= 0) GreenText else RedText,
                        badge = { StatusChip(m.estado) },
                    )
                }
            }
        }
    }
}

// =====================================================================
// PERFIL
// =====================================================================
@Composable
fun PerfilScreen(vm: MainViewModel, onLogout: () -> Unit) {
    val s by vm.session.collectAsState()
    ScreenScaffold("Mi perfil", "Socio ${if (s?.esAdmin == true) "administrador" else "estudiante"}") {
        AppCard {
            RowLine("Nombre completo", s?.nombre.orEmpty())
            Divider()
            RowLine("Documento", s?.documento ?: "—")
            Divider()
            RowLine("Teléfono", s?.telefono ?: "—")
            Divider()
            RowLine("Correo", s?.email.orEmpty())
            Divider()
            RowLine("Tipo de usuario", (s?.rol ?: "").replaceFirstChar { it.uppercase() })
            Divider()
            Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Estado de la cuenta", color = Muted, fontSize = 14.sp)
                StatusChip((s?.estado ?: "activo").replaceFirstChar { it.uppercase() })
            }
        }
        PrimaryButton("Editar información") { vm.avisar("Editar información aún no está disponible en la API.") }
        SecondaryButton("Cambiar contraseña") { vm.avisar("Cambiar contraseña aún no está disponible en la API.") }
        Text(
            "Cerrar sesión", color = RedText, fontWeight = FontWeight.Bold, fontSize = 17.sp,
            modifier = Modifier.fillMaxWidth().clickable { onLogout() }.padding(16.dp),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
        )
    }
}
