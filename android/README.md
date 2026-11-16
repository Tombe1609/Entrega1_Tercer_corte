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

- URL base única para Android: `https://cooperativa-api-m37c.onrender.com/`.
- Se configura en `app/src/main/res/values/config.xml`; debug y release utilizan Render.
- La app no tiene selector de servidor ni respaldo local.

Si cambia el dominio, actualiza `api_base_url` y recompila. Retrofit añade `/api/...` al endpoint de cada función.

## APK de entrega

La URL HTTPS de Render ya está configurada para debug y release. Retrofit añade `api/...` a esa base para construir los endpoints.

La app Android está en versión `1.5.1` (código `7`). Sincroniza Gradle y genera el APK firmado de la variante `release`. Gradle toma la firma de `%USERPROFILE%\.gradle\gradle.properties` o de variables de entorno `COOPERATIVA_RELEASE_*`; sin ellas, el APK release queda sin firmar. Conserva la clave `.p12` y sus contraseñas fuera del repositorio. La firma release es distinta de la debug de versiones anteriores, así que hay que desinstalar la app previa para hacer la primera instalación release. Tras desplegar JWT, todas las personas deberán iniciar sesión de nuevo.

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
3. Comprueba `https://cooperativa-api-m37c.onrender.com/api/health`.
4. Abre el directorio `android/` en Android Studio, sincroniza Gradle y ejecuta la app; se conectará a Render.

Consulta [README_ANDROID.md](README_ANDROID.md) para detalles de arquitectura Android. Las historias están en [historias-usuario.md](../docs/historias-usuario.md).
