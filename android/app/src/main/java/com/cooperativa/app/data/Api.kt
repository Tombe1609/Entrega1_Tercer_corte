package com.cooperativa.app.data

import android.content.SharedPreferences
import com.cooperativa.app.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PATCH
import retrofit2.http.PUT
import retrofit2.http.DELETE
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.Header
import java.security.MessageDigest
import java.util.concurrent.TimeUnit
import java.util.UUID

/** Todos los endpoints de la API REST (Node.js + MongoDB). */
interface CooperativaApi {
    @POST("api/solicitudes-cuenta") suspend fun solicitarCuenta(@Body body: SolicitudCuentaRequest): ApiResponse<Map<String, String>>
    @GET("api/solicitudes-cuenta") suspend fun solicitudesCuenta(): ApiResponse<SolicitudesCuentaData>
    @PUT("api/solicitudes-cuenta/{id}") suspend fun editarSolicitudCuenta(@Path("id") id: String, @Body body: EditarSolicitudRequest): ApiResponse<Map<String, String>>
    @PATCH("api/solicitudes-cuenta/{id}") suspend fun decidirSolicitudCuenta(@Path("id") id: String, @Body body: DecisionSolicitudRequest): ApiResponse<Map<String, String>>
    @PATCH("api/mi-perfil") suspend fun editarPerfil(@Body body: PerfilRequest): ApiResponse<PerfilResultado>
    @GET("api/auditoria-cuentas") suspend fun auditoriaCuentas(): ApiResponse<AuditoriaCuentasData>
    @POST("api/auth/login") suspend fun login(@Body body: LoginRequest): ApiResponse<Session>
    @PATCH("api/auth/password")
    suspend fun cambiarPassword(@Body body: CambioPasswordRequest): ApiResponse<CambioPasswordResultado>
    @POST("api/gestion-usuarios") suspend fun crearCuentaAcceso(@Body body: CrearCuentaAccesoRequest): ApiResponse<CuentaAccesoCreada>
    @PATCH("api/gestion-usuarios/estudiantes/{id}/estado") suspend fun cambiarEstadoEstudiante(@Path("id") id: String, @Body body: EstadoCuentaRequest): ApiResponse<Map<String, String>>

    @GET("api/estudiantes") suspend fun estudiantes(): ApiResponse<EstudiantesData>
    @GET("api/funcionarios") suspend fun funcionarios(): ApiResponse<FuncionariosData>

    @GET("api/ahorros") suspend fun cuentas(): ApiResponse<CuentasData>
    @POST("api/ahorros") suspend fun crearCuenta(@Body body: CrearCuentaRequest): ApiResponse<Ahorro>
    @GET("api/ahorros/{id}") suspend fun cuenta(@Path("id") id: String): ApiResponse<Ahorro>
    @DELETE("api/ahorros/{id}") suspend fun cerrarCuenta(@Path("id") id: String): ApiResponse<Map<String, String>>
    @POST("api/ahorros/{id}/depositos")
    suspend fun depositar(@Path("id") id: String, @Header("Idempotency-Key") key: String, @Body body: MovimientoRequest): ApiResponse<MovimientoResultado>
    @POST("api/ahorros/{id}/retiros")
    suspend fun retirar(@Path("id") id: String, @Header("Idempotency-Key") key: String, @Body body: MovimientoRequest): ApiResponse<MovimientoResultado>
    @POST("api/ahorros/transferencias") suspend fun transferir(@Header("Idempotency-Key") key: String, @Body body: TransferenciaRequest): ApiResponse<TransferenciaResultado>
    @GET("api/ahorros/{id}/movimientos") suspend fun movimientos(@Path("id") id: String): ApiResponse<MovimientosData>

    @GET("api/fines-educativos") suspend fun fines(): ApiResponse<FinesData>
    @GET("api/productos") suspend fun productos(): ApiResponse<ProductosData>
    @POST("api/productos") suspend fun crearProducto(@Body body: ProductoRequest): ApiResponse<Producto>
    @PATCH("api/productos/{id}") suspend fun actualizarProducto(@Path("id") id:String,@Body body:ProductoRequest):ApiResponse<Producto>
    @PATCH("api/productos/{id}/estado") suspend fun cambiarEstadoProducto(@Path("id") id:String,@Body body:EstadoProductoRequest):ApiResponse<Producto>
    @POST("api/productos/{id}/compras") suspend fun comprar(@Path("id") id: String, @Header("Idempotency-Key") key: String, @Body body: CompraRequest): ApiResponse<CompraResultado>
    @GET("api/productos/compras/mias") suspend fun misCompras():ApiResponse<ComprasData>
    @POST("api/prestamos") suspend fun solicitarPrestamo(@Body body: PrestamoRequest): ApiResponse<PrestamoCreado>
    @GET("api/estudiantes/{id}/prestamos") suspend fun prestamosDe(@Path("id") id: String): ApiResponse<PrestamosData>
    @GET("api/prestamos") suspend fun prestamosAdmin(): ApiResponse<PrestamosAdminData>
    @POST("api/prestamos/{id}/aprobar") suspend fun aprobarPrestamo(@Path("id") id: String, @Header("Idempotency-Key") key: String): ApiResponse<DesembolsoResultado>
    @POST("api/prestamos/{id}/rechazar") suspend fun rechazarPrestamo(@Path("id") id: String, @Body body: Map<String, String>): ApiResponse<Map<String, String>>
    @POST("api/prestamos/{id}/cuotas/{numero}/pagar") suspend fun pagarCuota(@Path("id") id: String,@Path("numero") numero:Int,@Header("Idempotency-Key") key: String): ApiResponse<CuotaResultado>
    @GET("api/prestamos/{id}/pagos") suspend fun pagos(@Path("id") id: String): ApiResponse<PagosData>

    @GET("api/distribucion-intereses/calculo")
    suspend fun calcularDistribucion(@Query("intereses_generados") intereses: Double): ApiResponse<CalculoDistribucion>
    @POST("api/distribucion-intereses")
    suspend fun registrarDistribucion(@Body body: DistribucionRequest): ApiResponse<CalculoDistribucion>

    @GET("api/reportes/estadisticas") suspend fun estadisticas(): ApiResponse<Estadisticas>
}

/** Cliente Retrofit de la API HTTPS de Render; la URL es fija en todas las variantes. */
class ApiClient(
    private val prefs: SharedPreferences,
    private val defaultBaseUrl: String,
    private val tokenVault: TokenVault,
) {
    private var cache: CooperativaApi? = null

    // Ignora preferencias de servidor guardadas por versiones anteriores de desarrollo.
    val baseUrl: String = defaultBaseUrl

    fun api(): CooperativaApi = cache ?: construir().also { cache = it }

    /** Conserva una clave hasta recibir respuesta concluyente para poder repetir el mismo intento con seguridad. */
    @Synchronized
    fun claveIdempotencia(operacion: String): String {
        val hash = huellaOperacion(operacion)
        val storageKey = "pending_idempotency_$hash"
        return prefs.getString(storageKey, null) ?: UUID.randomUUID().toString().also {
            check(prefs.edit().putString(storageKey, it).commit()) { "No se pudo guardar la clave de la operación." }
        }
    }

    @Synchronized
    fun completarOperacionIdempotente(operacion: String) {
        val hash = huellaOperacion(operacion)
        prefs.edit().remove("pending_idempotency_$hash").commit()
    }

    private fun huellaOperacion(operacion: String): String =
        MessageDigest.getInstance("SHA-256").digest(operacion.toByteArray())
            .joinToString("") { (it.toInt() and 0xff).toString(16).padStart(2, '0') }

    private fun construir(): CooperativaApi {
        val url = baseUrl
        val builder = OkHttpClient.Builder()
            // El token solo se envía a la API asociada con la sesión, nunca a otro host.
            .followRedirects(false)
            .followSslRedirects(false)
            .addInterceptor { chain ->
                val original = chain.request()
                val token = tokenVault.read()?.takeIf { prefs.getString(KEY_SESSION_URL, null) == url }
                val request = if (!token.isNullOrBlank() && !original.url.encodedPath.endsWith("/api/auth/login")) {
                    original.newBuilder().header("Authorization", "Bearer $token").build()
                } else original
                chain.proceed(request)
            }
            // Render Free puede tardar decenas de segundos al despertar tras inactividad.
            // Dar margen al arranque evita errores prematuros en la app móvil.
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(90, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .callTimeout(100, TimeUnit.SECONDS)
        if (BuildConfig.DEBUG) {
            builder.addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC })
        }
        return Retrofit.Builder()
            .baseUrl(url)
            .client(builder.build())
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(CooperativaApi::class.java)
    }

    companion object {
        const val KEY_SESSION_URL = "session_base_url"
    }
}
