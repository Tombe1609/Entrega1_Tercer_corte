# Acceso, perfiles y reinicio de demostración

## Perfiles y permisos

Los permisos se validan en la API, además de ocultar módulos en Android. La propiedad `area` del funcionario se consulta en MongoDB en cada petición autenticada, por lo que el menú de la app no constituye la barrera de seguridad.

| Perfil | Alcance |
|---|---|
| Estudiante | Sus ahorros, movimientos, compras, solicitudes y datos personales. No puede leer el historial de otra persona ni la auditoría. |
| Miguel (`F004`, `solicitudes`) | Revisar, corregir, aprobar y rechazar solicitudes pendientes de creación de cuenta. |
| Diana (`F001`, `finanzas`) | Consultar socios, cuentas, movimientos y auditoría de cambios personales. |
| Jorge (`F002`, `creditos`) | Consultar préstamos, aprobar/desembolsar o rechazar solicitudes de crédito y gestionar productos. |
| Rector (`U011`) | Acceso general y administración de cuentas/funcionarios. |

Los cambios de correo, teléfono y nombre quedan en `auditoria_cuentas`, con anterior y nuevo valor. El cambio de contraseña registra el evento, pero nunca almacena la contraseña ni su hash en la auditoría. Las contraseñas se verifican contra hashes.

## Endpoints nuevos o relevantes

- `POST /api/solicitudes-cuenta`: público; solo acepta `@uniautonoma.edu.co`, valida campos y crea solicitud pendiente con contraseña hasheada. Limitado a 10 solicitudes por ventana de 15 minutos por IP.
- `GET /api/solicitudes-cuenta`: solo muestra solicitudes pendientes; las atendidas permanecen guardadas como historial y ya no ofrecen acciones.
- `PUT /api/solicitudes-cuenta/:id`: permite corregir nombre, documento, teléfono y correo de una solicitud pendiente. No permite editar contraseñas.
- `PATCH /api/solicitudes-cuenta/:id`: aprueba o rechaza la solicitud. Al completar la decisión deja de aparecer en la bandeja pendiente.
- `PATCH /api/gestion-usuarios/estudiantes/:usuario_id/estado`: solo rector; desactiva/reactiva la cuenta y revoca las sesiones existentes. No permite desactivar a alguien con saldo o préstamo pendiente.
- `DELETE /api/ahorros/:ahorro_id`: solo el dueño estudiante; cierra su cuenta si el saldo es cero y no tiene préstamos pendientes ni deuda. Conserva movimientos e historial.
- `PATCH /api/mi-perfil`: solo el estudiante autenticado; para cambiar el correo exige contraseña actual.
- `GET /api/auditoria-cuentas`: solo finanzas y rector.
- `GET /api/ahorros`, `GET /api/estudiantes`, movimientos globales y reportes financieros: finanzas y rector.
- `GET /api/prestamos`, aprobar/rechazar préstamos y gestionar productos: créditos y rector.

Las cuentas nuevas aprobadas nacen con saldo cero y una cuenta de ahorro nueva. La cuenta no se activa al enviar el formulario.

Todas las cuentas de estudiante, funcionario y rector deben usar `@uniautonoma.edu.co`. La migración de correos en Atlas conserva la parte local de cada dirección y revoca las sesiones anteriores. El respaldo cifrado queda en `%LOCALAPPDATA%\Cooperativa\backups`; para consultar la reversión en modo de solo lectura:

```powershell
node scripts/rollback-uniautonoma-emails.js "$env:LOCALAPPDATA\Cooperativa\backups\<archivo>.json.enc"
```

El script solo restaura al agregar `--apply` y solo si los correos no cambiaron después de la migración.

## Copia del reinicio de Atlas

El último cambio de datos actualizó los correos institucionales del rector y funcionarios; no modificó saldos, movimientos, préstamos, compras ni los datos de estudiantes.

Antes de aplicar, `scripts/reset-demo-atlas.js` creó una copia BSON cifrada AES-256-GCM y protegió la clave con Windows DPAPI (usuario de Windows actual). Archivos en `%LOCALAPPDATA%\Cooperativa\backups`. La copia se puede verificar en modo de solo lectura con:

```powershell
node scripts/restore-atlas-backup.js "$env:LOCALAPPDATA\Cooperativa\backups\<archivo>.bson.enc"
```

El script `restore-atlas-backup.js` restaura toda la base solo si se agrega `--apply`; no ejecutar esa opción salvo que realmente se quiera reemplazar Atlas por el estado previo.
