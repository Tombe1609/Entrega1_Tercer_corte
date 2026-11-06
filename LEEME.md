# Parche de autenticación CooperativaApp (desarrollo local)

## Archivos
- `src/routes/auth.routes.js`: implementa `POST /api/auth/login`.
- `src/routes/index.js`: registra el router de autenticación.
- `database/crear-credenciales-demo.js`: asigna hash a cuentas existentes sin contraseña.

## Aplicar
Copia estos archivos a las rutas equivalentes dentro de tu carpeta `cooperativa-api`, reemplazando `src/routes/index.js` por el incluido.

El parche incluye un `package.json` actualizado que conserva las dependencias y scripts originales y agrega `seed:login-demo`.

En PowerShell, desde la carpeta de la API:
```powershell
npm run seed:login-demo
npm start
```
Si `npm start` ya estaba corriendo, detenlo con Ctrl+C y vuelve a iniciarlo.

## Probar en el emulador
- Base URL de Android: `http://10.0.2.2:3000/`
- Usa el correo de una cuenta existente en la colección `usuarios` o `funcionarios`.
- Define localmente `DEMO_LOGIN_PASSWORD` con al menos 12 caracteres antes de ejecutar el script. No publiques ni reutilices esa contraseña.
- Ejemplo de estudiante: `juan.munoz@universidad.edu.co`

El script NO cambia cuentas que ya tengan `password_hash`. No elimina registros. Es exclusivamente para desarrollo local; todas las cuentas migradas reciben la misma contraseña temporal. Antes de usar datos reales, implementa alta/recuperación individual de contraseñas y cambia las credenciales.

## Verificación rápida con PowerShell
```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/health
$body = @{ email = "juan.munoz@universidad.edu.co"; password = $env:DEMO_LOGIN_PASSWORD } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType "application/json" -Body $body
```
Respuesta correcta: `{ success: true, message: "...", data: { rol, id, nombre, email, ... } }`.
