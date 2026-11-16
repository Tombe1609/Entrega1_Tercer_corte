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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import com.cooperativa.app.ui.theme.Orange
import androidx.compose.material3.MaterialTheme

@Composable
fun LoginScreen(vm: MainViewModel, onLogged: (Session) -> Unit) {
    val busy by vm.busy.collectAsState()
    val error by vm.formError.collectAsState()
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var registrar by remember { mutableStateOf(false) }
    var nombre by remember { mutableStateOf("") }
    var documento by remember { mutableStateOf("") }
    var telefono by remember { mutableStateOf("") }
    LaunchedEffect(Unit) { vm.limpiarError() }

    Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        // círculos decorativos del diseño
        Box(Modifier.align(Alignment.TopEnd).size(180.dp).background(MaterialTheme.colorScheme.primary.copy(alpha = 0.08f), CircleShape))
        Box(Modifier.align(Alignment.TopStart).size(80.dp).background(Orange.copy(alpha = 0.14f), CircleShape))

        Column(
            Modifier.fillMaxSize().statusBarsPadding().imePadding().verticalScroll(rememberScrollState()).padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.Top,
        ) {
            Spacer(Modifier.height(36.dp))
            Box(Modifier.size(72.dp).clip(RoundedCornerShape(24.dp)).background(Color.White), contentAlignment = Alignment.Center) {
                Box(Modifier.size(width = 42.dp, height = 24.dp).clip(RoundedCornerShape(7.dp)).background(MaterialTheme.colorScheme.primary))
            }
            Spacer(Modifier.height(18.dp))
            Text("Cooperativa\nUniversitaria", color = MaterialTheme.colorScheme.onSurface, style = androidx.compose.material3.MaterialTheme.typography.headlineLarge)
            Spacer(Modifier.height(6.dp))
            Text("Ahorra, estudia y crece con tu comunidad", color = MaterialTheme.colorScheme.onSurfaceVariant, style = androidx.compose.material3.MaterialTheme.typography.bodyLarge)
            Spacer(Modifier.height(22.dp))

            AppCard {
                if (registrar) {
                    Text("Solicita tu cuenta", color = MaterialTheme.colorScheme.onSurface, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(12.dp))
                    AppTextField("Nombre completo", nombre, { nombre = it })
                    Spacer(Modifier.height(10.dp))
                    AppTextField("Documento", documento, { documento = it }, keyboard = KeyboardType.Number)
                    Spacer(Modifier.height(10.dp))
                    AppTextField("Teléfono", telefono, { telefono = it }, keyboard = KeyboardType.Phone)
                    Spacer(Modifier.height(10.dp))
                    AppTextField("Correo institucional", email, { email = it }, keyboard = KeyboardType.Email, placeholder = "usuario@uniautonoma.edu.co")
                    Spacer(Modifier.height(10.dp))
                    AppTextField("Contraseña", password, { password = it }, password = true)
                    Spacer(Modifier.height(8.dp))
                    Text("Solo aceptamos correos @uniautonoma.edu.co. Miguel revisará la solicitud antes de activar la cuenta.", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
                    Spacer(Modifier.height(12.dp))
                    ErrorText(error)
                    Spacer(Modifier.height(10.dp))
                    PrimaryButton("Enviar solicitud", loading = busy) { vm.solicitarCuenta(nombre, documento, telefono, email, password) }
                    Text("Volver al inicio de sesión", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).clickable { registrar = false; vm.limpiarError() }.padding(12.dp), textAlign = TextAlign.Center)
                } else {
                    AppTextField("Correo electrónico", email, { email = it }, keyboard = KeyboardType.Email, placeholder = "usuario@uniautonoma.edu.co")
                    Spacer(Modifier.height(14.dp))
                    AppTextField("Contraseña", password, { password = it }, password = true)
                    Spacer(Modifier.height(16.dp))
                    ErrorText(error)
                    if (error != null) Spacer(Modifier.height(12.dp))
                    PrimaryButton("Iniciar sesión", loading = busy) { vm.login(email, password, onLogged) }
                    Spacer(Modifier.height(12.dp))
                    Text("¿Olvidaste tu contraseña?", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold,
                        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).clickable { vm.avisar("Comunícate con la cooperativa para recuperar tu contraseña.") }.padding(12.dp), textAlign = TextAlign.Center)
                    Text("Solicitar una cuenta", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold,
                        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).clickable { registrar = true; vm.limpiarError() }.padding(12.dp), textAlign = TextAlign.Center)
                }
            }
            Spacer(Modifier.height(20.dp))
            Text(
                if (registrar) "La cuenta solo se activa cuando el área de solicitudes aprueba tus datos." else "¿Aún no eres socio? Puedes enviar una solicitud de cuenta.",
                color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 14.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(24.dp))
        }
    }
}
