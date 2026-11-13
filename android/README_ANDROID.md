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

El valor predeterminado para un emulador Android es `http://10.0.2.2:3000/`, definido como `api_base_url` en `app/src/main/res/values/config.xml`. En login se puede cambiar el servidor, por ejemplo a `http://192.168.1.20:3000/` para un teléfono y un computador conectados a la misma red (reemplaza la IP por la real).

La dirección local no es adecuada para la entrega final. Configura la URL HTTPS del backend una vez desplegado. La app permite cambiarla desde login; si se va a publicar el APK, la URL de producción debe quedar como configuración recomendada.

## Recorrido de datos

```text
Pantalla Compose → MainViewModel → Repository → ApiClient (Retrofit/OkHttp)
→ API Express → rutas → controladores/servicios → MongoDB
```

El token se guarda en `SharedPreferences` y OkHttp lo envía en `Authorization: Bearer ...`. La API valida el token y controla los permisos por rol y propietario. Si recibe 401, Android elimina la sesión y regresa al login; un 403 conserva la sesión y muestra el rechazo de permiso.

## Navegación visible actual

El perfil de estudiante muestra Inicio, Ahorros, Préstamos, Movimientos y Perfil. Las acciones tienen rutas propias. La administración tiene un panel con acceso a personas, cuentas, ahorros, movimientos, cartera y distribución. La siguiente iteración de diseño puede combinar formularios y listados cercanos en hojas modales y pestañas, manteniendo las rutas internas que sigan siendo útiles.

## Ejecutar

1. Inicia la API y verifica `/api/health` desde el equipo anfitrión.
2. Abre el proyecto en Android Studio y espera la sincronización de Gradle.
3. En un emulador, utiliza `http://10.0.2.2:3000/`; en teléfono físico, utiliza la IP local del computador.
4. Inicia sesión con una cuenta de demostración configurada en el backend.

Para uso final, la API debe estar desplegada en la nube según los requisitos del curso y configurada con HTTPS.
