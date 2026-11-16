# Acceso, perfiles y reinicio de demostración

## Perfiles y permisos

Los permisos se validan en la API, además de ocultar módulos en Android. La propiedad `area` del funcionario se consulta en MongoDB en cada petición autenticada, por lo que el menú de la app no constituye la barrera de seguridad.

| Perfil | Alcance |
|---|---|
| Estudiante | Sus ahorros, movimientos, compras, solicitudes y datos personales. No puede leer el historial de otra persona ni la auditoría. |
| Miguel (`F004`, `solicitudes`) | Revisar, aprobar y rechazar solicitudes de creación de cuenta. |
| Diana (`F001`, `finanzas`) | Consultar socios, cuentas, movimientos y auditoría de cambios personales. |
| Jorge (`F002`, `creditos`) | Consultar préstamos, aprobar/desembolsar o rechazar solicitudes de crédito y gestionar productos. |
| Rector (`U011`) | Acceso general y administración de cuentas/funcionarios. |

Los cambios de correo, teléfono y nombre quedan en `auditoria_cuentas`, con anterior y nuevo valor. El cambio de contraseña registra el evento, pero nunca almacena la contraseña ni su hash en la auditoría. Las contraseñas se verifican contra hashes.

## Endpoints nuevos o relevantes

- `POST /api/solicitudes-cuenta`: público; solo acepta `@uniautonoma.edu.co`, valida campos y crea solicitud pendiente con contraseña hasheada. Limitado a 10 solicitudes por ventana de 15 minutos por IP.
- `GET /api/solicitudes-cuenta` y `PATCH /api/solicitudes-cuenta/:id`: solo `solicitudes` y rector.
- `PATCH /api/mi-perfil`: solo el estudiante autenticado; para cambiar el correo exige contraseña actual.
- `GET /api/auditoria-cuentas`: solo finanzas y rector.
- `GET /api/ahorros`, `GET /api/estudiantes`, movimientos globales y reportes financieros: finanzas y rector.
- `GET /api/prestamos`, aprobar/rechazar préstamos y gestionar productos: créditos y rector.

Las cuentas nuevas aprobadas nacen con saldo cero y una cuenta de ahorro nueva. La cuenta no se activa al enviar el formulario.

## Copia del reinicio de Atlas

El reinicio ejecutado conservó a Laura (`U014`), Cristian (`U013`), Ricardo (`U011`) y a los tres funcionarios anteriores; dejó dos ahorros en cero, vació préstamos, pagos, compras, movimientos y distribuciones; conservó productos y finalidades educativas.

Antes de aplicar, `scripts/reset-demo-atlas.js` creó una copia BSON cifrada AES-256-GCM y protegió la clave con Windows DPAPI (usuario de Windows actual). Archivos en `%LOCALAPPDATA%\Cooperativa\backups`. La copia se puede verificar en modo de solo lectura con:

```powershell
node scripts/restore-atlas-backup.js "$env:LOCALAPPDATA\Cooperativa\backups\<archivo>.bson.enc"
```

El script `restore-atlas-backup.js` restaura toda la base solo si se agrega `--apply`; no ejecutar esa opción salvo que realmente se quiera reemplazar Atlas por el estado previo.
