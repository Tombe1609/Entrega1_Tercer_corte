package com.cooperativa.app.ui

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.cooperativa.app.data.ApiClient
import com.cooperativa.app.R
import com.cooperativa.app.data.ApiException
import com.cooperativa.app.data.Ahorro
import com.cooperativa.app.data.CalculoDistribucion
import com.cooperativa.app.data.CrearCuentaAccesoRequest
import com.cooperativa.app.data.Estadisticas
import com.cooperativa.app.data.FinEducativo
import com.cooperativa.app.data.Funcionario
import com.cooperativa.app.data.Movimiento
import com.cooperativa.app.data.Pago
import com.cooperativa.app.data.PrestamoResumen
import com.cooperativa.app.data.PrestamosData
import com.cooperativa.app.data.Producto
import com.cooperativa.app.data.Compra
import com.cooperativa.app.data.Repository
import com.cooperativa.app.data.Session
import com.cooperativa.app.data.SolicitudCuenta
import com.cooperativa.app.data.SolicitudCuentaRequest
import com.cooperativa.app.data.EditarSolicitudRequest
import com.cooperativa.app.data.PerfilRequest
import com.cooperativa.app.data.AuditoriaCuenta
import com.cooperativa.app.data.Usuario
import com.google.gson.Gson
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/** Todo lo que necesita el estudiante, cargado de la API. */
data class StudentData(
    val cuenta: Ahorro,
    val movimientos: List<Movimiento>,
    val prestamos: PrestamosData,
    val pagos: Map<String, List<Pago>>,
    val fines: List<FinEducativo>,
    val productos: List<Producto> = emptyList(),
    val comprasRealizadas:Set<String> = emptySet(),
    val compras:List<Compra> = emptyList(),
)

data class PrestamoAdmin(val usuarioId: String, val nombre: String, val prestamo: PrestamoResumen)

/** Todo lo que necesita el panel administrativo. */
data class AdminData(
    val stats: Estadisticas = Estadisticas(),
    val estudiantes: List<Usuario> = emptyList(),
    val funcionarios: List<Funcionario> = emptyList(),
    val cuentas: List<Ahorro> = emptyList(),
    val movimientos: List<Movimiento> = emptyList(),
    val prestamos: List<PrestamoAdmin> = emptyList(),
    val pagos: List<Pago> = emptyList(),
    val fines: List<FinEducativo> = emptyList(),
    val productos: List<Producto> = emptyList(),
) {
    fun nombreDe(usuarioId: String) = estudiantes.firstOrNull { it.usuarioId == usuarioId }?.nombre
        ?: prestamos.firstOrNull { it.usuarioId == usuarioId }?.nombre
        ?: usuarioId
}

/** Fila unificada del historial (ahorros + préstamos + pagos). */
enum class Categoria { AHORROS, PRESTAMOS, PAGOS }

data class Mov(
    val titulo: String,
    val detalle: String,
    val valor: Double,
    val fecha: String?,
    val categoria: Categoria,
    val estado: String,
)

class MainViewModel(app: Application) : AndroidViewModel(app) {
    private val prefs = app.getSharedPreferences("cooperativa", Context.MODE_PRIVATE)
    private val gson = Gson()
    private val client = ApiClient(prefs, app.getString(R.string.api_base_url))
    private val repo = Repository(client)

    // ---------- Sesión ----------
    private val _session = MutableStateFlow(cargarSesion())
    val session: StateFlow<Session?> = _session.asStateFlow()

    private fun cargarSesion(): Session? = try {
        prefs.getString("session", null)
            ?.takeIf { prefs.getString(ApiClient.KEY_SESSION_URL, null) == repo.baseUrl }
            ?.let { gson.fromJson(it, Session::class.java) }
    } catch (e: Exception) {
        null
    }

    private fun guardarSesion(s: Session?) {
        _session.value = s
        prefs.edit().apply {
            if (s == null) {
                remove("session")
                remove("auth_token")
                remove(ApiClient.KEY_SESSION_URL)
            } else {
                putString("session", gson.toJson(s))
                putString("auth_token", s.token)
                putString(ApiClient.KEY_SESSION_URL, repo.baseUrl)
            }
        }.apply()
    }

    val servidor: String get() = repo.baseUrl
    fun cambiarServidor(url: String) {
        check(!_busy.value) { "Espera a que termine el inicio de sesión." }
        repo.cambiarServidor(url)
        logout()
    }

    // ---------- Estado de formularios (cargando / error / éxito) ----------
    private val _busy = MutableStateFlow(false)
    val busy: StateFlow<Boolean> = _busy.asStateFlow()
    private val _formError = MutableStateFlow<String?>(null)
    val formError: StateFlow<String?> = _formError.asStateFlow()
    private val _messages = MutableSharedFlow<String>(extraBufferCapacity = 8)
    val messages: SharedFlow<String> = _messages.asSharedFlow()
    private val _sessionExpired = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val sessionExpired: SharedFlow<Unit> = _sessionExpired.asSharedFlow()

    fun limpiarError() { _formError.value = null }
    fun avisar(texto: String) { _messages.tryEmit(texto) }

    fun cambiarPassword(actual: String, nueva: String, confirmacion: String, alCambiar: () -> Unit) {
        if (_busy.value) return
        _formError.value = when {
            actual.isEmpty() -> "Escribe tu contraseña actual."
            nueva.trim().length < 8 || nueva.length > 128 -> "La nueva contraseña debe tener entre 8 y 128 caracteres."
            nueva == actual -> "Elige una contraseña diferente de la actual."
            nueva != confirmacion -> "Las contraseñas nuevas no coinciden."
            else -> null
        }
        if (_formError.value != null) return
        act("Contraseña actualizada. Inicia sesión con tu nueva contraseña.", onDone = alCambiar) {
            repo.cambiarPassword(actual, nueva)
        }
    }

    private fun expirarSesionSiCorresponde(error: ApiException): Boolean {
        if (error.statusCode != 401 || _session.value == null) return false
        logout()
        _sessionExpired.tryEmit(Unit)
        return true
    }

    private fun act(exito: String, onDone: () -> Unit = {}, block: suspend () -> Unit) {
        viewModelScope.launch {
            _busy.value = true
            _formError.value = null
            try {
                block()
                _messages.tryEmit(exito)
                onDone()
            } catch (e: CancellationException) {
                throw e
            } catch (e: ApiException) {
                if (!expirarSesionSiCorresponde(e)) _formError.value = e.message
            } catch (e: Exception) {
                _formError.value = "Ocurrió un error inesperado: ${e.message}"
            } finally {
                _busy.value = false
            }
        }
    }

    // ---------- Login / logout ----------
    fun login(email: String, password: String, onOk: (Session) -> Unit) {
        if (email.isBlank() || password.isBlank()) {
            _formError.value = "Escribe tu correo y tu contraseña."
            return
        }
        viewModelScope.launch {
            _busy.value = true
            _formError.value = null
            try {
                val s = repo.login(email, password)
                guardarSesion(s)
                _student.value = UiState.Loading
                _admin.value = UiState.Loading
                onOk(s)
            } catch (e: CancellationException) {
                throw e
            } catch (e: ApiException) {
                _formError.value = e.message
            } catch (e: Exception) {
                _formError.value = "Ocurrió un error inesperado: ${e.message}"
            } finally {
                _busy.value = false
            }
        }
    }

    fun solicitarCuenta(nombre: String, documento: String, telefono: String, email: String, password: String) =
        act("Solicitud enviada. Miguel la revisará antes de crear la cuenta.") {
            repo.solicitarCuenta(SolicitudCuentaRequest(nombre.trim(), documento.trim(), telefono.trim(), email.trim(), password))
        }

    fun editarPerfil(nombre: String, telefono: String, email: String, passwordActual: String, onDone: () -> Unit) =
        act("Tus datos personales quedaron actualizados.", onDone) {
            val actual = _session.value ?: throw ApiException("No hay sesión iniciada.")
            val resultado = repo.editarPerfil(PerfilRequest(nombre.trim(), telefono.trim(), email.trim(), passwordActual.takeIf { email.trim() != actual.email }))
            guardarSesion(actual.copy(nombre = resultado.nombre, telefono = resultado.telefono, email = resultado.email))
        }

    private val _solicitudes = MutableStateFlow<UiState<List<SolicitudCuenta>>>(UiState.Loading)
    val solicitudes: StateFlow<UiState<List<SolicitudCuenta>>> = _solicitudes.asStateFlow()
    private val _auditoria = MutableStateFlow<UiState<List<AuditoriaCuenta>>>(UiState.Loading)
    val auditoria: StateFlow<UiState<List<AuditoriaCuenta>>> = _auditoria.asStateFlow()

    fun cargarAuditoria() {
        viewModelScope.launch {
            _auditoria.value = UiState.Loading
            try { _auditoria.value = UiState.Success(repo.auditoriaCuentas()) }
            catch (e: ApiException) { if (!expirarSesionSiCorresponde(e)) _auditoria.value = UiState.Error(e.message ?: "Error") }
            catch (e: Exception) { _auditoria.value = UiState.Error("Ocurrió un error inesperado: ${e.message}") }
        }
    }

    fun cargarSolicitudes() {
        viewModelScope.launch {
            _solicitudes.value = UiState.Loading
            try { _solicitudes.value = UiState.Success(repo.solicitudesCuenta()) }
            catch (e: ApiException) { if (!expirarSesionSiCorresponde(e)) _solicitudes.value = UiState.Error(e.message ?: "Error") }
            catch (e: Exception) { _solicitudes.value = UiState.Error("Ocurrió un error inesperado: ${e.message}") }
        }
    }

    fun decidirSolicitud(id: String, aprobar: Boolean, motivo: String = "", onDone: () -> Unit = {}) =
        act(if (aprobar) "Solicitud aprobada y cuenta creada." else "Solicitud rechazada.", onDone) {
            repo.decidirSolicitud(id, aprobar, motivo)
            _solicitudes.value = UiState.Success(repo.solicitudesCuenta())
        }

    fun editarSolicitud(id: String, nombre: String, documento: String, telefono: String, email: String, onDone: () -> Unit = {}) =
        act("Datos de la solicitud actualizados.", onDone) {
            repo.editarSolicitud(id, EditarSolicitudRequest(nombre.trim(), documento.trim(), telefono.trim(), email.trim()))
            _solicitudes.value = UiState.Success(repo.solicitudesCuenta())
        }

    fun cambiarEstadoEstudiante(usuarioId: String, estado: String, onDone: () -> Unit = {}) =
        act(if (estado == "activo") "Cuenta de estudiante reactivada." else "Cuenta de estudiante desactivada.", onDone) {
            repo.cambiarEstadoEstudiante(usuarioId, estado)
            cargarAdmin()
        }

    fun logout() {
        guardarSesion(null)
        _student.value = UiState.Loading
        _admin.value = UiState.Loading
    }

    fun cerrarCuentaAhorro(ahorroId: String, onDone: () -> Unit = {}) =
        act("Cuenta de ahorro cerrada. Tu sesión se cerrará por seguridad.", onDone) {
            repo.cerrarCuenta(ahorroId)
            logout()
        }

    // ---------- Estudiante ----------
    private val _student = MutableStateFlow<UiState<StudentData>>(UiState.Loading)
    val student: StateFlow<UiState<StudentData>> = _student.asStateFlow()

    private suspend fun fetchStudent(): StudentData {
        val s = _session.value ?: throw ApiException("No hay sesión iniciada.")
        var ahorroId = s.ahorroId
        if (ahorroId == null) {
            // Estudiante nuevo sin cuenta: se le abre una automáticamente.
            ahorroId = repo.crearCuenta(s.id).ahorroId
            guardarSesion(s.copy(ahorroId = ahorroId))
        }
        val id: String = ahorroId
        return coroutineScope {
            val cuenta = async { repo.cuenta(id) }
            val movs = async { repo.movimientos(id) }
            val fines = async { repo.fines() }
            val productos = async { repo.productos() }
            val compras = async { repo.misCompras() }
            val pres = repo.prestamosDe(s.id)
            val pagos = pres.prestamos.map { it.prestamoId to async { repo.pagos(it.prestamoId) } }
            StudentData(
                cuenta = cuenta.await(),
                movimientos = movs.await(),
                prestamos = pres,
                pagos = pagos.associate { it.first to it.second.await() },
                fines = fines.await(),
                productos = productos.await(),
                comprasRealizadas = compras.await().map { it.productoId }.toSet(),
                compras = compras.await(),
            )
        }
    }

    fun cargarEstudiante() {
        viewModelScope.launch {
            if (_student.value !is UiState.Success) _student.value = UiState.Loading
            try {
                _student.value = UiState.Success(fetchStudent())
            } catch (e: CancellationException) {
                throw e
            } catch (e: ApiException) {
                if (!expirarSesionSiCorresponde(e)) _student.value = UiState.Error(e.message ?: "Error")
            } catch (e: Exception) {
                _student.value = UiState.Error("Ocurrió un error inesperado: ${e.message}")
            }
        }
    }

    private fun ahorroActual(): String = _session.value?.ahorroId ?: throw ApiException("La cuenta de ahorro no está disponible.")

    fun depositar(valor: Double, descripcion: String, onDone: () -> Unit) =
        act("Depósito registrado correctamente", onDone) {
            repo.depositar(ahorroActual(), valor, descripcion.ifBlank { "Depósito realizado por el estudiante" })
            _student.value = UiState.Success(fetchStudent())
        }

    fun retirar(valor: Double, motivo: String, saldo: Double, onDone: () -> Unit) {
        if (valor > saldo) {
            _formError.value = "El retiro no puede superar tu saldo disponible (${Fmt.money(saldo)})."
            return
        }
        act("Retiro registrado correctamente", onDone) {
            repo.retirar(ahorroActual(), valor, motivo.ifBlank { "Retiro autorizado" })
            _student.value = UiState.Success(fetchStudent())
        }
    }

    fun solicitarPrestamo(finId: String?, monto: Double, plazoMeses:Int, fechaPrimerPago:String, onDone: () -> Unit,productoId:String?=null) {
        val s = _session.value ?: return
        act("Solicitud enviada. Queda pendiente de aprobación del funcionario.", onDone) {
            repo.solicitarPrestamo(s.id, finId, monto,plazoMeses,fechaPrimerPago,productoId)
            _student.value = UiState.Success(fetchStudent())
        }
    }

    fun transferir(usuarioDestino:String,valor:Double,onDone:()->Unit)=act("Transferencia realizada y saldos actualizados.",onDone){repo.transferir(usuarioDestino,valor);_student.value=UiState.Success(fetchStudent())}
    fun comprar(producto:Producto,onDone:()->Unit)=act("Compra realizada desde tus ahorros.",onDone){repo.comprar(producto.productoId,producto.precio);_student.value=UiState.Success(fetchStudent())}
    fun crearProducto(nombre:String,categoria:String,descripcion:String,precio:Double,fechaInicio:String?,fechaFin:String?,onDone:()->Unit)=act("Producto publicado.",onDone){repo.crearProducto(nombre,categoria,descripcion,precio,fechaInicio,fechaFin);_admin.value=UiState.Success(fetchAdmin())}
    fun actualizarProducto(productoId:String,nombre:String,categoria:String,descripcion:String,precio:Double,fechaInicio:String?,fechaFin:String?,onDone:()->Unit)=act("Publicación actualizada.",onDone){repo.actualizarProducto(productoId,nombre,categoria,descripcion,precio,fechaInicio,fechaFin);_admin.value=UiState.Success(fetchAdmin())}
    fun cambiarEstadoProducto(productoId:String,estado:String)=act(if(estado=="inactivo")"Producto cerrado del catálogo." else "Producto reactivado."){repo.cambiarEstadoProducto(productoId,estado);_admin.value=UiState.Success(fetchAdmin())}
    fun pagarCuota(prestamoId:String,numero:Int,onDone:()->Unit)=act("Cuota pagada desde tus ahorros.",onDone){repo.pagarCuota(prestamoId,numero);_student.value=UiState.Success(fetchStudent())}

    // ---------- Administrador / funcionario / rector ----------
    private val _admin = MutableStateFlow<UiState<AdminData>>(UiState.Loading)
    val admin: StateFlow<UiState<AdminData>> = _admin.asStateFlow()

    private suspend fun fetchAdmin(): AdminData = coroutineScope {
        val sesion = _session.value ?: throw ApiException("No hay sesión iniciada.")
        if (sesion.rol == "funcionario" && sesion.area == "solicitudes") return@coroutineScope AdminData()
        if (sesion.rol == "funcionario" && sesion.area == "creditos") {
            val raw = repo.prestamosAdmin()
            val prestamoAdmin = raw.map { PrestamoAdmin(it.usuarioId, it.nombre, it.prestamo) }
            val pagos = prestamoAdmin.map { async { repo.pagos(it.prestamo.prestamoId) } }.flatMap { it.await() }
            return@coroutineScope AdminData(
                prestamos = prestamoAdmin, pagos = pagos, fines = repo.fines(), productos = repo.productos(),
            )
        }
        if (sesion.rol == "rector") {
            val stats = async { repo.estadisticas() }
            val estudiantes = async { repo.estudiantes() }
            val funcionarios = async { repo.funcionarios() }
            val cuentas = async { repo.cuentas() }
            val fines = async { repo.fines() }
            val productos = async { repo.productos() }
            val est = estudiantes.await()
            val cts = cuentas.await()
            val movs = cts.map { async { repo.movimientos(it.ahorroId) } }
            val pres = est.map { u -> u to async { repo.prestamosDe(u.usuarioId) } }
            val prestamos = pres.flatMap { (u, d) -> d.await().prestamos.map { PrestamoAdmin(u.usuarioId, u.nombre, it) } }
            val pagos = prestamos.map { async { repo.pagos(it.prestamo.prestamoId) } }
            return@coroutineScope AdminData(
                stats = stats.await(), estudiantes = est, funcionarios = funcionarios.await(), cuentas = cts,
                movimientos = movs.flatMap { it.await() }, prestamos = prestamos,
                pagos = pagos.flatMap { it.await() }, fines = fines.await(), productos = productos.await(),
            )
        }
        val stats = async { repo.estadisticas() }
        val estudiantes = async { repo.estudiantes() }
        val cuentas = async { repo.cuentas() }
        val est = estudiantes.await()
        val cts = cuentas.await()
        val movs = cts.map { async { repo.movimientos(it.ahorroId) } }
        val movimientos = movs.flatMap { it.await() }
        AdminData(
            stats = stats.await(),
            estudiantes = est,
            cuentas = cts,
            movimientos = movimientos,
        )
    }

    fun cargarAdmin() {
        viewModelScope.launch {
            if (_admin.value !is UiState.Success) _admin.value = UiState.Loading
            try {
                _admin.value = UiState.Success(fetchAdmin())
            } catch (e: CancellationException) {
                throw e
            } catch (e: ApiException) {
                if (!expirarSesionSiCorresponde(e)) _admin.value = UiState.Error(e.message ?: "Error")
            } catch (e: Exception) {
                _admin.value = UiState.Error("Ocurrió un error inesperado: ${e.message}")
            }
        }
    }

    /** Crea una persona y sus credenciales de acceso desde el módulo exclusivo del rector. */
    fun crearCuentaAcceso(
        tipo: String, nombre: String, documento: String, telefono: String,
        email: String, cargo: String, password: String, area: String? = null, onDone: () -> Unit,
    ) = act("Cuenta de acceso creada correctamente", onDone) {
        val tipoApi = if (tipo == "Estudiante") "estudiante" else "funcionario"
        repo.crearCuentaAcceso(
            CrearCuentaAccesoRequest(
                tipo = tipoApi,
                nombre = nombre.trim(),
                documento = documento.trim().takeIf { tipoApi == "estudiante" },
                telefono = telefono.trim(),
                email = email.trim(),
                cargo = cargo.takeIf { tipoApi == "funcionario" },
                password = password,
                area = area,
            )
        )
        _admin.value = UiState.Success(fetchAdmin())
    }

    fun movimientoAdmin(ahorroId: String, tipo: String, valor: Double, descripcion: String, onDone: () -> Unit) =
        act(if (tipo == "deposito") "Depósito registrado correctamente" else "Retiro registrado correctamente", onDone) {
            if (tipo == "deposito") repo.depositar(ahorroId, valor, descripcion.ifBlank { "Depósito registrado por funcionario" })
            else repo.retirar(ahorroId, valor, descripcion.ifBlank { "Retiro autorizado por funcionario" })
            _admin.value = UiState.Success(fetchAdmin())
        }

    fun aprobarPrestamo(prestamoId: String, onDone: () -> Unit) =
        act("Préstamo aprobado y desembolsado; el saldo de ahorro fue actualizado.", onDone) {
            repo.aprobarPrestamo(prestamoId)
            _admin.value = UiState.Success(fetchAdmin())
        }

    fun rechazarPrestamo(prestamoId: String, motivo: String, onDone: () -> Unit) =
        act("Solicitud de préstamo rechazada.", onDone) {
            if (motivo.isBlank() || motivo.length > 250) throw ApiException("Escribe un motivo de rechazo de hasta 250 caracteres.")
            repo.rechazarPrestamo(prestamoId, motivo.trim())
            _admin.value = UiState.Success(fetchAdmin())
        }

    // ---------- Distribución de intereses ----------
    private val _calculo = MutableStateFlow<UiState<CalculoDistribucion>>(UiState.Loading)
    val calculo: StateFlow<UiState<CalculoDistribucion>> = _calculo.asStateFlow()

    fun calcularDistribucion(intereses: Double) {
        viewModelScope.launch {
            _calculo.value = UiState.Loading
            try {
                _calculo.value = UiState.Success(repo.calcularDistribucion(intereses))
            } catch (e: CancellationException) {
                throw e
            } catch (e: ApiException) {
                if (!expirarSesionSiCorresponde(e)) _calculo.value = UiState.Error(e.message ?: "Error")
            } catch (e: Exception) {
                _calculo.value = UiState.Error("Ocurrió un error inesperado: ${e.message}")
            }
        }
    }

    fun confirmarDistribucion(periodo: String, intereses: Double, onDone: () -> Unit) =
        act("Distribución del periodo $periodo registrada", onDone) {
            repo.registrarDistribucion(periodo, intereses)
        }
}

/** Historial unificado del estudiante, del más reciente al más antiguo. */
private val descripcionCuota = Regex("Pago cuota (\\d+) pr[eé]stamo (\\S+)", RegexOption.IGNORE_CASE)

fun StudentData.historial(): List<Mov> {
    val lista = mutableListOf<Mov>()
    val pagosHistorial = pagos.values.flatten()
    val sinVincular = pagosHistorial.toMutableList()
    movimientos.forEach { movimiento ->
        val detalle = movimiento.descripcion.orEmpty()
        val dep = movimiento.tipo == "deposito"
        val desembolso = dep && detalle.startsWith("Desembolso del préstamo")
        val cuotaAntigua = if (!dep) descripcionCuota.matchEntire(detalle.trim()) else null
        val vinculacion = when {
            dep -> null
            !movimiento.pagoId.isNullOrBlank() -> sinVincular.firstOrNull { it.pagoId == movimiento.pagoId }
            cuotaAntigua != null -> {
                val instante = Fmt.parse(movimiento.fecha)
                val numero = cuotaAntigua.groupValues[1].toIntOrNull()
                val prestamo = cuotaAntigua.groupValues[2]
                sinVincular.firstOrNull {
                    instante != null && it.tipoAbono == "cuota" && it.cuotaNumero == numero &&
                        it.prestamoId.equals(prestamo, ignoreCase = true) && it.valor == movimiento.valor &&
                        Fmt.parse(it.fecha) == instante
                }
            }
            else -> null
        }
        if (vinculacion != null) {
            sinVincular.remove(vinculacion)
            return@forEach
        }
        val esPago = !dep && (cuotaAntigua != null || !movimiento.pagoId.isNullOrBlank())
        lista += Mov(
            when {
                desembolso -> "Desembolso de préstamo"
                dep -> "Depósito"
                esPago -> "Pago de cuota"
                else -> "Retiro"
            },
            detalle,
            if (dep) movimiento.valor else -movimiento.valor,
            movimiento.fecha,
            when {
                desembolso -> Categoria.PRESTAMOS
                esPago -> Categoria.PAGOS
                else -> Categoria.AHORROS
            },
            if (desembolso) "Desembolsado" else "Completado",
        )
    }
    pagosHistorial.forEach {
        val cuota = it.tipoAbono == "cuota"
        val cap = it.tipoAbono == "capital"
        val detalle = if (cuota && it.cuotaNumero != null) "Cuota ${it.cuotaNumero} · Préstamo ${it.prestamoId}"
        else "Préstamo ${it.prestamoId}"
        lista += Mov(if (cuota) "Pago de cuota" else if (cap) "Abono de capital" else "Pago de intereses", detalle, -it.valor, it.fecha, Categoria.PAGOS, "Completado")
    }
    return lista.sortedByDescending { Fmt.parse(it.fecha) }
}
