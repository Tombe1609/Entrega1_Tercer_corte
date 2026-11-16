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

## Hallazgos registrados el 28 de octubre de 2026

1. **URL y HTTP local:** resueltos el 16 de noviembre; debug y release usan HTTPS de Render y se retiró el selector de dirección local.
2. **Firma de publicación:** pendiente. Debug y release compilan; release sigue sin firmar hasta que se configure la clave de publicación.
3. **Escala:** las consultas administrativas siguen realizando varias peticiones por usuario/cuenta/préstamo; con más datos puede crecer el tiempo de carga.
4. **Regla HU9:** la API calcula y registra la distribución; no acredita esos intereses en las cuentas de ahorro. Confirmar que esa conducta coincide con el enunciado antes de presentarla como acreditación de saldo.

La verificación confirma las 10 historias y las reglas de acceso principales en una base aislada. No equivale a una auditoría de seguridad completa ni a una prueba de carga.

## Verificación incremental — 16 de noviembre de 2026

### Migración del token a JWT

- Se reemplazó el formato firmado propio por JWT estándar usando `jsonwebtoken` 9.0.3 y HS256.
- La API valida algoritmo, firma, emisor `cooperativa-api`, audiencia `cooperativa-app`, expiración de 8 horas, rol y versión de sesión. El identificador se transporta como `sub`; el correo no se incluye en el payload.
- `npm test`: 7 pruebas aprobadas, incluidas firma, expiración, audiencia, manipulación de token, rol y idempotencia.
- Prueba HTTP local con base temporal: login de estudiante respondió 200 y emitió un JWT con encabezado `typ=JWT`, `alg=HS256`; una ruta protegida aceptó el Bearer. La base `cooperativa_jwt_verificacion` se eliminó al terminar.
- `npm audit`: 0 vulnerabilidades conocidas después de fijar `nodemon` 3.1.11 en desarrollo.
- Android recibe el token como Bearer opaco, así que el contrato JSON de login no cambia. Las compilaciones Android debug/release se verificaron por separado; no fue necesario cambiar Retrofit.
- La app Android se sincronizó en versión 1.5.1 (`versionCode` 7) tanto en la carpeta usada por Android Studio como en `android/` del repositorio.

### Pendiente de publicación

El commit `875c69d` quedó publicado en `main`. `/api/health` respondió 200 y reportó API activa y MongoDB conectado tras la publicación. Esa ruta de salud por sí sola no identifica qué commit está corriendo; confirmar la versión desplegada en el historial de Render antes de dar por migrados los inicios de sesión. Al activarse el código nuevo, los tokens del formato previo serán rechazados y las personas deberán autenticarse de nuevo. No se requieren cambios ni limpieza de MongoDB para la migración.
