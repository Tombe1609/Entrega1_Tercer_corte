# MongoDB: estructura y estado revisado

## Base y colecciones

La API usa la base `cooperativa_universitaria` por defecto (`DB_NAME`) y estas colecciones:

| Colección | Identificador de negocio | Propósito |
|---|---|---|
| `usuarios` | `usuario_id` (`U###`) | Estudiantes y sus datos de acceso |
| `funcionarios` | `funcionario_id` (`F###`) | Funcionarios y sus datos de acceso |
| `ahorros` | `ahorro_id` (`A###`) | Una cuenta de ahorro vinculada a un estudiante |
| `movimientos_ahorro` | `movimiento_id` (`M###`) | Depósitos, retiros y depósitos de desembolso vinculados a una cuenta |
| `fines_educativos` | `fin_id` (`FE###`) | Catálogo de finalidades de préstamo |
| `prestamos` | `prestamo_id` (`P###`) | Préstamo, estudiante, finalidad y saldos |
| `pagos_prestamo` | `pago_id` (`PG###`) | Pagos de capital o intereses vinculados a préstamos |
| `distribucion_intereses` | `distribucion_id`/periodo | Registros calculados de distribución por periodo y ahorrador |

## Relaciones

```text
usuarios.usuario_id ──< ahorros.usuario_id ──< movimientos_ahorro.ahorro_id
        │
        ├──< prestamos.usuario_id >── fines_educativos.fin_id
        │             └──< pagos_prestamo.prestamo_id
        └──< distribucion_intereses.usuario_id
```

MongoDB no crea claves foráneas entre estas colecciones. La API valida esas referencias al crear operaciones. Por eso es importante conservar las validaciones y no insertar documentos relacionados directamente sin comprobar sus IDs.

### Solicitud y desembolso de préstamos

Una solicitud nueva se guarda en `prestamos` con `estado: "pendiente"`; no afecta el saldo de ahorro. Al aprobarla, la API cambia el préstamo a `activo` y añade `fecha_desembolso` y `desembolsado_por`, incrementa `ahorros.saldo` y crea en `movimientos_ahorro` un depósito con descripción `Desembolso del préstamo P###`. Estos cambios se confirman juntos; una solicitud pendiente no se puede pagar y una segunda aprobación responde 409 sin duplicar el movimiento.

El catálogo se almacena en `productos` con `fecha_inicio` opcional y `fecha_fin` obligatoria. La lista y el pago respetan las fechas. `usuarios_compradores` se actualiza atómicamente para que el mismo estudiante no pueda comprar dos veces el mismo producto. Las compras completadas se almacenan en `compras`. Comprar descuenta el ahorro y registra un movimiento de retiro dentro de la misma operación. Las transferencias entre usuarios escriben un retiro en origen y un depósito en destino; el saldo de ambas cuentas y sus dos movimientos deben quedar confirmados juntos. Las cuotas se guardan como arreglo dentro de cada préstamo; pagar una cuota reduce ahorros, registra el pago y el movimiento, y actualiza la deuda en una operación coordinada. Una financiación de producto guarda su `producto_id`; antes de desembolsar, el funcionario verifica que siga vigente y que el estudiante aún no lo haya comprado.

## Estado de Atlas

La API ahora usa la base `cooperativa_universitaria` en MongoDB Atlas. El 6 de noviembre de 2026 se migraron las ocho colecciones y sus índices desde MongoDB local. Se verificaron los conteos antes y después; la copia local se conserva como respaldo y la API no se conecta a ella.

## Revisión de la base disponible

Revisión de solo lectura realizada el 28 de octubre de 2026. No se mostraron campos personales ni se modificaron documentos.

| Colección | Documentos revisados |
|---|---:|
| `usuarios` | 14 |
| `funcionarios` | 5 |
| `ahorros` | 12 |
| `movimientos_ahorro` | 15 |
| `fines_educativos` | 9 |
| `prestamos` | 8 |
| `pagos_prestamo` | 4 |
| `distribucion_intereses` | 10 |

Las cantidades de `usuarios`, `ahorros` y `pagos_prestamo` son mayores que las cantidades indicadas para la carga inicial en el README (11, 10 y 3). Además, entre la primera lectura de esta revisión y la última, `usuarios` pasó de 13 a 14, `ahorros` de 11 a 12 y `movimientos_ahorro` de 13 a 15. Nuestras pruebas de escritura se dirigieron a `cooperativa_verificacion` y la app solo hizo login y lecturas; no se atribuye aquí ese cambio a una acción concreta. Conserva estos datos y usa una base separada para repetir la demostración.

También se comprobó, mediante consultas agregadas, que las referencias revisadas entre cuentas, movimientos, estudiantes, finalidades, préstamos, pagos y distribuciones no tienen documentos huérfanos, y que los identificadores de negocio revisados no están duplicados.

## Repetir pruebas sin arriesgar los datos actuales

La base aislada `cooperativa_universitaria_demo` ya fue creada en MongoDB local. Recibió el seed inicial (11 usuarios, 5 funcionarios, 10 cuentas, 13 movimientos, 8 préstamos, 3 pagos y 10 distribuciones) y credenciales temporales de demostración. La base original `cooperativa_universitaria` no se modificó.

Para iniciar el backend desde PowerShell contra la base de demostración:

```powershell
$env:DB_NAME = "cooperativa_universitaria_demo"
npm run seed
npm run seed:login-demo
npm start
```

Define `DEMO_LOGIN_PASSWORD` localmente (mínimo 12 caracteres) antes de ejecutar `npm run seed:login-demo`; el script no incluye una contraseña fija. En Postman, configura la variable `demoLoginPassword` con el mismo valor. Por ejemplo, el rector de demostración inicia con `rector@universidad.edu.co`. Es solo para desarrollo local y no debe usarse en despliegue. El seed es idempotente, pero las historias de creación pueden dar 409 si ya fueron ejecutadas; conserva la base o usa otra base aparte para repetir desde cero.

Verifica `GET /api/health`, importa la colección de Postman y realiza las historias en el orden indicado en [`historias-usuario.md`](historias-usuario.md).

No compartas `.env`, credenciales de Atlas ni datos de acceso. `.env.example` contiene nombres de variables y valores ilustrativos; crea tu `.env` local y mantenlo fuera del repositorio.
