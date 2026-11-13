package com.cooperativa.app.data

import com.google.gson.Gson
import retrofit2.HttpException
import java.io.IOException

/** Llama a la API y convierte cualquier falla en un ApiException con mensaje legible. */
class Repository(private val client: ApiClient) {
    private val gson = Gson()
    private val api get() = client.api()

    val baseUrl: String get() = client.baseUrl
    fun cambiarServidor(url: String) { client.baseUrl = url }

    private suspend fun <T> call(block: suspend () -> ApiResponse<T>): T {
        try {
            val r = block()
            return r.data ?: throw ApiException(r.message ?: "La API devolvió una respuesta vacía.")
        } catch (e: HttpException) {
            throw ApiException(mensajeDeError(e), e.code())
        } catch (e: IOException) {
            throw ApiException(
                "No se pudo conectar con el servidor (${client.baseUrl}). " +
                    "Verifica que la API esté encendida y que la dirección sea correcta."
            )
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
    suspend fun crearCuentaAcceso(body: CrearCuentaAccesoRequest) = call { api.crearCuentaAcceso(body) }

    suspend fun estudiantes() = call { api.estudiantes() }.estudiantes
    suspend fun funcionarios() = call { api.funcionarios() }.funcionarios

    suspend fun cuentas() = call { api.cuentas() }.cuentas
    suspend fun crearCuenta(usuarioId: String) = call { api.crearCuenta(CrearCuentaRequest(usuarioId)) }
    suspend fun cuenta(id: String) = call { api.cuenta(id) }
    suspend fun movimientos(id: String) = call { api.movimientos(id) }.movimientos
    suspend fun depositar(id: String, valor: Double, desc: String) = call { api.depositar(id, MovimientoRequest(valor, desc)) }
    suspend fun retirar(id: String, valor: Double, desc: String) = call { api.retirar(id, MovimientoRequest(valor, desc)) }
    suspend fun transferir(usuarioDestino:String,valor:Double) = call { api.transferir(TransferenciaRequest(usuarioDestino,valor)) }
    suspend fun productos() = call { api.productos() }.productos
    suspend fun crearProducto(nombre:String,categoria:String,descripcion:String,precio:Double,fechaInicio:String?,fechaFin:String?) = call { api.crearProducto(ProductoRequest(nombre,categoria,descripcion,precio,fechaInicio,fechaFin)) }
    suspend fun actualizarProducto(id:String,nombre:String,categoria:String,descripcion:String,precio:Double,fechaInicio:String?,fechaFin:String?) = call { api.actualizarProducto(id,ProductoRequest(nombre,categoria,descripcion,precio,fechaInicio,fechaFin)) }
    suspend fun cambiarEstadoProducto(id:String,estado:String)=call{api.cambiarEstadoProducto(id,EstadoProductoRequest(estado))}
    suspend fun comprar(productoId:String,precio:Double) = call { api.comprar(productoId,CompraRequest(precio)) }
    suspend fun misCompras()=call{api.misCompras()}.compras

    suspend fun fines() = call { api.fines() }.fines
    suspend fun solicitarPrestamo(usuarioId: String, finId: String?, monto: Double,plazoMeses:Int,fechaPrimerPago:String,productoId:String?=null) =
        call { api.solicitarPrestamo(PrestamoRequest(usuarioId, finId, monto,plazoMeses,fechaPrimerPago,productoId)) }
    suspend fun prestamosDe(usuarioId: String) = call { api.prestamosDe(usuarioId) }
    suspend fun aprobarPrestamo(prestamoId: String) = call { api.aprobarPrestamo(prestamoId) }
    suspend fun pagarCuota(prestamoId:String,numero:Int)=call{api.pagarCuota(prestamoId,numero)}
    suspend fun pagos(prestamoId: String) = call { api.pagos(prestamoId) }.pagos

    suspend fun calcularDistribucion(intereses: Double) = call { api.calcularDistribucion(intereses) }
    suspend fun registrarDistribucion(periodo: String, intereses: Double) =
        call { api.registrarDistribucion(DistribucionRequest(periodo, intereses)) }

    suspend fun estadisticas() = call { api.estadisticas() }
}
