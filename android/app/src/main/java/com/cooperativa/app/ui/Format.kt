package com.cooperativa.app.ui

import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.abs

object Fmt {
    private val zonaCooperativa = ZoneId.of("America/Bogota")
    private val simbolos = DecimalFormatSymbols(Locale.US).apply {
        groupingSeparator = '.'
        decimalSeparator = ','
    }
    private val entero = DecimalFormat("#,##0", simbolos)
    private val decimales = DecimalFormat("#,##0.00", simbolos)
    private val es = Locale("es", "CO")
    private val corta = DateTimeFormatter.ofPattern("d MMM", es).withZone(zonaCooperativa)
    private val larga = DateTimeFormatter.ofPattern("d MMM yyyy", es).withZone(zonaCooperativa)

    /** $1.850.000 */
    fun money(v: Double): String = "$" + (if (v % 1.0 == 0.0) entero.format(v) else decimales.format(v))

    /** +$200.000 / −$80.000 */
    fun signed(v: Double): String = (if (v >= 0) "+" else "−") + money(abs(v))

    fun parse(iso: String?): Instant? = try {
        if (iso.isNullOrBlank()) null else Instant.parse(iso)
    } catch (e: Exception) {
        null
    }

    private fun limpiar(s: String) = s.replace(".", "")

    fun fechaCorta(iso: String?): String = parse(iso)?.let { limpiar(corta.format(it)) } ?: "—"
    fun fechaLarga(iso: String?): String = parse(iso)?.let { limpiar(larga.format(it)) } ?: "—"

    /** Las cuotas se pueden pagar desde el día de vencimiento en adelante, según la zona de Colombia. */
    fun cuotaVencida(fecha: String?): Boolean {
        return try {
            val instante = parse(fecha) ?: return false
            !instante.atZone(zonaCooperativa).toLocalDate().isAfter(LocalDate.now(zonaCooperativa))
        } catch (_: Exception) {
            false
        }
    }

    fun cuotaAtrasada(fecha: String?): Boolean {
        return try {
            val instante = parse(fecha) ?: return false
            instante.atZone(zonaCooperativa).toLocalDate().isBefore(LocalDate.now(zonaCooperativa))
        } catch (_: Exception) {
            false
        }
    }

    fun periodoActual(): String = LocalDate.now(zonaCooperativa).let { "%04d-%02d".format(it.year, it.monthValue) }

    /** Próximo día 15 (fecha de pago según el diseño). */
    fun proximoPago(): String {
        val hoy = LocalDate.now(zonaCooperativa)
        val d = if (hoy.dayOfMonth <= 15) hoy.withDayOfMonth(15) else hoy.plusMonths(1).withDayOfMonth(15)
        return limpiar(larga.format(d.atStartOfDay(ZoneId.systemDefault()))).ifBlank { d.toString() }
    }

    fun finDeMes(periodo: String): String = try {
        val (a, m) = periodo.split("-").map { it.toInt() }
        val d = LocalDate.of(a, m, 1).let { it.withDayOfMonth(it.lengthOfMonth()) }
        limpiar(larga.format(d.atStartOfDay(ZoneId.systemDefault())))
    } catch (e: Exception) {
        periodo
    }

    fun porcentaje(fraccion: Double): String = DecimalFormat("0.00", simbolos).format(fraccion * 100) + "%"

    /** Fecha local de negocio para vigencias de productos (igual que la API). */
    fun hoyColombia(): String = LocalDate.now(zonaCooperativa).toString()
}

/** "Octubre 2026" */
fun Fmt.periodoTexto(): String {
    val hoy = LocalDate.now(ZoneId.of("America/Bogota"))
    val mes = hoy.month.getDisplayName(java.time.format.TextStyle.FULL, Locale("es", "CO"))
    return mes.replaceFirstChar { it.uppercase() } + " " + hoy.year
}
