# Aplicación Android

## Tecnologías

- Kotlin y Android SDK (compile/target SDK 34; mínimo SDK 26).
- Jetpack Compose y Material 3 para la interfaz.
- Navigation Compose para las rutas.
- Retrofit, Gson y OkHttp para consumir la API REST.
- Coroutines y `MainViewModel` para operaciones asíncronas y estado de pantalla.

## Paquetes actuales

```text
com.cooperativa.app/
├── MainActivity.kt
├── data/              Modelos, cliente Retrofit y Repository
└── ui/
    ├── CooperativaApp.kt   Navegación y barra inferior
    ├── MainViewModel.kt    Sesión, estados y operaciones de la app
    ├── Components.kt       Componentes Compose compartidos
    ├── screens/            Pantallas de login, estudiante y administración
    └── theme/              Colores y tema Material
```

Esta es la estructura existente; una siguiente mejora será separar `MainViewModel` en autenticación, estudiante y administración, y agrupar pantallas por función cuando se implemente la navegación reducida.

## URL de la API

Todas las variantes de Android (`debug` y `release`) usan una sola URL HTTPS: `https://cooperativa-api-m37c.onrender.com/`. Está definida en `app/src/main/res/values/config.xml`. La app no tiene selector de servidor ni dirección local de respaldo; las compilaciones de desarrollo también se conectan a Render.

### APK de entrega

La URL base termina en `/`; Retrofit agrega los segmentos `api/...` de cada endpoint. Si Render cambia de dominio, actualiza `api_base_url` en `app/src/main/res/values/config.xml`, vuelve a compilar y distribuye la APK nueva. Al cambiar de servidor, la app invalida una sesión asociada con el host anterior y solicita iniciar sesión de nuevo.

### Firma de publicación

La versión está en `app/build.gradle.kts` (`1.5.1`, código `7`). La variante release se firma con las propiedades locales `COOPERATIVA_RELEASE_KEYSTORE`, `COOPERATIVA_RELEASE_STORE_PASSWORD`, `COOPERATIVA_RELEASE_KEY_ALIAS` y `COOPERATIVA_RELEASE_KEY_PASSWORD` en `%USERPROFILE%\.gradle\gradle.properties` (o con variables de entorno equivalentes). La clave `.p12` permanece fuera del repositorio. Conserva una copia segura del archivo y sus contraseñas; si se pierden, no podrás actualizar instalaciones firmadas con esa clave. La firma release nueva es distinta a la debug de APKs anteriores: para la primera instalación release hay que quitar la app anterior y volver a iniciar sesión.

## Recorrido de datos

```text
Pantalla Compose → MainViewModel → Repository → ApiClient (Retrofit/OkHttp)
→ API Express → rutas → controladores/servicios → MongoDB
```

El JWT Bearer se cifra localmente con AES-GCM y una clave no exportable de Android Keystore; OkHttp lo envía en `Authorization: Bearer ...`. Android trata el JWT como una cadena opaca; la API verifica su firma HS256, emisor, audiencia, vencimiento, rol y permisos de propietario. El payload no se cifra y solo contiene los claims mínimos de autorización. Si recibe 401, Android elimina la sesión y regresa al login; un 403 conserva la sesión y muestra el rechazo de permiso.

Las operaciones que mueven dinero (depósitos, retiros, transferencias, compras, desembolsos y pagos de cuotas) envían `Idempotency-Key`. Android conserva la clave de un intento si se pierde la respuesta y la elimina cuando recibe un resultado concluyente, para que reintentar la misma acción no la registre dos veces.

## Navegación visible actual

El perfil de estudiante muestra Inicio, Ahorros, Préstamos, Movimientos y Perfil. Las acciones tienen rutas propias. La administración tiene un panel con acceso a personas, cuentas, ahorros, movimientos, cartera y distribución. La siguiente iteración de diseño puede combinar formularios y listados cercanos en hojas modales y pestañas, manteniendo las rutas internas que sigan siendo útiles.

## Ejecutar

1. Inicia la API y verifica `/api/health` desde el equipo anfitrión.
2. Abre el proyecto en Android Studio y espera la sincronización de Gradle.
3. Ejecuta la app desde Android Studio o instala la APK. Tanto `debug` como `release` se conectan a Render.
4. Inicia sesión con una cuenta habilitada en la base de datos asociada al servicio desplegado.

La disponibilidad de la app depende del servicio Render y de su conexión a MongoDB Atlas. La API debe responder en `https://cooperativa-api-m37c.onrender.com/api/health`.
