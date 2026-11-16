package com.cooperativa.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

/** Cooperativa Nova: colores de marca y tokens semánticos compartidos por toda la UI. */
val Teal = Color(0xFF007F79)
val NovaTurquoise = Color(0xFF00B8AE)
val NovaBlue = Color(0xFF1263C7)
val NovaViolet = Color(0xFF7744DC)
val Orange = Color(0xFFFF914D)
val StaffBlue = NovaBlue
val RectorPurple = NovaViolet
val Ink = Color(0xFF17302D)
val Bg = Color(0xFFF6F8FC)
val Muted = Color(0xFF596B70)
val Line = Color(0xFFE1E8EF)
val GreenText = Color(0xFF126B4B)
val GreenBg = Color(0xFFE1F4EC)
val RedText = Color(0xFFAB342B)
val CreamBg = Color(0xFFFFF0D7)
val CreamText = Color(0xFF704600)
val GreyBg = Color(0xFFE9EEF3)

/** Radios, elevación y espacios oficiales para los componentes Nova. */
object NovaTokens {
    const val spaceXs = 4
    const val spaceSm = 8
    const val spaceMd = 16
    const val spaceLg = 24
    const val spaceXl = 32
    const val touchTarget = 48
}

private val NovaTypography = Typography(
    headlineLarge = TextStyle(fontWeight = FontWeight.ExtraBold, fontSize = 32.sp, lineHeight = 38.sp),
    headlineMedium = TextStyle(fontWeight = FontWeight.Bold, fontSize = 26.sp, lineHeight = 32.sp),
    titleLarge = TextStyle(fontWeight = FontWeight.Bold, fontSize = 20.sp, lineHeight = 26.sp),
    titleMedium = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 16.sp, lineHeight = 22.sp),
    bodyLarge = TextStyle(fontWeight = FontWeight.Normal, fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontWeight = FontWeight.Normal, fontSize = 14.sp, lineHeight = 21.sp),
    labelLarge = TextStyle(fontWeight = FontWeight.Bold, fontSize = 14.sp, lineHeight = 20.sp),
)

private val StudentLight = lightColorScheme(
    primary = Teal, onPrimary = Color.White, primaryContainer = Color(0xFFD7F4F1), onPrimaryContainer = Ink,
    secondary = Orange, onSecondary = Ink, tertiary = Color(0xFFB84F08), onTertiary = Color.White,
    tertiaryContainer = CreamBg, onTertiaryContainer = CreamText,
    background = Bg, onBackground = Ink, surface = Color.White, onSurface = Ink,
    surfaceVariant = Color(0xFFEAF1F4), onSurfaceVariant = Muted,
    outline = Line, error = RedText, onError = Color.White,
)
private val StaffLight = StudentLight.copy(primary = StaffBlue, onPrimary = Color.White, secondary = Color(0xFF4C91C9))
private val RectorLight = StudentLight.copy(primary = RectorPurple, onPrimary = Color.White, secondary = Orange)
private val StudentDark = darkColorScheme(
    primary = Color(0xFF5AD8CF), onPrimary = Color(0xFF003733), primaryContainer = Color(0xFF075B56), onPrimaryContainer = Color(0xFFB7FFF7),
    secondary = Color(0xFFFFB77F), onSecondary = Color(0xFF482300), tertiary = Color(0xFFFFB77F), onTertiary = Color(0xFF482300),
    tertiaryContainer = Color(0xFF5E3109), onTertiaryContainer = Color(0xFFFFDCC2),
    background = Color(0xFF10191D), onBackground = Color(0xFFE3F0F0), surface = Color(0xFF172328), onSurface = Color(0xFFE3F0F0),
    surfaceVariant = Color(0xFF26363B), onSurfaceVariant = Color(0xFFB6C9CC), outline = Color(0xFF52666A), error = Color(0xFFFFB4AB), onError = Color(0xFF690005),
)

@Composable
fun CooperativaTheme(role: String? = null, darkTheme: Boolean = false, content: @Composable () -> Unit) {
    val light = when (role) {
        "funcionario" -> StaffLight
        "rector" -> RectorLight
        else -> StudentLight
    }
    val dark = when (role) {
        "funcionario" -> StudentDark.copy(primary = Color(0xFF8DB7FF), onPrimary = Color(0xFF002E68))
        "rector" -> StudentDark.copy(primary = Color(0xFFC5A8FF), onPrimary = Color(0xFF32146F))
        else -> StudentDark
    }
    MaterialTheme(colorScheme = if (darkTheme) dark else light, typography = NovaTypography, content = content)
}

/** Colores de estado con contraste legible tanto en tema claro como oscuro. */
@Composable
fun novaSuccessColor(): Color = if (MaterialTheme.colorScheme.surface.luminance() < 0.45f) Color(0xFF72D8A1) else GreenText
