package com.cooperativa.app.data

import android.content.SharedPreferences
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PATCH
import retrofit2.http.Path
import retrofit2.http.Query
import java.util.concurrent.TimeUnit

/** Todos los endpoints de la API REST (Node.js + MongoDB). */
interface CooperativaApi {
    @POST("api/auth/login") suspend fun login(@Body body: LoginRequest): ApiResponse<Session>
    @POST("api/gestion-usuarios") suspend fun crearCuentaAcceso(@Body body: CrearCuentaAccesoRequest): ApiResponse<CuentaAccesoCreada>

    @GET("api/estudiantes") suspend fun estudiantes(): ApiResponse<EstudiantesData>
    @GET("api/funcionarios") suspend fun funcionarios(): ApiResponse<FuncionariosData>

    @GET("api/ahorros") suspend fun cuentas(): ApiResponse<CuentasData>
    @POST("api/ahorros") suspend fun crearCuenta(@Body body: CrearCuentaRequest): ApiResponse<Ahorro>
    @GET("api/ahorros/{id}") suspend fun cuenta(@Path("id") id: String): ApiResponse<Ahorro>
    @POST("api/ahorros/{id}/depositos")
    suspend fun depositar(@Path("id") id: String, @Body body: MovimientoRequest): ApiResponse<MovimientoResultado>
    @POST("api/ahorros/{id}/retiros")
    suspend fun retirar(@Path("id") id: String, @Body body: MovimientoRequest): ApiResponse<MovimientoResultado>
    @POST("api/ahorros/transferencias") suspend fun transferir(@Body body: TransferenciaRequest): ApiResponse<TransferenciaResultado>
    @GET("api/ahorros/{id}/movimientos") suspend fun movimientos(@Path("id") id: String): ApiResponse<MovimientosData>

    @GET("api/fines-educativos") suspend fun fines(): ApiResponse<FinesData>
    @GET("api/productos") suspend fun productos(): ApiResponse<ProductosData>
    @POST("api/productos") suspend fun crearProducto(@Body body: ProductoRequest): ApiResponse<Producto>
    @PATCH("api/productos/{id}") suspend fun actualizarProducto(@Path("id") id:String,@Body body:ProductoRequest):ApiResponse<Producto>
    @PATCH("api/productos/{id}/estado") suspend fun cambiarEstadoProducto(@Path("id") id:String,@Body body:EstadoProductoRequest):ApiResponse<Producto>
    @POST("api/productos/{id}/compras") suspend fun comprar(@Path("id") id: String, @Body body: CompraRequest): ApiResponse<CompraResultado>
    @GET("api/productos/compras/mias") suspend fun misCompras():ApiResponse<ComprasData>
    @POST("api/prestamos") suspend fun solicitarPrestamo(@Body body: PrestamoRequest): ApiResponse<PrestamoCreado>
    @GET("api/estudiantes/{id}/prestamos") suspend fun prestamosDe(@Path("id") id: String): ApiResponse<PrestamosData>
    @POST("api/prestamos/{id}/aprobar") suspend fun aprobarPrestamo(@Path("id") id: String): ApiResponse<DesembolsoResultado>
    @POST("api/prestamos/{id}/cuotas/{numero}/pagar") suspend fun pagarCuota(@Path("id") id: String,@Path("numero") numero:Int): ApiResponse<CuotaResultado>
    @GET("api/prestamos/{id}/pagos") suspend fun pagos(@Path("id") id: String): ApiResponse<PagosData>

    @GET("api/distribucion-intereses/calculo")
    suspend fun calcularDistribucion(@Query("intereses_generados") intereses: Double): ApiResponse<CalculoDistribucion>
    @POST("api/distribucion-intereses")
    suspend fun registrarDistribucion(@Body body: DistribucionRequest): ApiResponse<CalculoDistribucion>

    @GET("api/reportes/estadisticas") suspend fun estadisticas(): ApiResponse<Estadisticas>
}

/** Construye Retrofit con la dirección guardada (se puede cambiar desde la pantalla de login). */
class ApiClient(
    private val prefs: SharedPreferences,
    private val defaultBaseUrl: String,
) {
    private var cache: CooperativaApi? = null

    var baseUrl: String
        get() = prefs.getString(KEY_URL, null) ?: defaultBaseUrl
        set(value) {
            prefs.edit().putString(KEY_URL, normalizar(value)).apply()
            cache = null
        }

    fun api(): CooperativaApi = cache ?: construir().also { cache = it }

    private fun construir(): CooperativaApi {
        val log = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC }
        val http = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val original = chain.request()
                val token = prefs.getString(KEY_TOKEN, null)
                val request = if (!token.isNullOrBlank() && !original.url.encodedPath.endsWith("/api/auth/login")) {
                    original.newBuilder().header("Authorization", "Bearer $token").build()
                } else original
                chain.proceed(request)
            }
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .writeTimeout(20, TimeUnit.SECONDS)
            .addInterceptor(log)
            .build()
        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(http)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(CooperativaApi::class.java)
    }

    companion object {
        private const val KEY_URL = "base_url"
        private const val KEY_TOKEN = "auth_token"

        fun normalizar(url: String): String {
            var u = url.trim()
            if (!u.startsWith("http://") && !u.startsWith("https://")) u = "http://$u"
            if (!u.endsWith("/")) u += "/"
            return u
        }
    }
}
