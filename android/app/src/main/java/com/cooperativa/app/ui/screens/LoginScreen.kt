package com.cooperativa.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cooperativa.app.data.Session
import com.cooperativa.app.ui.AppCard
import com.cooperativa.app.ui.AppTextField
import com.cooperativa.app.ui.ErrorText
import com.cooperativa.app.ui.MainViewModel
import com.cooperativa.app.ui.PrimaryButton
import com.cooperativa.app.ui.theme.Bg
import com.cooperativa.app.ui.theme.Ink
import com.cooperativa.app.ui.theme.Muted
import com.cooperativa.app.ui.theme.Orange
import com.cooperativa.app.ui.theme.Teal

@Composable
fun LoginScreen(vm: MainViewModel, onLogged: (Session) -> Unit) {
    val busy by vm.busy.collectAsState()
    val error by vm.formError.collectAsState()
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var dialogo by remember { mutableStateOf(false) }
    var servidor by remember { mutableStateOf(vm.servidor) }
    LaunchedEffect(Unit) { vm.limpiarError() }

    Box(Modifier.fillMaxSize().background(Bg)) {
        // círculos decorativos del diseño
        Box(Modifier.align(Alignment.TopEnd).size(180.dp).background(Teal.copy(alpha = 0.08f), CircleShape))
        Box(Modifier.align(Alignment.TopStart).size(80.dp).background(Orange.copy(alpha = 0.14f), CircleShape))

        Column(
            Modifier.fillMaxSize().statusBarsPadding().imePadding().verticalScroll(rememberScrollState()).padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.Top,
        ) {
            Spacer(Modifier.height(110.dp))
            Box(Modifier.size(84.dp).clip(RoundedCornerShape(24.dp)).background(Color.White), contentAlignment = Alignment.Center) {
                Box(Modifier.size(width = 44.dp, height = 22.dp).background(Teal, RoundedCornerShape(4.dp)))
            }
            Spacer(Modifier.height(24.dp))
            Text("Cooperativa\nUniversitaria", color = Ink, fontSize = 34.sp, fontWeight = FontWeight.ExtraBold, lineHeight = 40.sp)
            Spacer(Modifier.height(8.dp))
            Text("Ahorra, estudia y crece con tu comunidad", color = Muted, fontSize = 15.sp)
            Spacer(Modifier.height(28.dp))

            AppCard {
                AppTextField("Correo electrónico", email, { email = it }, keyboard = KeyboardType.Email, placeholder = "usuario@universidad.edu.co")
                Spacer(Modifier.height(14.dp))
                AppTextField("Contraseña", password, { password = it }, password = true)
                Spacer(Modifier.height(16.dp))
                ErrorText(error)
                if (error != null) Spacer(Modifier.height(12.dp))
                PrimaryButton("Iniciar sesión", loading = busy) { vm.login(email, password, onLogged) }
                Spacer(Modifier.height(12.dp))
                Text(
                    "¿Olvidaste tu contraseña?", color = Teal, fontWeight = FontWeight.Bold,
                    modifier = Modifier.fillMaxWidth().clickable { vm.avisar("Comunícate con la cooperativa para recuperar tu contraseña.") }.padding(8.dp),
                    textAlign = TextAlign.Center,
                )
            }
            Spacer(Modifier.height(20.dp))
            Text(
                "¿Aún no eres socio? Comunícate con un funcionario para crear tu cuenta.",
                color = Muted, fontSize = 14.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            Text(
                "Servidor: ${vm.servidor}  ·  Cambiar", color = Teal, fontSize = 13.sp, fontWeight = FontWeight.Bold,
                modifier = Modifier.fillMaxWidth().clickable { servidor = vm.servidor; dialogo = true }.padding(12.dp),
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(24.dp))
        }
    }

    if (dialogo) {
        AlertDialog(
            onDismissRequest = { dialogo = false },
            title = { Text("Dirección del servidor") },
            text = {
                Column {
                    Text("Emulador: http://10.0.2.2:3000\nCelular real: http://IP-DE-TU-PC:3000", fontSize = 13.sp, color = Muted)
                    Spacer(Modifier.height(10.dp))
                    AppTextField("URL de la API", servidor, { servidor = it }, keyboard = KeyboardType.Uri)
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    if (servidor.isNotBlank()) vm.cambiarServidor(servidor)
                    dialogo = false
                }) { Text("Guardar") }
            },
            dismissButton = { TextButton(onClick = { dialogo = false }) { Text("Cancelar") } },
        )
    }
}
