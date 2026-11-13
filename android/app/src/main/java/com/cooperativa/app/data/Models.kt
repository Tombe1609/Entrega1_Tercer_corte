package com.cooperativa.app.data

import com.google.gson.annotations.SerializedName

/** Formato único de la API: { success, message, data } */
data class ApiResponse<T>(
    val success: Boolean = false,
    val message: String? = null,
    val data: T? = null,
)

data class ApiErrorBody(
    val message: String? = null,
    val errors: List<String>? = null,
)

class ApiException(message: String, val statusCode: Int? = null) : Exception(message)

// ---------- Autenticación ----------
data class LoginRequest(val email: String, val password: String)

data class Session(
    val rol: String,                 // estudiante | funcionario | rector
    val id: String,
    val nombre: String,
    val email: String,
    val documento: String? = null,
    val telefono: String? = null,
    val cargo: String? = null,
    val estado: String? = null,
    @SerializedName("ahorro_id") val ahorroId: String? = null,
    val token: String? = null,
) {
    val esAdmin: Boolean get() = rol != "estudiante"
}

// ---------- Usuarios ----------
data class Usuario(
    @SerializedName("usuario_id") val usuarioId: String = "",
    val nombre: String = "",
    val documento: String = "",
    val telefono: String = "",
    val email: String = "",
    val tipo: String = "",
    val estado: String = "",
)

data class EstudiantesData(val cantidad: Int = 0, val estudiantes: List<Usuario> = emptyList())

data class Funcionario(
    @SerializedName("funcionario_id") val funcionarioId: String = "",
    val nombre: String = "",
    val cargo: String = "",
    val telefono: String = "",
    val email: String = "",
    val estado: String = "",
)

data class FuncionariosData(val cantidad: Int = 0, val funcionarios: List<Funcionario> = emptyList())

data class CrearCuentaAccesoRequest(
    val tipo: String,
    val nombre: String,
    val documento: String? = null,
    val telefono: String,
    val email: String,
    val cargo: String? = null,
    val password: String,
)

data class CuentaAccesoCreada(
    val tipo: String = "",
    val id: String = "",
    val nombre: String = "",
    val email: String = "",
    val cargo: String? = null,
    val estado: String = "",
    @SerializedName("ahorro_id") val ahorroId: String? = null,
)

// ---------- Ahorros ----------
data class Ahorro(
    @SerializedName("ahorro_id") val ahorroId: String = "",
    @SerializedName("usuario_id") val usuarioId: String = "",
    val saldo: Double = 0.0,
    val estado: String = "",
)

data class CuentasData(val cantidad: Int = 0, val cuentas: List<Ahorro> = emptyList())

data class Movimiento(
    @SerializedName("movimiento_id") val movimientoId: String = "",
    @SerializedName("ahorro_id") val ahorroId: String = "",
    @SerializedName("usuario_id") val usuarioId: String = "",
    val tipo: String = "",           // deposito | retiro
    val valor: Double = 0.0,
    val fecha: String? = null,
    val descripcion: String? = null,
)

data class MovimientosData(
    val cuenta: Ahorro? = null,
    val cantidad: Int = 0,
    val movimientos: List<Movimiento> = emptyList(),
)

data class MovimientoRequest(val valor: Double, val descripcion: String)
data class TransferenciaRequest(@SerializedName("usuario_destino") val usuarioDestino:String,val valor:Double,val descripcion:String="Transferencia entre estudiantes")
data class TransferenciaResultado(@SerializedName("saldo_origen") val saldoOrigen:Double=0.0,@SerializedName("saldo_destino") val saldoDestino:Double=0.0)

data class MovimientoResultado(
    val movimiento: Movimiento? = null,
    @SerializedName("saldo_anterior") val saldoAnterior: Double = 0.0,
    @SerializedName("saldo_actual") val saldoActual: Double = 0.0,
)

data class CrearCuentaRequest(@SerializedName("usuario_id") val usuarioId: String)

// ---------- Préstamos ----------
data class FinEducativo(
    @SerializedName("fin_id") val finId: String = "",
    val nombre: String = "",
    val estado: String? = null,
)
data class Producto(@SerializedName("producto_id") val productoId:String="",val nombre:String="",val categoria:String="",val descripcion:String="",val precio:Double=0.0,val estado:String="activo",@SerializedName("fecha_inicio") val fechaInicio:String?=null,@SerializedName("fecha_fin") val fechaFin:String?=null)
data class ProductosData(val cantidad:Int=0,val productos:List<Producto> = emptyList())
data class ProductoRequest(val nombre:String,val categoria:String,val descripcion:String,val precio:Double,@SerializedName("fecha_inicio") val fechaInicio:String?=null,@SerializedName("fecha_fin") val fechaFin:String?=null)
data class CompraRequest(val valor:Double)
data class CompraResultado(@SerializedName("saldo_actual") val saldoActual:Double=0.0)
data class Compra(@SerializedName("compra_id") val compraId:String="",@SerializedName("producto_id") val productoId:String="",@SerializedName("nombre_producto") val nombreProducto:String="",val valor:Double=0.0,val fecha:String?=null,val estado:String="")
data class ComprasData(val compras:List<Compra> = emptyList())
data class EstadoProductoRequest(val estado:String)

data class FinesData(
    val cantidad: Int = 0,
    @SerializedName("fines_educativos") val fines: List<FinEducativo> = emptyList(),
)

data class PrestamoRequest(
    @SerializedName("usuario_id") val usuarioId: String,
    @SerializedName("fin_id") val finId: String? = null,
    val monto: Double,
    @SerializedName("plazo_meses") val plazoMeses:Int=1,
    @SerializedName("fecha_primer_pago") val fechaPrimerPago:String="",
    @SerializedName("producto_id") val productoId:String?=null,
)

data class PrestamoResumen(
    @SerializedName("prestamo_id") val prestamoId: String = "",
    @SerializedName("fin_id") val finId: String = "",
    val finalidad: String? = null,
    @SerializedName("capital_inicial") val capitalInicial: Double = 0.0,
    @SerializedName("capital_pendiente") val capitalPendiente: Double = 0.0,
    @SerializedName("interes_pendiente") val interesPendiente: Double = 0.0,
    val estado: String = "",
    @SerializedName("fecha_solicitud") val fechaSolicitud: String? = null,
    @SerializedName("fecha_desembolso") val fechaDesembolso: String? = null,
    @SerializedName("plazo_meses") val plazoMeses:Int=1,
    val cuotas:List<CuotaPrestamo> = emptyList(),
)
data class CuotaPrestamo(
    val numero:Int=0,
    @SerializedName("fecha_vencimiento") val fechaVencimiento:String?=null,
    val capital:Double=0.0,
    val interes:Double=0.0,
    val valor:Double=0.0,
    val estado:String="pendiente",
)
data class CuotaResultado(val prestamo:PrestamoResumen?=null,@SerializedName("saldo_actual") val saldoActual:Double=0.0)

data class EstudianteRef(
    @SerializedName("usuario_id") val usuarioId: String = "",
    val nombre: String = "",
)

data class PrestamosData(
    val estudiante: EstudianteRef? = null,
    @SerializedName("cantidad_prestamos") val cantidad: Int = 0,
    @SerializedName("total_capital_pendiente") val totalCapitalPendiente: Double = 0.0,
    @SerializedName("total_interes_pendiente") val totalInteresPendiente: Double = 0.0,
    val prestamos: List<PrestamoResumen> = emptyList(),
)

data class PrestamoCreado(
    @SerializedName("prestamo_id") val prestamoId: String = "",
    @SerializedName("capital_inicial") val capitalInicial: Double = 0.0,
    @SerializedName("interes_inicial") val interesInicial: Double = 0.0,
    val estado: String = "pendiente",
)

data class DesembolsoResultado(
    val prestamo: PrestamoResumen? = null,
    val movimiento: Movimiento? = null,
    @SerializedName("saldo_anterior") val saldoAnterior: Double = 0.0,
    @SerializedName("saldo_actual") val saldoActual: Double = 0.0,
)

// ---------- Pagos ----------
data class Pago(
    @SerializedName("pago_id") val pagoId: String = "",
    @SerializedName("prestamo_id") val prestamoId: String = "",
    @SerializedName("usuario_id") val usuarioId: String = "",
    @SerializedName("tipo_abono") val tipoAbono: String = "",
    @SerializedName("cuota_numero") val cuotaNumero: Int? = null,
    val valor: Double = 0.0,
    val fecha: String? = null,
)

data class PagosData(
    @SerializedName("cantidad_pagos") val cantidad: Int = 0,
    val pagos: List<Pago> = emptyList(),
)

// ---------- Distribución de intereses ----------
data class DistribucionItem(
    @SerializedName("usuario_id") val usuarioId: String = "",
    @SerializedName("ahorro_id") val ahorroId: String = "",
    @SerializedName("ahorro_base") val ahorroBase: Double = 0.0,
    val participacion: Double = 0.0,
    @SerializedName("interes_recibido") val interesRecibido: Double = 0.0,
)

data class CalculoDistribucion(
    @SerializedName("intereses_generados") val interesesGenerados: Double = 0.0,
    @SerializedName("total_ahorrado") val totalAhorrado: Double = 0.0,
    @SerializedName("cantidad_ahorradores") val cantidadAhorradores: Int = 0,
    @SerializedName("suma_distribuida") val sumaDistribuida: Double = 0.0,
    @SerializedName("diferencia_por_redondeo") val diferencia: Double = 0.0,
    val distribucion: List<DistribucionItem> = emptyList(),
)

data class DistribucionRequest(
    val periodo: String,
    @SerializedName("intereses_generados") val interesesGenerados: Double,
)

// ---------- Estadísticas (rector / panel administrativo) ----------
data class Estadisticas(
    val estudiantes: EstCantidad? = null,
    val ahorros: EstAhorros? = null,
    val prestamos: EstPrestamos? = null,
)

data class EstCantidad(val cantidad: Int = 0)
data class EstAhorros(@SerializedName("total_ahorrado") val totalAhorrado: Double = 0.0)
data class EstPrestamos(
    val cantidad: Int = 0,
    @SerializedName("total_prestado") val totalPrestado: Double = 0.0,
    @SerializedName("total_intereses_pendientes") val totalInteresesPendientes: Double = 0.0,
    @SerializedName("total_capital_pendiente") val totalCapitalPendiente: Double = 0.0,
    @SerializedName("por_estado") val porEstado: List<EstEstado> = emptyList(),
)
data class EstEstado(val estado: String = "", val cantidad: Int = 0)
