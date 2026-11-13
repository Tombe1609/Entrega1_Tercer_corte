# Aplicación Android — Cooperativa Universitaria

Aplicación móvil Android desarrollada con Kotlin y Jetpack Compose. Consume la API REST Node.js/Express del directorio raíz; la API persiste los datos en MongoDB.

## Estructura del repositorio

```text
/
├── android/   Aplicación móvil Android
├── src/       API REST y lógica de negocio
├── database/  Semillas de demostración
├── web/       Interfaz React/Vite
└── docs/      Arquitectura, historias y operación
```

## API propia y URL base

- Emulador Android: `http://10.0.2.2:3000/` (`10.0.2.2` apunta al equipo anfitrión desde el emulador).
- Dispositivo físico en la misma red: `http://IP_LOCAL_DEL_EQUIPO:3000/`; permitir el puerto 3000 en el firewall.
- Producción: configurar la URL HTTPS del backend desplegado. No publicar credenciales ni usar HTTP para datos reales.

La app obtiene el valor predeterminado de `app/src/main/res/values/config.xml` (`api_base_url`), separado de la configuración de Gradle. El inicio de sesión también permite cambiar la URL base.

## Endpoints usados por Android

| Funcionalidad | Métodos y endpoints |
|---|---|
| Inicio de sesión | `POST /api/auth/login` |
| Crear cuenta de acceso (rector) | `POST /api/gestion-usuarios` |
| Estudiantes | `GET /api/estudiantes`, `POST /api/estudiantes`, `GET /api/estudiantes/{id}/prestamos` |
| Funcionarios | `GET /api/funcionarios`, `POST /api/funcionarios` |
| Ahorros | `GET /api/ahorros`, `POST /api/ahorros`, `GET /api/ahorros/{id}` |
| Depósitos, retiros e historial | `POST /api/ahorros/{id}/depositos`, `POST /api/ahorros/{id}/retiros`, `GET /api/ahorros/{id}/movimientos` |
| Préstamos educativos | `GET /api/fines-educativos`, `POST /api/prestamos`, `POST /api/prestamos/{id}/aprobar`, `GET /api/prestamos/{id}`, `GET /api/prestamos/{id}/interes` |
| Pagos e historial | `POST /api/prestamos/{id}/pagos`, `GET /api/prestamos/{id}/pagos` |
| Distribución de intereses | `GET /api/distribucion-intereses/calculo`, `POST /api/distribucion-intereses` |
| Reportes | `GET /api/reportes/estadisticas` |

Las solicitudes nuevas quedan pendientes y no afectan el saldo. Un funcionario autorizado o el rector aprueba la solicitud; la API acredita el desembolso y registra el movimiento como una operación atómica. Las rutas de negocio requieren Bearer token y validan roles y acceso a recursos. Consulta [seguridad de la API](../docs/seguridad-api.md) y el catálogo de endpoints en [README del backend](../README.md).

## Ejecución local

1. Instala MongoDB local o configura una URI de desarrollo en el archivo `.env` del directorio raíz. No subas `.env` a GitHub.
2. Desde la raíz del repositorio, instala dependencias y prepara la base de demostración. Revisa primero los scripts para confirmar qué datos insertan:

   ```powershell
   npm install
   npm run seed
   npm run seed:login-demo
   npm run dev
   ```

   Las credenciales demo se deben configurar localmente mediante `DEMO_LOGIN_PASSWORD`; no se publican en esta guía. Usa cuentas y datos ficticios en demostraciones.
3. Comprueba `http://localhost:3000/api/health`.
4. Abre el directorio `android/` en Android Studio, sincroniza Gradle y ejecuta la app en un emulador. La URL base del emulador debe ser `http://10.0.2.2:3000/`.

Consulta [README_ANDROID.md](README_ANDROID.md) para detalles de arquitectura Android. Las historias están en [historias-usuario.md](../docs/historias-usuario.md).
