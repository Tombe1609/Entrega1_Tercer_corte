package com.cooperativa.app.data

import com.google.gson.Gson
import retrofit2.HttpException
import java.io.IOException

/** Punto único de acceso a la API: centraliza errores HTTP/red e idempotencia financiera. */
class Repository(private val client: ApiClient) {
    private val gson = Gson()
    private val api get() = client.api()

    val baseUrl: String get() = client.baseUrl

    private suspend fun <T> call(block: suspend () -> ApiResponse<T>): T {
        try {
            val r = block()
            return r.data ?: throw ApiException(r.message ?: "La API devolvió una respuesta vacía.")
        } catch (e: HttpException) {
            throw ApiException(mensajeDeError(e), e.code())
        } catch (e: IOException) {
            throw ApiException(
                "No se pudo conectar con la API de Render. Verifica tu conexión e inténtalo de nuevo; " +
                    "si continúa, revisa el estado del servicio."
            )
        }
    }

    /** Solo libera la clave tras respuesta concluyente; ante timeout o 5xx se conserva para el mismo reintento. */
    private suspend fun <T> callIdempotente(operacion: String, block: suspend (String) -> ApiResponse<T>): T {
        val clave = client.claveIdempotencia(operacion)
        return try {
            call { block(clave) }.also { client.completarOperacionIdempotente(operacion) }
        } catch (error: ApiException) {
            // 409 puede significar que el intento anterior sigue en verificación: conservar la clave es lo seguro.
            if (error.statusCode != null && error.statusCode in 400..499 && error.statusCode != 409) {
                client.completarOperacionIdempotente(operacion)
            }
            throw error
        }
    }

    private fun mensajeDeError(e: HttpException): String {
        return try {
            val texto = e.response()?.errorBody()?.string().orEmpty()
            val body = gson.fromJson(texto, ApiErrorBody::class.java)
            val detalle = body?.errors?.joinToString("\n")?.takeIf { it.isNotBlank() }
            when {
                detalle != null -> detalle
                !body?.message.isNullOrBlank() -> body?.message!!
                else -> "Error ${e.code()} del servidor."
            }
        } catch (ex: Exception) {
            "Error ${e.code()} del servidor."
        }
    }

    suspend fun login(email: String, password: String) = call { api.login(LoginRequest(email.trim(), password)) }
    suspend fun solicitarCuenta(body: SolicitudCuentaRequest) = call { api.solicitarCuenta(body) }
    suspend fun solicitudesCuenta() = call { api.solicitudesCuenta() }.solicitudes
    suspend fun editarSolicitud(id: String, body: EditarSolicitudRequest) = call { api.editarSolicitudCuenta(id, body) }
    suspend fun decidirSolicitud(id: String, aprobar: Boolean, motivo: String = "") = call {
        api.decidirSolicitudCuenta(id, DecisionSolicitudRequest(if (aprobar) "aprobada" else "rechazada", motivo))
    }
    suspend fun editarPerfil(body: PerfilRequest) = call { api.editarPerfil(body) }
    suspend fun auditoriaCuentas() = call { api.auditoriaCuentas() }.eventos
    suspend fun cambiarPassword(actual: String, nueva: String) {
        val resultado = call { api.cambiarPassword(CambioPasswordRequest(actual, nueva)) }
        if (!resultado.actualizada) throw ApiException("No se confirmó el cambio de contraseña.")
    }
    suspend fun crearCuentaAcceso(body: CrearCuentaAccesoRequest) = call { api.crearCuentaAcceso(body) }
    suspend fun cambiarEstadoEstudiante(id: String, estado: String) = call { api.cambiarEstadoEstudiante(id, EstadoCuentaRequest(estado)) }

    suspend fun estudiantes() = call { api.estudiantes() }.estudiantes
    suspend fun funcionarios() = call { api.funcionarios() }.funcionarios

    suspend fun cuentas() = call { api.cuentas() }.cuentas
    suspend fun crearCuenta(usuarioId: String) = call { api.crearCuenta(CrearCuentaRequest(usuarioId)) }
    suspend fun cerrarCuenta(id: String) = call { api.cerrarCuenta(id) }
    suspend fun cuenta(id: String) = call { api.cuenta(id) }
    suspend fun movimientos(id: String) = call { api.movimientos(id) }.movimientos
    suspend fun depositar(id: String, valor: Double, desc: String) {
        val body = MovimientoRequest(valor, desc)
        val op = "${client.baseUrl}POST:/api/ahorros/$id/depositos:${gson.toJson(body)}"
        callIdempotente(op) { api.depositar(id, it, body) }
    }
    suspend fun retirar(id: String, valor: Double, desc: String) {
        val body = MovimientoRequest(valor, desc)
        val op = "${client.baseUrl}POST:/api/ahorros/$id/retiros:${gson.toJson(body)}"
        callIdempotente(op) { api.retirar(id, it, body) }
    }
    suspend fun transferir(usuarioDestino:String,valor:Double) {
        val body = TransferenciaRequest(usuarioDestino,valor)
        val op = "${client.baseUrl}POST:/api/ahorros/transferencias:${gson.toJson(body)}"
        callIdempotente(op) { api.transferir(it, body) }
    }
    suspend fun productos() = call { api.productos() }.productos
    suspend fun crearProducto(nombre:String,categoria:String,descripcion:String,precio:Double,fechaInicio:String?,fechaFin:String?) = call { api.crearProducto(ProductoRequest(nombre,categoria,descripcion,precio,fechaInicio,fechaFin)) }
    suspend fun actualizarProducto(id:String,nombre:String,categoria:String,descripcion:String,precio:Double,fechaInicio:String?,fechaFin:String?) = call { api.actualizarProducto(id,ProductoRequest(nombre,categoria,descripcion,precio,fechaInicio,fechaFin)) }
    suspend fun cambiarEstadoProducto(id:String,estado:String)=call{api.cambiarEstadoProducto(id,EstadoProductoRequest(estado))}
    suspend fun comprar(productoId:String,precio:Double) {
        val body = CompraRequest(precio)
        val op = "${client.baseUrl}POST:/api/productos/$productoId/compras:${gson.toJson(body)}"
        callIdempotente(op) { api.comprar(productoId, it, body) }
    }
    suspend fun misCompras()=call{api.misCompras()}.compras

    suspend fun fines() = call { api.fines() }.fines
    suspend fun solicitarPrestamo(usuarioId: String, finId: String?, monto: Double,plazoMeses:Int,fechaPrimerPago:String,productoId:String?=null) =
        call { api.solicitarPrestamo(PrestamoRequest(usuarioId, finId, monto,plazoMeses,fechaPrimerPago,productoId)) }
    suspend fun prestamosDe(usuarioId: String) = call { api.prestamosDe(usuarioId) }
    suspend fun prestamosAdmin() = call { api.prestamosAdmin() }.prestamos
    suspend fun aprobarPrestamo(prestamoId: String) {
        val op = "${client.baseUrl}POST:/api/prestamos/$prestamoId/aprobar:{}"
        callIdempotente(op) { api.aprobarPrestamo(prestamoId, it) }
    }
    suspend fun rechazarPrestamo(prestamoId: String, motivo: String) = call { api.rechazarPrestamo(prestamoId, mapOf("motivo" to motivo)) }
    suspend fun pagarCuota(prestamoId:String,numero:Int) {
        val op = "${client.baseUrl}POST:/api/prestamos/$prestamoId/cuotas/$numero/pagar:{}"
        callIdempotente(op) { api.pagarCuota(prestamoId, numero, it) }
    }
    suspend fun pagos(prestamoId: String) = call { api.pagos(prestamoId) }.pagos

    suspend fun calcularDistribucion(intereses: Double) = call { api.calcularDistribucion(intereses) }
    suspend fun registrarDistribucion(periodo: String, intereses: Double) =
        call { api.registrarDistribucion(DistribucionRequest(periodo, intereses)) }

    suspend fun estadisticas() = call { api.estadisticas() }
}
