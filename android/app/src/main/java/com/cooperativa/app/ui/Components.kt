package com.cooperativa.app.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.platform.LocalContext
import android.app.DatePickerDialog
import java.util.Calendar
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.PieChart
import androidx.compose.material.icons.outlined.Remove
import androidx.compose.material.icons.outlined.Savings
import androidx.compose.material.icons.outlined.School
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff

/** Estado de una carga: cargando / éxito / error (como pide la propuesta). */
sealed interface UiState<out T> {
    data object Loading : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val message: String) : UiState<Nothing>
}

/** Encabezado Nova reutilizable. */
@Composable
fun NovaTopBar(
    title: String,
    subtitle: String? = null,
    onBack: (() -> Unit)? = null,
    headerColor: Color = MaterialTheme.colorScheme.primary,
    headerExtra: @Composable ColumnScope.() -> Unit = {},
) {
    Column(
        Modifier.fillMaxWidth()
            .clip(RoundedCornerShape(bottomStart = 30.dp, bottomEnd = 30.dp))
            .background(headerColor)
            .statusBarsPadding()
            .padding(horizontal = 22.dp, vertical = 18.dp)
    ) {
        if (onBack != null) {
            Box(
                Modifier.size(48.dp).clip(RoundedCornerShape(16.dp))
                    .background(Color.White.copy(alpha = 0.18f))
                    .clickable(role = Role.Button, onClickLabel = "Volver", onClick = onBack),
                contentAlignment = Alignment.Center,
        ) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Volver", tint = MaterialTheme.colorScheme.onPrimary) }
            Spacer(Modifier.height(12.dp))
        } else Spacer(Modifier.height(10.dp))
        Text(title, color = MaterialTheme.colorScheme.onPrimary, style = MaterialTheme.typography.headlineMedium)
        if (subtitle != null) {
            Spacer(Modifier.height(4.dp))
            Text(subtitle, color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.9f), style = MaterialTheme.typography.bodyMedium)
        }
        headerExtra()
    }
}

/** Pantalla base: encabezado compacto y contenido con scroll seguro para formularios. */
@Composable
fun ScreenScaffold(
    title: String,
    subtitle: String? = null,
    onBack: (() -> Unit)? = null,
    headerColor: Color? = null,
    headerExtra: @Composable ColumnScope.() -> Unit = {},
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).imePadding()) {
        NovaTopBar(title, subtitle, onBack, headerColor ?: MaterialTheme.colorScheme.primary, headerExtra)
        Column(
            Modifier
                .weight(1f)
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            content()
            Spacer(Modifier.height(24.dp))
            Spacer(Modifier.navigationBarsPadding())
        }
    }
}

@Composable
fun NovaCard(modifier: Modifier = Modifier, onClick: (() -> Unit)? = null, content: @Composable ColumnScope.() -> Unit) {
    val base = modifier.fillMaxWidth()
    Surface(
        modifier = (if (onClick != null) base.clickable(role = Role.Button) { onClick() } else base).animateContentSize(),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.65f)),
        shadowElevation = 1.dp,
    ) {
        Column(Modifier.padding(16.dp), content = content)
    }
}

/** Nombre conservado para no cambiar las llamadas existentes de las pantallas. */
@Composable
fun AppCard(modifier: Modifier = Modifier, onClick: (() -> Unit)? = null, content: @Composable ColumnScope.() -> Unit) =
    NovaCard(modifier, onClick, content)

@Composable
fun Tinted(color: Color, textColor: Color, text: String) {
    Surface(shape = RoundedCornerShape(18.dp), color = color, modifier = Modifier.fillMaxWidth()) {
        Text(text, color = textColor, modifier = Modifier.padding(16.dp), fontSize = 14.sp)
    }
}

@Composable
fun WarningBox(text: String) {
    Surface(shape = RoundedCornerShape(18.dp), color = MaterialTheme.colorScheme.tertiaryContainer, modifier = Modifier.fillMaxWidth()) {
        Text(text, color = MaterialTheme.colorScheme.onTertiaryContainer, modifier = Modifier.padding(16.dp), fontSize = 14.sp)
    }
}

@Composable
fun InfoBox(content: @Composable ColumnScope.() -> Unit) {
    Surface(shape = RoundedCornerShape(18.dp), color = MaterialTheme.colorScheme.primaryContainer, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp), content = content)
    }
}

enum class ChipKind { GREEN, ORANGE, GREY }

@Composable
fun NovaStatusChip(text: String, kind: ChipKind = ChipKind.GREEN) {
    val (bg, fg) = when (kind) {
        ChipKind.GREEN -> MaterialTheme.colorScheme.primaryContainer to MaterialTheme.colorScheme.onPrimaryContainer
        ChipKind.ORANGE -> MaterialTheme.colorScheme.tertiaryContainer to MaterialTheme.colorScheme.onTertiaryContainer
        ChipKind.GREY -> MaterialTheme.colorScheme.surfaceVariant to MaterialTheme.colorScheme.onSurfaceVariant
    }
    Surface(shape = RoundedCornerShape(50), color = bg, modifier = Modifier.semantics { contentDescription = "Estado: $text" }) {
        Text(text, color = fg, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp))
    }
}

@Composable
fun StatusChip(text: String, kind: ChipKind = ChipKind.GREEN) = NovaStatusChip(text, kind)

@Composable
fun LabelValue(label: String, value: String, modifier: Modifier = Modifier, valueColor: Color? = null) {
    Column(modifier) {
        Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
        Text(value, color = valueColor ?: MaterialTheme.colorScheme.onSurface, fontSize = 20.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun RowLine(label: String, value: String, valueColor: Color? = null) {
    Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 14.sp)
        Text(value, color = valueColor ?: MaterialTheme.colorScheme.onSurface, fontSize = 16.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun NovaButton(text: String, enabled: Boolean = true, loading: Boolean = false, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = Modifier.fillMaxWidth().height(56.dp),
        shape = RoundedCornerShape(18.dp),
        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary, contentColor = MaterialTheme.colorScheme.onPrimary, disabledContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f), disabledContentColor = MaterialTheme.colorScheme.onPrimary),
    ) {
        if (loading) CircularProgressIndicator(Modifier.size(22.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.5.dp)
        else Text(text, fontWeight = FontWeight.Bold, fontSize = 16.sp)
    }
}

@Composable
fun PrimaryButton(text: String, enabled: Boolean = true, loading: Boolean = false, onClick: () -> Unit) =
    NovaButton(text, enabled, loading, onClick)

@Composable
fun SecondaryButton(text: String, color: Color = MaterialTheme.colorScheme.primary, onClick: () -> Unit) {
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(56.dp),
        shape = RoundedCornerShape(18.dp),
        border = BorderStroke(2.dp, color),
        colors = ButtonDefaults.outlinedButtonColors(containerColor = MaterialTheme.colorScheme.surface, contentColor = color),
    ) { Text(text, fontWeight = FontWeight.Bold, fontSize = 16.sp) }
}

@Composable
private fun fieldColors() = OutlinedTextFieldDefaults.colors(
    focusedContainerColor = MaterialTheme.colorScheme.surface,
    unfocusedContainerColor = MaterialTheme.colorScheme.surface,
    focusedBorderColor = MaterialTheme.colorScheme.primary,
    unfocusedBorderColor = MaterialTheme.colorScheme.outline,
    focusedTextColor = MaterialTheme.colorScheme.onSurface,
    unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
)

@Composable
fun NovaTextField(
    label: String,
    value: String,
    onChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    keyboard: KeyboardType = KeyboardType.Text,
    password: Boolean = false,
    prefix: String? = null,
    placeholder: String? = null,
    singleLine: Boolean = true,
) {
    var visible by remember { mutableStateOf(false) }
    val alternarVisibilidad: (@Composable () -> Unit)? = if (password) ({
        IconButton(onClick = { visible = !visible }) {
            Icon(
                imageVector = if (visible) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                contentDescription = if (visible) "Ocultar contraseña" else "Mostrar contraseña",
            )
        }
    }) else null
    val prefixContent: (@Composable () -> Unit)? =
        if (prefix != null) ({ Text(prefix, fontWeight = FontWeight.Bold) }) else null
    val placeholderContent: (@Composable () -> Unit)? =
        if (placeholder != null) ({ Text(placeholder, color = MaterialTheme.colorScheme.onSurfaceVariant) }) else null
    Column(modifier) {
        Text(label, color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold, fontSize = 14.sp)
        Spacer(Modifier.height(6.dp))
        OutlinedTextField(
            value = value,
            onValueChange = onChange,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            singleLine = singleLine,
            colors = fieldColors(),
            keyboardOptions = KeyboardOptions(keyboardType = if (password) KeyboardType.Password else keyboard),
            visualTransformation = if (password && !visible) PasswordVisualTransformation() else VisualTransformation.None,
            trailingIcon = alternarVisibilidad,
            prefix = prefixContent,
            placeholder = placeholderContent,
        )
    }
}

@Composable
fun AppTextField(
    label: String,
    value: String,
    onChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    keyboard: KeyboardType = KeyboardType.Text,
    password: Boolean = false,
    prefix: String? = null,
    placeholder: String? = null,
    singleLine: Boolean = true,
) = NovaTextField(label, value, onChange, modifier, keyboard, password, prefix, placeholder, singleLine)

/** Campo de dinero: solo dígitos. Devuelve el texto; usa [montoDe] para convertirlo a número. */
@Composable
fun MoneyField(label: String, value: String, onChange: (String) -> Unit, modifier: Modifier = Modifier) {
    AppTextField(
        label = label, value = value, modifier = modifier,
        onChange = { onChange(it.filter { c -> c.isDigit() }.take(12)) },
        keyboard = KeyboardType.Number, prefix = "$",
    )
}

fun montoDe(texto: String): Double = texto.toDoubleOrNull() ?: 0.0

@Composable
fun DropdownField(label: String, selected: String, options: List<String>, onSelect: (Int) -> Unit, modifier: Modifier = Modifier) {
    var abierto by remember { mutableStateOf(false) }
    Column(modifier) {
        Text(label, color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold, fontSize = 14.sp)
        Spacer(Modifier.height(6.dp))
        Box {
            Surface(
                modifier = Modifier.fillMaxWidth().height(56.dp).clickable { abierto = true },
                shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.surface, border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
            ) {
                Row(Modifier.padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(selected.ifBlank { "Seleccionar" }, color = if (selected.isBlank()) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface, fontSize = 16.sp)
                    Text("▾", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            DropdownMenu(expanded = abierto, onDismissRequest = { abierto = false }) {
                options.forEachIndexed { i, o ->
                    DropdownMenuItem(text = { Text(o) }, onClick = { abierto = false; onSelect(i) })
                }
            }
        }
    }
}

@Composable
fun DatePickerField(label:String,isoDate:String,onSelect:(String)->Unit,modifier:Modifier=Modifier) {
    val context= LocalContext.current
    val calendar= remember(isoDate) { Calendar.getInstance().apply { if(isoDate.matches(Regex("\\d{4}-\\d{2}-\\d{2}"))) { set(Calendar.YEAR,isoDate.substring(0,4).toInt());set(Calendar.MONTH,isoDate.substring(5,7).toInt()-1);set(Calendar.DAY_OF_MONTH,isoDate.substring(8,10).toInt()) } } }
    Column(modifier) {
        Text(label,color=MaterialTheme.colorScheme.onSurface,fontWeight=FontWeight.Bold,fontSize=14.sp); Spacer(Modifier.height(6.dp))
        OutlinedButton(onClick={ DatePickerDialog(context,{_,year,month,day->onSelect("%04d-%02d-%02d".format(year,month+1,day))},calendar.get(Calendar.YEAR),calendar.get(Calendar.MONTH),calendar.get(Calendar.DAY_OF_MONTH)).apply { datePicker.minDate=System.currentTimeMillis()+86400000L }.show() },modifier=Modifier.fillMaxWidth().height(56.dp),shape=RoundedCornerShape(16.dp)) {
            Text(if(isoDate.isBlank()) "Elegir fecha" else isoDate,color=MaterialTheme.colorScheme.onSurface)
        }
    }
}

@Composable
fun ErrorText(message: String?) {
    if (!message.isNullOrBlank()) Tinted(MaterialTheme.colorScheme.errorContainer, MaterialTheme.colorScheme.onErrorContainer, message)
}

@Composable
fun LoadingBox() {
    Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = MaterialTheme.colorScheme.primary) }
}

@Composable
fun ErrorBox(message: String, onRetry: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        ErrorText(message)
        SecondaryButton("Reintentar", onClick = onRetry)
    }
}

/** Muestra Loading / Error / contenido según el estado. */
@Composable
fun <T> StateContent(state: UiState<T>, onRetry: () -> Unit, content: @Composable ColumnScope.(T) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        when (state) {
            is UiState.Loading -> LoadingBox()
            is UiState.Error -> ErrorBox(state.message, onRetry)
            is UiState.Success -> content(state.data)
        }
    }
}

/** Fila de lista tipo "Depósito · fecha ........ +$200.000". */
@Composable
fun ListRow(
    title: String,
    subtitle: String,
    trailing: String,
    trailingColor: Color? = null,
    extra: String? = null,
    badge: (@Composable () -> Unit)? = null,
) {
    Row(Modifier.fillMaxWidth().padding(vertical = 10.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Column(Modifier.weight(1f)) {
            Text(title, color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold, fontSize = 17.sp)
            Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
            if (extra != null) Text(extra, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(trailing, color = trailingColor ?: MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold, fontSize = 17.sp)
            if (badge != null) { Spacer(Modifier.height(4.dp)); badge() }
        }
    }
}

@Composable
fun Divider() {
    Box(Modifier.fillMaxWidth().height(1.dp).background(MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.65f)))
}

/** Mosaico de acceso rápido con iconografía consistente. */
@Composable
fun Tile(text: String, color: Color, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val titulo = text.lowercase()
    val icon = when {
        "deposit" in titulo || "depósito" in titulo -> Icons.Outlined.Add
        "retiro" in titulo -> Icons.Outlined.Remove
        "préstamo" in titulo || "prestamo" in titulo || "cartera" in titulo -> Icons.Outlined.AccountBalanceWallet
        "pago" in titulo -> Icons.Outlined.Payments
        "cuenta de acceso" in titulo -> Icons.Outlined.Groups
        "ahorro" in titulo || "cuentas" in titulo -> Icons.Outlined.Savings
        "movimiento" in titulo || "historial" in titulo -> Icons.Outlined.History
        "persona" in titulo || "usuario" in titulo || "funcionario" in titulo -> Icons.Outlined.Groups
        "perfil" in titulo -> Icons.Outlined.Person
        "interés" in titulo || "interes" in titulo || "distribución" in titulo -> Icons.Outlined.PieChart
        "finalidad" in titulo || "fines educativos" in titulo -> Icons.Outlined.School
        else -> Icons.Outlined.Dashboard
    }
        Surface(
        modifier = modifier.clickable(role = Role.Button, onClickLabel = "Abrir $text", onClick = onClick).animateContentSize(),
        shape = RoundedCornerShape(22.dp), color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)), shadowElevation = 1.dp,
    ) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(46.dp).clip(RoundedCornerShape(15.dp)).background(color.copy(alpha = 0.12f)), contentAlignment = Alignment.Center) {
                    Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(24.dp))
                }
                Text("›", color = color, fontSize = 28.sp, fontWeight = FontWeight.Medium)
            }
            Text(text, color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold, fontSize = 15.sp, lineHeight = 19.sp)
        }
    }
}

@Composable
fun NovaBottomBar(items: List<Pair<String, String>>, current: String?, onSelect: (String) -> Unit) {
    fun icon(route: String) = when (route) {
        "inicio", "admin" -> Icons.Outlined.Home
        "ahorros", "a_ahorros" -> Icons.Outlined.Savings
        "prestamos", "a_prestamos" -> Icons.Outlined.AccountBalanceWallet
        "movimientos", "a_movimientos" -> Icons.Outlined.History
        "perfil" -> Icons.Outlined.Person
        "a_usuarios", "a_funcionarios", "a_cuentas_acceso" -> Icons.Outlined.Groups
        "a_distribuir" -> Icons.Outlined.PieChart
        else -> Icons.Outlined.Dashboard
    }
    Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 8.dp) {
        Row(Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal = 6.dp, vertical = 6.dp), horizontalArrangement = Arrangement.SpaceAround) {
            items.forEach { (route, label) ->
                val activo = route == current
                Column(
                    Modifier.heightIn(min = 48.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(if (activo) MaterialTheme.colorScheme.primary.copy(alpha = 0.10f) else Color.Transparent)
                        .clickable(role = Role.Tab, onClickLabel = label, onClick = { onSelect(route) })
                        .padding(horizontal = 10.dp, vertical = 7.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Icon(icon(route), contentDescription = label, tint = if (activo) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(24.dp))
                    Spacer(Modifier.height(3.dp))
                    Text(label, fontSize = 11.sp, fontWeight = if (activo) FontWeight.Bold else FontWeight.Medium, color = if (activo) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}

@Composable
fun BottomBar(items: List<Pair<String, String>>, current: String?, onSelect: (String) -> Unit) =
    NovaBottomBar(items, current, onSelect)

/** Tarjeta de saldo para enfatizar datos reales recibidos por estado; nunca crea importes locales. */
@Composable
fun NovaBalanceCard(title: String, amount: String, supporting: String? = null, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier.fillMaxWidth(), shape = RoundedCornerShape(26.dp),
        color = MaterialTheme.colorScheme.primary, contentColor = MaterialTheme.colorScheme.onPrimary,
    ) {
        Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(title, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.88f))
            Text(amount, style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.ExtraBold)
            if (!supporting.isNullOrBlank()) Text(supporting, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.82f))
        }
    }
}

@Composable
fun NovaEmptyState(title: String, message: String, modifier: Modifier = Modifier) {
    Surface(modifier.fillMaxWidth(), shape = RoundedCornerShape(22.dp), color = MaterialTheme.colorScheme.surfaceVariant) {
        Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
            Text(message, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun NovaLoadingState(label: String = "Cargando información") {
    Column(Modifier.fillMaxWidth().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
        Text(label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
fun NovaDialog(onDismiss: () -> Unit, title: String, content: @Composable ColumnScope.() -> Unit, actions: @Composable RowScope.() -> Unit) {
    androidx.compose.material3.AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title, style = MaterialTheme.typography.titleLarge) },
        text = { Column(verticalArrangement = Arrangement.spacedBy(8.dp), content = content) },
        confirmButton = { Row(content = actions) },
        shape = RoundedCornerShape(26.dp),
    )
}
