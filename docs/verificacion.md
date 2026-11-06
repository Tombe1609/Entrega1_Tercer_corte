# Informe de verificación

Fecha: 28 de octubre de 2026.

## Resultado

La compilación debug de Android terminó correctamente con Gradle 8.7 y JDK 21 después de los cambios de permisos, sesión y navegación. El emulador no estaba conectado durante esta última verificación, así que no se repitió la prueba visual de login contra el nuevo middleware.

El código nuevo de API se inició en el puerto 3000 contra `cooperativa_universitaria`, sin seed ni escrituras. `/api/health` devolvió 200; `GET /api/ahorros` sin token devolvió 401; login de rector más la misma lectura con Bearer devolvieron 200. Para las pruebas de escritura y permisos se usó la base temporal `cooperativa_auth_check`, separada de la base original y `cooperativa_universitaria_demo`. Se retiró al finalizar. Las bases original y demo se conservaron.

## Cobertura funcional de API

| Historia | Verificación | Resultado esperado/observado |
|---|---|---|
| HU1 | Crear estudiante con sesión de rector y consultarlo | 201 / 200 |
| HU2 | Crear funcionario con sesión de rector | 201 |
| HU3 | Abrir cuenta para el estudiante creado | 201 |
| HU4 | Depositar, retirar y rechazar retiro mayor al saldo | 201 / 201 / 400 |
| HU5 | Crear préstamo educativo | 201 |
| HU6 | Calcular interés | 200 |
| HU7 | Consultar préstamos y saldos | 200 |
| HU8 | Abonar a capital y pagar interés | 201 / 201 |
| HU9 | Calcular y registrar distribución | 200 / 201 |
| HU10 | Consultar estadísticas | 200 |

También se verificaron lecturas de estudiantes, funcionarios, ahorros, movimientos, finalidades, pagos y distribución. En la matriz de seguridad: solicitudes sin token e inválidas dieron 401; el estudiante pudo leer su cuenta y préstamos; el acceso a cuenta ajena, movimientos ajenos, préstamos ajenos, listados administrativos, apertura de cuenta para tercero y préstamo para tercero dio 403; el funcionario pudo consultar el panel administrativo pero no confirmar la distribución; el rector completó las historias HU1-HU10. La base de prueba se eliminó después de la ejecución.

## Hallazgos pendientes

1. **URL de release:** el recurso base sigue apuntando a `10.0.2.2`, válido para el emulador. Antes de entregar el APK se debe configurar la URL HTTPS desplegada.
2. **HTTP local:** Android permite tráfico HTTP de desarrollo; restringirlo a debug y desactivarlo para release.
3. **Entrega:** se verificó `assembleDebug`, pero no se ejecutó una compilación `release` ni se configuró una firma de publicación.
4. **Escala:** las consultas administrativas siguen realizando varias peticiones por usuario/cuenta/préstamo; con más datos puede crecer el tiempo de carga.
5. **Regla HU9:** la API calcula y registra la distribución; no acredita esos intereses en las cuentas de ahorro. Confirmar que esa conducta coincide con el enunciado antes de presentarla como acreditación de saldo.

La verificación confirma las 10 historias y las reglas de acceso principales en una base aislada. No equivale a una auditoría de seguridad completa ni a una prueba de carga.
