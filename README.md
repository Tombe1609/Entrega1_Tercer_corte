# Cooperativa Universitaria

Proyecto académico con tres clientes: aplicación Android, portal web React y API REST en **Node.js/Express** con persistencia en **MongoDB**. La API centraliza autenticación, permisos y reglas de ahorros, transferencias, préstamos, cuotas, productos y compras.

**Integrantes:** Cristian David Tombe Yalanda · Laura Sofia Salazar Sandoval

## 1. Tecnologías

- Node.js 18 o superior (recomendado 20 o 22 LTS)
- Express 4 (API en puerto 3000 y servidor web estático en puerto 4000)
- React 18 y Vite (interfaz web)
- CORS con lista permitida de orígenes configurada en `CORS_ORIGINS`
- MongoDB Atlas + driver oficial `mongodb`
- `dotenv` (variables de entorno) y `nodemon` (solo desarrollo)
- Sin librerías de validación: las validaciones están en `src/utils/validadores.js`.

## 2. Requisitos previos (Windows)

1. [Node.js LTS](https://nodejs.org) (incluye npm). Compruebe con `node -v` y `npm -v`.
2. Un clúster disponible en [MongoDB Atlas](https://cloud.mongodb.com/).
3. [Postman](https://www.postman.com/downloads/) (o Thunder Client).
4. Visual Studio Code y Git (para publicar en GitHub).

## 3. Instalación paso a paso

```powershell
npm install
copy .env.example .env
```

## 4. Configuración de `.env`

Edite `.env` (ver `.env.example`):

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto de la API | `3000` |
| `MONGODB_URI` | URI de conexión MongoDB Atlas | Obligatoria; no se usa MongoDB local por defecto |
| `MONGODB_PASSWORD` | Contraseña del usuario Atlas cuando la URI contiene `<db_password>` | Obligatoria si se usa el marcador; se codifica automáticamente para la URI |
| `DB_NAME` | Base de datos | `cooperativa_universitaria` |
| `NODE_ENV` | `production` oculta detalles de errores internos | `development` |
| `LIMITE_PRESTAMO` | Monto máximo por préstamo | `5000000` |
| `AUTH_TOKEN_SECRET` | Secreto privado para firmar tokens de sesión | Obligatorio en producción; usa una cadena aleatoria larga |

El archivo `.env` está en `.gitignore`: no se sube a GitHub. Guarde allí la URI de Atlas y no comparta credenciales.

## 5. Configuración y conexión de MongoDB

- **MongoDB Atlas** ya funciona como replica set y permite transacciones. Autorice la IP del equipo y use la URI seed list de los tres nodos con `tls=true`, `authSource=admin` y el nombre del replica set. Esta configuración evita depender de consultas DNS SRV, que pueden estar bloqueadas en algunas redes. El marcador `<db_password>` se reemplaza desde `MONGODB_PASSWORD` y se codifica automáticamente.

Al iniciar, la API informa si detectó transacciones ("ACTIVADAS") o no; ambos casos son válidos.

## 6. Inicialización de los datos

```powershell
npm run seed
```

`database/seed.js` crea las 8 colecciones (`usuarios`, `funcionarios`, `ahorros`, `movimientos_ahorro`, `fines_educativos`, `prestamos`, `pagos_prestamo`, `distribucion_intereses`), los índices únicos y los datos iniciales del TXT (11 usuarios, 5 funcionarios, 10 cuentas, 13 movimientos, 9 finalidades, 8 préstamos, 3 pagos, 10 distribuciones). Se puede ejecutar varias veces: solo inserta lo que falta, **no borra ni modifica** nada. Es independiente de la API.

## 7. Iniciar el servidor

```powershell
npm start        # o: npm run dev  (reinicia con cada cambio)
```

## 8. URL local

`http://localhost:3000` · comprobación: `GET http://localhost:3000/api/health`

La interfaz web complementaria y sus instrucciones de ejecución están en [`README_WEB.md`](README_WEB.md). Durante desarrollo usa Vite en `http://localhost:5173` y el proxy comparte la API de este servidor.

Todas las respuestas son JSON: `{ "success": true|false, "message": "...", "data": {...} }`. Los errores incluyen `message` (y `errors` con la lista de campos inválidos en los 400).

Códigos usados: **200** consulta correcta · **201** recurso creado · **400** datos inválidos o regla de negocio incumplida (saldo insuficiente, pago mayor a la deuda, monto sobre el límite) · **404** recurso inexistente · **409** duplicado o conflicto (documento/correo repetido, cuenta ya existente, préstamo activo previo, periodo ya distribuido) · **500** error interno o MongoDB no disponible.

## 9. Endpoints

La app Android consume esta API REST propia. En el emulador usa como URL base `http://10.0.2.2:3000/`; en un dispositivo físico de la misma red usa la IP local del computador. La URL pública de producción aún se debe definir después del despliegue en la nube (requisito de la entrega). El mapa detallado de rutas Android está también en el README raíz de la app.

La API usa MongoDB como persistencia, con las colecciones y relaciones descritas en [`docs/mongodb.md`](docs/mongodb.md). El estado de la base local revisada y sus diferencias frente al seed también están documentados allí.

La autenticación obligatoria, propiedad de recursos y permisos por rol se describen en [`docs/seguridad-api.md`](docs/seguridad-api.md). Solo `/api/health` y `POST /api/auth/login` son públicos.

Las **10 funcionalidades** que se demuestran son HU1-HU10 (detalle y guía en [`docs/historias-usuario.md`](docs/historias-usuario.md)). Los endpoints marcados "apoyo" solo complementan esas funcionalidades.

| HU | Método | Endpoint | Descripción | Códigos |
|---|---|---|---|---|
| - | POST | `/api/auth/login` | Iniciar sesión y obtener token Bearer | 200, 400, 401 |
| 1 | POST | `/api/estudiantes` | Registrar estudiante (id U### automático) | 201, 400, 409 |
| 1 | GET | `/api/estudiantes?estado=` | Listar estudiantes | 200, 400 |
| 1 | GET | `/api/estudiantes/:usuario_id` | Consultar un estudiante | 200, 400, 404 |
| 2 | POST | `/api/funcionarios` | Registrar funcionario con cargo permitido | 201, 400, 409 |
| 2 | GET | `/api/funcionarios?cargo=&estado=` | Listar funcionarios | 200, 400 |
| 2 | GET | `/api/funcionarios/:funcionario_id` | Consultar un funcionario | 200, 400, 404 |
| 3 | POST | `/api/ahorros` | Abrir cuenta de ahorro (saldo 0) | 201, 400, 404, 409 |
| 3 | GET | `/api/ahorros` | Listar cuentas | 200 |
| 3 | GET | `/api/ahorros/:ahorro_id` | Consultar cuenta | 200, 400, 404 |
| 4 | POST | `/api/ahorros/:ahorro_id/depositos` | Depositar | 201, 400, 404 |
| 4 | POST | `/api/ahorros/:ahorro_id/retiros` | Retirar (valida saldo) | 201, 400, 404 |
| - | POST | `/api/ahorros/transferencias` | Transferir entre estudiantes (mínimo 1.000, máximo 5.000.000) | 201, 400, 403, 404 |
| 4 | GET | `/api/ahorros/:ahorro_id/movimientos?tipo=` | Historial de movimientos | 200, 400, 404 |
| 5 | POST | `/api/prestamos` | Solicitud pendiente con plazo de 1–3 meses y primera fecha de pago; admite `producto_id` | 201, 400, 404, 409 |
| 5 | POST | `/api/prestamos/:prestamo_id/aprobar` | Funcionario/rector aprueba y desembolsa; actualiza ahorro y movimiento | 200, 403, 404, 409 |
| 5 | GET | `/api/fines-educativos` | (apoyo) Finalidades válidas | 200 |
| - | GET | `/api/productos` | Catálogo activo para estudiantes; catálogo completo para administración | 200 |
| - | POST | `/api/productos` | Crear artículo o servicio (funcionario/rector) | 201, 400 |
| - | PATCH | `/api/productos/:producto_id` | Editar nombre, categoría, descripción, precio y vigencia (funcionario/rector); protege solicitudes de financiación pendientes | 200, 400, 403, 404, 409 |
| - | PATCH | `/api/productos/:producto_id/estado` | Cerrar o reactivar una publicación dentro de su vigencia | 200, 403, 404, 409 |
| - | POST | `/api/productos/:producto_id/compras` | Comprar desde ahorros y registrar el débito | 201, 400, 404 |
| - | GET | `/api/productos/compras/mias` | Consultar compras del estudiante y bloquear compras repetidas | 200 |
| 5 | GET | `/api/prestamos/:prestamo_id` | (apoyo) Consultar un préstamo | 200, 400, 404 |
| 6 | GET | `/api/prestamos/:prestamo_id/interes` | Calcular interés y total | 200, 400, 404 |
| 7 | GET | `/api/estudiantes/:usuario_id/prestamos?estado=` | Solicitudes, préstamos y saldos pendientes (`pendiente`, `activo`, `pagado`) | 200, 400, 404 |
| 8 | POST | `/api/prestamos/:prestamo_id/cuotas/:numero/pagar` | Pagar cuota mensual desde ahorros | 201, 400, 403, 409 |
| 8 | GET | `/api/prestamos/:prestamo_id/pagos` | Historial de pagos | 200, 400, 404 |
| 9 | GET | `/api/distribucion-intereses/calculo?intereses_generados=` | Calcular distribución (no guarda) | 200, 400 |
| 9 | POST | `/api/distribucion-intereses` | Calcular y guardar un periodo | 201, 400, 409 |
| 9 | GET | `/api/distribucion-intereses?periodo=&usuario_id=` | Consultar distribuciones guardadas | 200, 400 |
| 10 | GET | `/api/reportes/estadisticas` | Estadísticas para el rector | 200 |
| - | GET | `/api/health` | (apoyo) Estado de API y MongoDB | 200, 500 |

## 10. Historias de usuario

Las diez historias, con el formato "Como [rol], quiero [acción], para [beneficio]" y sus endpoints, están en [`docs/historias-usuario.md`](docs/historias-usuario.md).

El resultado reciente de compilación y pruebas funcionales está en [`docs/verificacion.md`](docs/verificacion.md); incluye los hallazgos que todavía deben resolverse antes de producción.

## 11. Reglas financieras aplicadas

- Tasa de interés fija del **5 %**: interés inicial = capital × 0,05.
- Un préstamo exige estudiante activo y finalidad educativa activa; monto > 0 y ≤ `LIMITE_PRESTAMO`; un solo préstamo activo por estudiante (reglas de ejemplo del TXT, HU5).
- Depósito suma al saldo; retiro solo si `saldo >= valor`. No se aceptan valores negativos, cero, texto ni más de 2 decimales.
- **Pago a capital:** `capital_pendiente -= valor` e `interes_pendiente = nuevo capital × tasa`; si ambos quedan en 0 el préstamo pasa a `pagado`.
- **Pago a interés:** `interes_pendiente -= valor`; el capital no cambia. No puede superar el interés pendiente.
- Cada pago y cada movimiento queda en su historial (`pagos_prestamo`, `movimientos_ahorro`) junto con el cambio de saldo.
- **Distribución:** `participacion = saldo / total ahorrado` (cuentas activas con saldo > 0) e `interes_recibido = participacion × intereses_generados`, redondeado a 2 decimales. Solo se **registra** en `distribucion_intereses` para los estudiantes ahorradores: no modifica saldos ni se cuenta como ganancia de la cooperativa. Si el redondeo deja un desfase de centavos se informa en `diferencia_por_redondeo`; no se ajusta en silencio.

### Inconsistencias y ambigüedades del TXT (documentadas, no ocultadas)

1. **P001:** el pago PG001 abonó 20.000 a interés, pero `interes_pendiente` sigue en 50.000 (debería ser 30.000).
2. **P006:** `interes_pendiente` = 15.000 frente a `interes_inicial` = 25.000, sin ningún pago registrado que explique los 10.000. Ambos datos se **conservan tal cual**; no impiden el funcionamiento y el reporte de estadísticas los suma como están.
3. El TXT inserta en HU9 solo dos filas (DI011, DI012) como ejemplo parcial del periodo 2026-04. No se cargan como datos iniciales (se consideran ejemplo); el periodo 2026-04 se genera completo desde la API.
4. Un abono a capital recalcula el interés sobre el nuevo capital (regla del TXT), por lo que descarta abonos previos a interés de ese préstamo.
5. HU1-HU5 del TXT usan identificadores y fechas fijas (U012, A011, M014, P009...). La API genera el siguiente identificador libre con el mismo formato y usa la fecha/hora actual.
6. El TXT usa `$lookup` y `$avg`; la API obtiene el mismo resultado con una segunda consulta y total ÷ cantidad.

## 12. Pruebas con Postman

1. En una terminal del backend, prepara una base desechable y ejecuta la API en el puerto 3001:
   ```powershell
   $env:DB_NAME = "cooperativa_postman_demo"
   $env:PORT = "3001"
   $env:DEMO_LOGIN_PASSWORD = "use-una-clave-local-de-al-menos-12-caracteres"
   npm run seed
   npm run seed:login-demo
   npm start
   ```
2. En Postman: **Import** → `postman/cooperativa.postman_collection.json`; configura `baseUrl` como `http://localhost:3000` y `demoLoginPassword` con la misma contraseña local definida para `DEMO_LOGIN_PASSWORD`.
3. Ejecuta `00 - Verificación` primero para comprobar health, el rechazo 401 sin token, el control de propiedad y obtener un token rector. Luego ejecuta las carpetas en orden (HU1 → HU10), o **Run collection**. El token se guarda automáticamente en `{{token}}`; los IDs se guardan en variables de colección.
4. Las peticiones con ★ son las 10 demostraciones (HU4 y HU8 usan dos).
5. **Reproducibilidad:** la colección crea datos (U012, F006, A011, P009, PG004-PG005, distribución 2026-04). Para repetirla cambia `DB_NAME` a un nombre nuevo y vuelve a ejecutar seed y credenciales. No borres `cooperativa_universitaria` ni otra base que quieras conservar.

   `DEMO_LOGIN_PASSWORD` es solo para el entorno local de demostración; no publiques ni reutilices esa contraseña. Los datos de `database/datos-iniciales.js` son registros ficticios de ejemplo.

## 13. Comprobar la persistencia en MongoDB Compass

1. Conéctese a `mongodb://127.0.0.1:27017` (o a su URI) y abra `cooperativa_postman_demo`.
2. Después de cada petición de escritura abra la colección y use el filtro indicado en `docs/historias-usuario.md` (por ejemplo `{ "usuario_id": "U012" }` en `usuarios`). Pulse **Refresh** si no aparece.

## 14. Problemas frecuentes

| Problema | Solución |
|---|---|
| `No se pudo conectar con MongoDB` | Revise la URI `MONGODB_URI`, el usuario de base de datos y la IP permitida en Atlas. |
| `npm` no se reconoce | Instale Node.js y abra una terminal nueva. |
| PowerShell bloquea `npm` por política de ejecución | Use `npm.cmd install` o el CMD, o ejecute `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. |
| `EADDRINUSE` (puerto en uso) | Cambie `PORT` en `.env` y la variable `baseUrl` de la colección de Postman. |
| Todas las peticiones de creación dan 409 | Ya se ejecutó la colección: usa un nombre nuevo en `DB_NAME` y vuelve a ejecutar seed y credenciales demo. |
| Variables `{{ahorro_nuevo}}` vacías en Postman | Falló la petición anterior que las crea; ejecute las carpetas en orden. |
| "Transacciones: no disponibles" | No es un error: MongoDB corre como servidor único (ver sección 5 para replica set). |
| El seed informa conflictos de índices únicos | Hay datos previos con el mismo documento/correo; revise la colección o use otra `DB_NAME`. |
| Error 500 | Revise la consola donde corre `npm start`; con `NODE_ENV=development` la respuesta incluye `detalle`. |

## 15. Publicar en GitHub

```powershell
git init
git add .
git status          # verifique que NO aparezca .env ni node_modules
git commit -m "API REST Cooperativa Universitaria"
git branch -M main
git remote add origin https://github.com/<usuario>/<repositorio>.git
git push -u origin main
```

Cree antes el repositorio en github.com (New repository) como **Public** y sin README. Abra la URL en una ventana privada para comprobar que es accesible y envíe el enlace a `diego.prado.o@uniautonoma.edu.co` antes de la fecha límite.

## 16. Demostración de máximo 5 minutos

- **Antes (no cuenta en el tiempo):** base reiniciada y `npm run seed`, API iniciada, colección importada, Compass abierto en `cooperativa_universitaria`.
- **Reparto (todos participan):** Cristian HU1-HU5, Laura HU6-HU10. Aprox. 30 s por funcionalidad.
- **Cada funcionalidad:** decir la historia → indicar método y endpoint → ejecutar la petición ★ → mostrar cuerpo, respuesta y código → verificar en Compass (en HU1-5, 8 y 9; HU6, 7 y 10 son consultas).
- Un error rápido por cada integrante (por ejemplo un retiro mayor al saldo en HU4 o un pago mayor a la deuda en HU8) solo si sobra tiempo.
- Guía completa por funcionalidad: [`docs/historias-usuario.md`](docs/historias-usuario.md#3-guía-para-la-sustentación-10-funcionalidades-5-minutos).

## Estructura

```
/
├── android/  app Android con Kotlin y Jetpack Compose
├── web/      portal React/Vite y servidor Express independiente
├── src/      API Express: config, routes, controllers, services y middlewares
├── database/ seeds de demostración
├── postman/  colección de solicitudes API
├── docs/     historias, arquitectura, MongoDB y seguridad
└── .env.example, package.json, README.md
```

Para ejecutar los dos servidores web, consulta [README_WEB.md](README_WEB.md). La guía Android está en [android/README.md](android/README.md).

Flujo de una petición: `routes` → `controllers` (validan la entrada) → `services` (reglas de negocio y MongoDB) → respuesta JSON; cualquier error llega a `middlewares/errorHandler.js`.
