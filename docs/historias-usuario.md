# Historias de usuario y funcionalidades

Las diez historias derivan del proyecto original (`Proyecto_Cooperativa_MongoDB_corregido.txt`, HU1 a HU10). Cada una está implementada por los endpoints indicados y tiene su carpeta en la colección de Postman (`postman/cooperativa.postman_collection.json`). Las peticiones marcadas con ★ son las que se muestran en la sustentación.

## 1. Tabla de funcionalidades (formato del PDF, sección 11)

| N.º | Historia de usuario | Funcionalidad | Endpoint y método HTTP | Resultado esperado |
|---|---|---|---|---|
| 1 | Como administrador, quiero registrar un estudiante y consultar sus datos, para permitirle utilizar los servicios de ahorro y crédito educativo. | Registrar y consultar estudiantes | `POST /api/estudiantes`<br>`GET /api/estudiantes`<br>`GET /api/estudiantes/:usuario_id` | El estudiante queda guardado en la colección `usuarios` con un id nuevo (U012) y se puede consultar; los duplicados se rechazan con 409. |
| 2 | Como Rector, quiero registrar funcionarios con diferentes cargos, para delegar actividades administrativas de la cooperativa. | Registrar y consultar funcionarios | `POST /api/funcionarios`<br>`GET /api/funcionarios`<br>`GET /api/funcionarios/:funcionario_id` | El funcionario queda en la colección `funcionarios` (F006) con un cargo permitido; un cargo no permitido devuelve 400. |
| 3 | Como estudiante, quiero abrir una cuenta de ahorro, para depositar y administrar mi dinero dentro de la cooperativa. | Crear y consultar cuentas de ahorro | `POST /api/ahorros`<br>`GET /api/ahorros`<br>`GET /api/ahorros/:ahorro_id` | Se crea la cuenta A011 con saldo 0 asociada al estudiante; un estudiante inexistente devuelve 404 y una segunda cuenta devuelve 409. |
| 4 | Como estudiante, quiero realizar depósitos o retiros, para mantener actualizado mi saldo de ahorro y consultar los movimientos. | Depósitos y retiros con validación de saldo | `POST /api/ahorros/:ahorro_id/depositos`<br>`POST /api/ahorros/:ahorro_id/retiros`<br>`GET /api/ahorros/:ahorro_id/movimientos` | Depósito de 300.000 y retiro de 100.000 dejan saldo 200.000 y dos movimientos en el historial; un retiro mayor al saldo devuelve 400. |
| 5 | Como estudiante, quiero solicitar un préstamo indicando su finalidad educativa, para obtener financiación destinada exclusivamente a mis estudios. | Solicitar préstamos educativos con validaciones | `POST /api/prestamos`<br>`GET /api/fines-educativos`<br>`GET /api/prestamos/:prestamo_id` | Se crea el préstamo P009 con interés inicial del 5 % (50.000 sobre 1.000.000); monto superior al límite, estudiante o finalidad inexistentes y préstamo activo previo se rechazan. |
| 6 | Como funcionario, quiero calcular el interés del préstamo aplicando una tasa del 5 %, para conocer el valor total que debe pagar el estudiante. | Consultar el cálculo del interés del préstamo | `GET /api/prestamos/:prestamo_id/interes` | Para P003: interés 150.000 y total 3.150.000 (capital 3.000.000 + 5 %). |
| 7 | Como estudiante, quiero consultar mis préstamos y saldos pendientes, para conocer cuánto capital e interés debo. | Consultar préstamos y saldos pendientes de un estudiante | `GET /api/estudiantes/:usuario_id/prestamos` | Lista los préstamos del estudiante con su finalidad educativa, capital e interés pendientes y los totales. |
| 8 | Como estudiante, quiero realizar un pago y seleccionar si deseo abonarlo al capital o al interés, para controlar la forma en que disminuye mi deuda. | Pagos diferenciados a capital o interés | `POST /api/prestamos/:prestamo_id/pagos`<br>`GET /api/prestamos/:prestamo_id/pagos` | Abono a capital de 1.000.000 en P003: capital 2.000.000 e interés recalculado 100.000. Pago a interés de 50.000 en P008: interés baja a 100.000 y el capital no cambia. Ambos quedan en el historial. |
| 9 | Como sistema, quiero distribuir los intereses generados por los préstamos proporcionalmente entre los estudiantes ahorradores, para reconocer su participación en el fondo de la cooperativa. | Calcular y registrar la distribución proporcional de intereses | `GET /api/distribucion-intereses/calculo`<br>`POST /api/distribucion-intereses`<br>`GET /api/distribucion-intereses` | Cada ahorrador recibe saldo / total ahorrado × intereses generados; el periodo queda guardado en `distribucion_intereses` y no puede repetirse (409). |
| 10 | Como Rector, quiero consultar estadísticas de ahorros, préstamos, pagos e intereses, para supervisar el funcionamiento de la cooperativa. | Estadísticas y reportes administrativos | `GET /api/reportes/estadisticas` | Devuelve cantidad de estudiantes, total ahorrado, préstamos, capital e intereses pendientes, pagos por tipo, intereses distribuidos y rankings. |

## 2. Historias de usuario

**HU1.** Como administrador, quiero registrar un estudiante y consultar sus datos, para permitirle utilizar los servicios de ahorro y crédito educativo.

- Funcionalidad: Registrar y consultar estudiantes.
- Endpoints: `POST /api/estudiantes`, `GET /api/estudiantes`, `GET /api/estudiantes/:usuario_id`

**HU2.** Como Rector, quiero registrar funcionarios con diferentes cargos, para delegar actividades administrativas de la cooperativa.

- Funcionalidad: Registrar y consultar funcionarios.
- Endpoints: `POST /api/funcionarios`, `GET /api/funcionarios`, `GET /api/funcionarios/:funcionario_id`

**HU3.** Como estudiante, quiero abrir una cuenta de ahorro, para depositar y administrar mi dinero dentro de la cooperativa.

- Funcionalidad: Crear y consultar cuentas de ahorro.
- Endpoints: `POST /api/ahorros`, `GET /api/ahorros`, `GET /api/ahorros/:ahorro_id`

**HU4.** Como estudiante, quiero realizar depósitos o retiros, para mantener actualizado mi saldo de ahorro y consultar los movimientos.

- Funcionalidad: Depósitos y retiros con validación de saldo.
- Endpoints: `POST /api/ahorros/:ahorro_id/depositos`, `POST /api/ahorros/:ahorro_id/retiros`, `GET /api/ahorros/:ahorro_id/movimientos`

**HU5.** Como estudiante, quiero solicitar un préstamo indicando su finalidad educativa, para obtener financiación destinada exclusivamente a mis estudios.

- Funcionalidad: Solicitar préstamos educativos con validaciones.
- Endpoints: `POST /api/prestamos`, `GET /api/fines-educativos`, `GET /api/prestamos/:prestamo_id`

**HU6.** Como funcionario, quiero calcular el interés del préstamo aplicando una tasa del 5 %, para conocer el valor total que debe pagar el estudiante.

- Funcionalidad: Consultar el cálculo del interés del préstamo.
- Endpoints: `GET /api/prestamos/:prestamo_id/interes`

**HU7.** Como estudiante, quiero consultar mis préstamos y saldos pendientes, para conocer cuánto capital e interés debo.

- Funcionalidad: Consultar préstamos y saldos pendientes de un estudiante.
- Endpoints: `GET /api/estudiantes/:usuario_id/prestamos`

**HU8.** Como estudiante, quiero realizar un pago y seleccionar si deseo abonarlo al capital o al interés, para controlar la forma en que disminuye mi deuda.

- Funcionalidad: Pagos diferenciados a capital o interés.
- Endpoints: `POST /api/prestamos/:prestamo_id/pagos`, `GET /api/prestamos/:prestamo_id/pagos`

**HU9.** Como sistema, quiero distribuir los intereses generados por los préstamos proporcionalmente entre los estudiantes ahorradores, para reconocer su participación en el fondo de la cooperativa.

- Funcionalidad: Calcular y registrar la distribución proporcional de intereses.
- Endpoints: `GET /api/distribucion-intereses/calculo`, `POST /api/distribucion-intereses`, `GET /api/distribucion-intereses`

**HU10.** Como Rector, quiero consultar estadísticas de ahorros, préstamos, pagos e intereses, para supervisar el funcionamiento de la cooperativa.

- Funcionalidad: Estadísticas y reportes administrativos.
- Endpoints: `GET /api/reportes/estadisticas`

## 3. Guía para la sustentación (10 funcionalidades, 5 minutos)

Para cada funcionalidad: 1) decir la historia de usuario, 2) indicar método y endpoint, 3) ejecutar la petición ★ en Postman, 4) mostrar la respuesta y el código HTTP, 5) verificar en MongoDB Compass. Los datos corresponden a una base separada recién inicializada con `npm run seed` y a ejecutar las funcionalidades en este orden (HU1 → HU10). En Postman ejecuta primero `00 - Verificación`: consulta health, comprueba el rechazo sin token e inicia sesión con la cuenta demo de rector para guardar `{{token}}`. No ejecutes la colección contra la base original que quieras conservar.

### HU1 - Registrar y consultar estudiantes

- **Necesidad que resuelve:** registrar un estudiante y consultar sus datos, para permitirle utilizar los servicios de ahorro y crédito educativo.
- **Petición:** `POST /api/estudiantes`
- **Cuerpo JSON:** `{ "nombre": "Daniel Esteban Molina", "documento": "1001001012", "telefono": "3001111012", "email": "daniel.molina@universidad.edu.co" }`
- **Resultado a observar:** 201. `data.usuario_id` = "U012", tipo "estudiante", estado "activo".
- **Verificar en Compass:** usuarios → `{ "usuario_id": "U012" }`

### HU2 - Registrar y consultar funcionarios

- **Necesidad que resuelve:** registrar funcionarios con diferentes cargos, para delegar actividades administrativas de la cooperativa.
- **Petición:** `POST /api/funcionarios`
- **Cuerpo JSON:** `{ "nombre": "Natalia Marcela Gómez", "cargo": "Coordinador de cartera", "telefono": "3102001006", "email": "natalia.gomez@universidad.edu.co" }`
- **Resultado a observar:** 201. `data.funcionario_id` = "F006", estado "activo".
- **Verificar en Compass:** funcionarios → `{ "funcionario_id": "F006" }`

### HU3 - Crear y consultar cuentas de ahorro

- **Necesidad que resuelve:** abrir una cuenta de ahorro, para depositar y administrar mi dinero dentro de la cooperativa.
- **Petición:** `POST /api/ahorros`
- **Cuerpo JSON:** `{ "usuario_id": "U012" }`
- **Resultado a observar:** 201. `data.ahorro_id` = "A011", `saldo` = 0.
- **Verificar en Compass:** ahorros → `{ "ahorro_id": "A011" }`

### HU4 - Depósitos y retiros con validación de saldo

- **Necesidad que resuelve:** realizar depósitos o retiros, para mantener actualizado mi saldo de ahorro y consultar los movimientos.
- **Petición:** `POST /api/ahorros/A011/depositos y POST /api/ahorros/A011/retiros`
- **Cuerpo JSON:** `{ "valor": 300000 }  y luego  { "valor": 100000 }`
- **Resultado a observar:** 201 en ambos. `saldo_actual` = 300000 y después 200000. Un retiro de 5000000 responde 400 (saldo insuficiente).
- **Verificar en Compass:** movimientos_ahorro → `{ "ahorro_id": "A011" }` (M014 y M015) y ahorros A011 con saldo 200000

### HU5 - Solicitar préstamos educativos con validaciones

- **Necesidad que resuelve:** solicitar un préstamo indicando su finalidad educativa, para obtener financiación destinada exclusivamente a mis estudios.
- **Petición:** `POST /api/prestamos`
- **Cuerpo JSON:** `{ "usuario_id": "U009", "fin_id": "FE009", "monto": 1000000 }`
- **Resultado a observar:** 201. `prestamo_id` = "P009", `interes_inicial` = 50000, `tasa_interes` = 0.05. Repetir la petición responde 409.
- **Verificar en Compass:** prestamos → `{ "prestamo_id": "P009" }`

### HU6 - Consultar el cálculo del interés del préstamo

- **Necesidad que resuelve:** calcular el interés del préstamo aplicando una tasa del 5 %, para conocer el valor total que debe pagar el estudiante.
- **Petición:** `GET /api/prestamos/P003/interes`
- **Cuerpo JSON:** (sin cuerpo)
- **Resultado a observar:** 200. `sobre_capital_inicial`: interés 150000 y total 3150000.
- **Verificar en Compass:** prestamos → P003 (no cambia: es solo consulta)

### HU7 - Consultar préstamos y saldos pendientes de un estudiante

- **Necesidad que resuelve:** consultar mis préstamos y saldos pendientes, para conocer cuánto capital e interés debo.
- **Petición:** `GET /api/estudiantes/U003/prestamos`
- **Cuerpo JSON:** (sin cuerpo)
- **Resultado a observar:** 200. P003 con finalidad "Compra de libros", capital pendiente 3000000 e interés pendiente 150000 (si HU8 ya se ejecutó: 2000000 y 100000).
- **Verificar en Compass:** prestamos → `{ "usuario_id": "U003" }`

### HU8 - Pagos diferenciados a capital o interés

- **Necesidad que resuelve:** realizar un pago y seleccionar si deseo abonarlo al capital o al interés, para controlar la forma en que disminuye mi deuda.
- **Petición:** `POST /api/prestamos/P003/pagos y POST /api/prestamos/P008/pagos`
- **Cuerpo JSON:** `{ "tipo_abono": "capital", "valor": 1000000 }  y  { "tipo_abono": "interes", "valor": 50000 }`
- **Resultado a observar:** 201 en ambos. P003: capital 2000000 e interés 100000. P008: capital 3000000 (sin cambio) e interés 100000.
- **Verificar en Compass:** prestamos P003 y P008; pagos_prestamo → PG004 y PG005

### HU9 - Calcular y registrar la distribución proporcional de intereses

- **Necesidad que resuelve:** distribuir los intereses generados por los préstamos proporcionalmente entre los estudiantes ahorradores, para reconocer su participación en el fondo de la cooperativa.
- **Petición:** `POST /api/distribucion-intereses`
- **Cuerpo JSON:** `{ "periodo": "2026-04", "intereses_generados": 500000 }`
- **Resultado a observar:** 201. Un registro por ahorrador; cada `interes_recibido` = saldo / total ahorrado × 500000. Repetir el periodo responde 409.
- **Verificar en Compass:** distribucion_intereses → `{ "periodo": "2026-04" }`

### HU10 - Estadísticas y reportes administrativos

- **Necesidad que resuelve:** consultar estadísticas de ahorros, préstamos, pagos e intereses, para supervisar el funcionamiento de la cooperativa.
- **Petición:** `GET /api/reportes/estadisticas`
- **Cuerpo JSON:** (sin cuerpo)
- **Resultado a observar:** 200. Estudiantes, total ahorrado, préstamos, capital e intereses pendientes, pagos por tipo, intereses distribuidos y rankings.
- **Verificar en Compass:** Comparar totales con las colecciones ahorros, prestamos y pagos_prestamo

