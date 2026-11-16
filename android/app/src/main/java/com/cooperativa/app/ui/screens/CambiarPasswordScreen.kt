package com.cooperativa.app.ui.screens

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.ui.unit.dp
import com.cooperativa.app.ui.AppCard
import com.cooperativa.app.ui.AppTextField
import com.cooperativa.app.ui.ErrorText
import com.cooperativa.app.ui.MainViewModel
import com.cooperativa.app.ui.PrimaryButton
import com.cooperativa.app.ui.ScreenScaffold

@Composable
fun CambiarPasswordScreen(vm: MainViewModel, onBack: () -> Unit, onChanged: () -> Unit) {
    val busy by vm.busy.collectAsState()
    val error by vm.formError.collectAsState()
    var actual by remember { mutableStateOf("") }
    var nueva by remember { mutableStateOf("") }
    var confirmacion by remember { mutableStateOf("") }
    LaunchedEffect(Unit) { vm.limpiarError() }

    ScreenScaffold(
        title = "Cambiar contraseña",
        subtitle = "Después del cambio, inicia sesión con tu nueva contraseña.",
        onBack = { if (!busy) onBack() },
    ) {
        AppCard {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                AppTextField("Contraseña actual", actual, { actual = it; vm.limpiarError() }, password = true)
                AppTextField("Nueva contraseña (mínimo 8 caracteres)", nueva, { nueva = it; vm.limpiarError() }, password = true)
                AppTextField("Repite la nueva contraseña", confirmacion, { confirmacion = it; vm.limpiarError() }, password = true)
                ErrorText(error)
                PrimaryButton("Guardar contraseña", loading = busy) {
                    vm.cambiarPassword(actual, nueva, confirmacion, onChanged)
                }
            }
        }
    }
}
