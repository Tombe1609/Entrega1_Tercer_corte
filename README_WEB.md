# Portal web y dos servidores Express

Este repositorio ejecuta dos procesos Node.js/Express independientes: la API (puerto `3000`) y el servidor web (puerto `4000`). La interfaz está hecha con React; el backend centraliza las reglas, permisos y acceso a MongoDB. Android también consume la API y no necesita conectarse directamente a MongoDB.

```text
React servido por Express :4000 ── CORS + Bearer ── API Express :3000 ── MongoDB
Android ───────────────────────── Bearer ───────── API Express :3000
```

## Preparación local

Desde la raíz del repositorio:

```powershell
npm install
npm --prefix web install
```

Configura `.env` para la API con la URI privada de MongoDB. El archivo `.env` no se sube a Git. Configura también `CORS_ORIGINS` con los orígenes web autorizados; el `.env.example` incluye solo los orígenes locales de desarrollo.

La web toma la URL de API desde `web/.env.local`. Créalo a partir de `web/.env.example`:

```powershell
Copy-Item web/.env.example web/.env.local
```

## Ejecutar los dos servidores solicitados

Terminal 1, API Node.js/Express:

```powershell
npm run dev
```

Terminal 2, compilar React y levantar el servidor web Node.js/Express:

```powershell
npm run web:build
npm run web:server
```

Abre `http://localhost:4000`. La web llama directamente a `http://localhost:3000/api`; CORS permite únicamente los orígenes declarados en `CORS_ORIGINS`. No actives `*` para producción.

## Desarrollo con actualización rápida

En vez del servidor web Express, puedes usar Vite temporalmente:

```powershell
npm run web:dev
```

Abre `http://127.0.0.1:5173`; también está permitido en CORS para desarrollo. El servidor Express de la API sigue corriendo en `3000`.

## Producción

En `web/.env.local` configura `VITE_API_BASE_URL` con la URL pública HTTPS de la API antes de `npm run web:build`. Configura `CORS_ORIGINS` con el dominio HTTPS exacto del frontend, usa `NODE_ENV=production`, un `AUTH_TOKEN_SECRET` aleatorio y largo, y una URI MongoDB privada con TLS. El dominio del estudiante/servidor nunca debe recibir credenciales de MongoDB.

`npm run web:build` genera los archivos de React en `public/`. La API también puede servir ese build desde su puerto para un despliegue de un solo origen; para demostrar el requisito académico de dos servidores, inicia `npm run web:server` por separado.

## Módulos incluidos

- **Estudiante:** resumen, ahorros, depósitos/retiros, transferencias, movimientos, préstamos y cuotas, tienda, financiación de publicaciones, compras y perfil.
- **Funcionario:** resumen, solicitudes, aprobación y desembolso, cuentas, movimientos autorizados, directorio, publicaciones y reportes.
- **Rector:** funciones administrativas, registro de personas y distribución de intereses.

Los permisos definitivos los aplica la API. Ocultar una opción en React no sustituye los controles del backend.

## Archivos de conexión

- `web/src/App.jsx`: cliente REST, encabezado Bearer, tratamiento de respuestas y errores.
- `web/vite.config.js`: servidor de desarrollo Vite y build React.
- `web/server.cjs`: segundo servidor Express, que sirve el build del frontend.
- `src/app.js`: API Express y CORS con lista permitida de orígenes.
- `.env.example` y `web/.env.example`: plantillas sin credenciales.

