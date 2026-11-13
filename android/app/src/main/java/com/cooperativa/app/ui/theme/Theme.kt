package com.cooperativa.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val Teal = Color(0xFF0B7285)
val Orange = Color(0xFFF4A541)
val StaffBlue = Color(0xFF2856A6)
val RectorPurple = Color(0xFF6042A6)
val Ink = Color(0xFF17302D)
val Bg = Color(0xFFF4F4F0)
val Muted = Color(0xFF5B6B68)
val Line = Color(0xFFDCE3E1)
val GreenText = Color(0xFF1B6B4A)
val GreenBg = Color(0xFFE0EFEA)
val RedText = Color(0xFFA33327)
val CreamBg = Color(0xFFFDEACB)
val CreamText = Color(0xFF6B4208)
val GreyBg = Color(0xFFE6EAE8)

@Composable
fun CooperativaTheme(role: String? = null, content: @Composable () -> Unit) {
    val colors = when (role) {
        "funcionario" -> lightColorScheme(
            primary = StaffBlue, onPrimary = Color.White, secondary = Color(0xFF4C91C9),
            background = Bg, surface = Color.White, onSurface = Ink,
        )
        "rector" -> lightColorScheme(
            primary = RectorPurple, onPrimary = Color.White, secondary = Color(0xFFC2932F),
            background = Bg, surface = Color.White, onSurface = Ink,
        )
        else -> lightColorScheme(
            primary = Teal, onPrimary = Color.White, secondary = Orange,
            background = Bg, surface = Color.White, onSurface = Ink,
        )
    }
    MaterialTheme(colorScheme = colors, content = content)
}
