package com.cooperativa.app.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
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
import com.cooperativa.app.ui.theme.Bg
import com.cooperativa.app.ui.theme.CreamBg
import com.cooperativa.app.ui.theme.CreamText
import com.cooperativa.app.ui.theme.GreenBg
import com.cooperativa.app.ui.theme.GreenText
import com.cooperativa.app.ui.theme.GreyBg
import com.cooperativa.app.ui.theme.Ink
import com.cooperativa.app.ui.theme.Line
import com.cooperativa.app.ui.theme.Muted
import com.cooperativa.app.ui.theme.RedText

/** Estado de una carga: cargando / éxito / error (como pide la propuesta). */
sealed interface UiState<out T> {
    data object Loading : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val message: String) : UiState<Nothing>
}

/** Pantalla base: encabezado redondeado de color + contenido con scroll. */
@Composable
fun ScreenScaffold(
    title: String,
    subtitle: String? = null,
    onBack: (() -> Unit)? = null,
    headerColor: Color? = null,
    headerExtra: @Composable ColumnScope.() -> Unit = {},
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(Modifier.fillMaxSize().background(Bg).imePadding()) {
        Column(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp))
                .background(headerColor ?: MaterialTheme.colorScheme.primary)
                .statusBarsPadding()
                .padding(horizontal = 20.dp, vertical = 20.dp)
        ) {
            if (onBack != null) {
                Box(
                    Modifier.size(40.dp).clip(RoundedCornerShape(14.dp))
                        .background(Color.White.copy(alpha = 0.18f))
                        .clickable { onBack() },
                    contentAlignment = Alignment.Center,
                ) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Volver", tint = Color.White) }
                Spacer(Modifier.height(16.dp))
            } else {
                Spacer(Modifier.height(24.dp))
            }
            Text(title, color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold)
            if (subtitle != null) {
                Spacer(Modifier.height(4.dp))
                Text(subtitle, color = Color.White.copy(alpha = 0.8f), fontSize = 14.sp)
            }
            headerExtra()
        }
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
fun AppCard(modifier: Modifier = Modifier, onClick: (() -> Unit)? = null, content: @Composable ColumnScope.() -> Unit) {
    val base = modifier.fillMaxWidth()
    Surface(
        modifier = if (onClick != null) base.clickable { onClick() } else base,
        shape = RoundedCornerShape(20.dp),
        color = Color.White,
        shadowElevation = 2.dp,
    ) {
        Column(Modifier.padding(16.dp), content = content)
    }
}

@Composable
fun Tinted(color: Color, textColor: Color, text: String) {
    Surface(shape = RoundedCornerShape(18.dp), color = color, modifier = Modifier.fillMaxWidth()) {
        Text(text, color = textColor, modifier = Modifier.padding(16.dp), fontSize = 14.sp)
    }
}

@Composable
fun WarningBox(text: String) = Tinted(CreamBg, CreamText, text)

@Composable
fun InfoBox(content: @Composable ColumnScope.() -> Unit) {
    Surface(shape = RoundedCornerShape(18.dp), color = GreenBg, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp), content = content)
    }
}

enum class ChipKind { GREEN, ORANGE, GREY }

@Composable
fun StatusChip(text: String, kind: ChipKind = ChipKind.GREEN) {
    val (bg, fg) = when (kind) {
        ChipKind.GREEN -> GreenBg to GreenText
        ChipKind.ORANGE -> CreamBg to CreamText
        ChipKind.GREY -> GreyBg to Muted
    }
    Surface(shape = RoundedCornerShape(50), color = bg) {
        Text(text, color = fg, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp))
    }
}

@Composable
fun LabelValue(label: String, value: String, modifier: Modifier = Modifier, valueColor: Color = Ink) {
    Column(modifier) {
        Text(label, color = Muted, fontSize = 13.sp)
        Text(value, color = valueColor, fontSize = 20.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun RowLine(label: String, value: String, valueColor: Color = Ink) {
    Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(label, color = Muted, fontSize = 14.sp)
        Text(value, color = valueColor, fontSize = 16.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun PrimaryButton(text: String, enabled: Boolean = true, loading: Boolean = false, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = Modifier.fillMaxWidth().height(54.dp),
        shape = RoundedCornerShape(18.dp),
        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary, contentColor = MaterialTheme.colorScheme.onPrimary, disabledContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f), disabledContentColor = MaterialTheme.colorScheme.onPrimary),
    ) {
        if (loading) CircularProgressIndicator(Modifier.size(22.dp), color = Ink, strokeWidth = 2.5.dp)
        else Text(text, fontWeight = FontWeight.Bold, fontSize = 16.sp)
    }
}

@Composable
fun SecondaryButton(text: String, color: Color = MaterialTheme.colorScheme.primary, onClick: () -> Unit) {
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(54.dp),
        shape = RoundedCornerShape(18.dp),
        border = BorderStroke(2.dp, color),
        colors = ButtonDefaults.outlinedButtonColors(containerColor = Color.White, contentColor = color),
    ) { Text(text, fontWeight = FontWeight.Bold, fontSize = 16.sp) }
}

@Composable
private fun fieldColors() = OutlinedTextFieldDefaults.colors(
    focusedContainerColor = Color.White,
    unfocusedContainerColor = Color.White,
    focusedBorderColor = MaterialTheme.colorScheme.primary,
    unfocusedBorderColor = Line,
    focusedTextColor = Color.Black,
    unfocusedTextColor = Color.Black,
)

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
) {
    val prefixContent: (@Composable () -> Unit)? =
        if (prefix != null) ({ Text(prefix, fontWeight = FontWeight.Bold) }) else null
    val placeholderContent: (@Composable () -> Unit)? =
        if (placeholder != null) ({ Text(placeholder, color = Muted) }) else null
    Column(modifier) {
        Text(label, color = Ink, fontWeight = FontWeight.Bold, fontSize = 14.sp)
        Spacer(Modifier.height(6.dp))
        OutlinedTextField(
            value = value,
            onValueChange = onChange,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            singleLine = singleLine,
            colors = fieldColors(),
            keyboardOptions = KeyboardOptions(keyboardType = if (password) KeyboardType.Password else keyboard),
            visualTransformation = if (password) PasswordVisualTransformation() else VisualTransformation.None,
            prefix = prefixContent,
            placeholder = placeholderContent,
        )
    }
}

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
        Text(label, color = Ink, fontWeight = FontWeight.Bold, fontSize = 14.sp)
        Spacer(Modifier.height(6.dp))
        Box {
            Surface(
                modifier = Modifier.fillMaxWidth().height(56.dp).clickable { abierto = true },
                shape = RoundedCornerShape(16.dp), color = Color.White, border = BorderStroke(1.dp, Line),
            ) {
                Row(Modifier.padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(selected.ifBlank { "Seleccionar" }, color = if (selected.isBlank()) Muted else Color.Black, fontSize = 16.sp)
                    Text("▾", color = Muted)
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
        Text(label,color=Ink,fontWeight=FontWeight.Bold,fontSize=14.sp); Spacer(Modifier.height(6.dp))
        OutlinedButton(onClick={ DatePickerDialog(context,{_,year,month,day->onSelect("%04d-%02d-%02d".format(year,month+1,day))},calendar.get(Calendar.YEAR),calendar.get(Calendar.MONTH),calendar.get(Calendar.DAY_OF_MONTH)).apply { datePicker.minDate=System.currentTimeMillis()+86400000L }.show() },modifier=Modifier.fillMaxWidth().height(56.dp),shape=RoundedCornerShape(16.dp)) {
            Text(if(isoDate.isBlank()) "Elegir fecha" else isoDate,color=Ink)
        }
    }
}

@Composable
fun ErrorText(message: String?) {
    if (!message.isNullOrBlank()) Tinted(Color(0xFFFBE4E0), RedText, message)
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
    trailingColor: Color = Ink,
    extra: String? = null,
    badge: (@Composable () -> Unit)? = null,
) {
    Row(Modifier.fillMaxWidth().padding(vertical = 10.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Column(Modifier.weight(1f)) {
            Text(title, color = Ink, fontWeight = FontWeight.Bold, fontSize = 17.sp)
            Text(subtitle, color = Muted, fontSize = 13.sp)
            if (extra != null) Text(extra, color = Muted, fontSize = 13.sp)
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(trailing, color = trailingColor, fontWeight = FontWeight.Bold, fontSize = 17.sp)
            if (badge != null) { Spacer(Modifier.height(4.dp)); badge() }
        }
    }
}

@Composable
fun Divider() {
    Box(Modifier.fillMaxWidth().height(1.dp).background(Color(0xFFEDF0EE)))
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
        modifier = modifier.clickable { onClick() },
        shape = RoundedCornerShape(22.dp), color = Color.White, shadowElevation = 3.dp,
    ) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(46.dp).clip(RoundedCornerShape(15.dp)).background(color.copy(alpha = 0.12f)), contentAlignment = Alignment.Center) {
                    Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(24.dp))
                }
                Text("›", color = color, fontSize = 28.sp, fontWeight = FontWeight.Medium)
            }
            Text(text, color = Ink, fontWeight = FontWeight.Bold, fontSize = 15.sp, lineHeight = 19.sp)
        }
    }
}

@Composable
fun BottomBar(items: List<Pair<String, String>>, current: String?, onSelect: (String) -> Unit) {
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
    Surface(color = Color.White, shadowElevation = 8.dp) {
        Row(Modifier.fillMaxWidth().navigationBarsPadding().padding(vertical = 10.dp), horizontalArrangement = Arrangement.SpaceAround) {
            items.forEach { (route, label) ->
                val activo = route == current
                Column(
                    Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .background(if (activo) MaterialTheme.colorScheme.primary.copy(alpha = 0.10f) else Color.Transparent)
                        .clickable { onSelect(route) }
                        .padding(horizontal = 10.dp, vertical = 7.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Icon(icon(route), contentDescription = label, tint = if (activo) MaterialTheme.colorScheme.primary else Muted, modifier = Modifier.size(24.dp))
                    Spacer(Modifier.height(3.dp))
                    Text(label, fontSize = 11.sp, fontWeight = if (activo) FontWeight.Bold else FontWeight.Medium, color = if (activo) MaterialTheme.colorScheme.primary else Muted)
                }
            }
        }
    }
}
