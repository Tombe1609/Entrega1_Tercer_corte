# Seguridad y permisos de la API

## Rutas públicas

- `GET /api/health`: estado del servicio y conexión a MongoDB.
- `POST /api/auth/login`: valida credenciales y entrega un token Bearer con vencimiento de 8 horas.

Todas las demás rutas exigen `Authorization: Bearer <token>` válido.

## Matriz de permisos

| Recurso/acción | Estudiante | Funcionario | Rector |
|---|---|---|---|
| Consultar o modificar su cuenta de ahorro, movimientos y préstamos | Solo propios | Cualquier estudiante | Cualquier estudiante |
| Crear cuenta de ahorro | Solo para su propio ID | Para cualquier estudiante | Para cualquier estudiante |
| Solicitar préstamo | Solo para su propio ID | Para cualquier estudiante | Para cualquier estudiante |
| Listar estudiantes, funcionarios y cuentas | No | Sí | Sí |
| Crear estudiante o funcionario por ruta directa | No | No | Sí |
| Crear credenciales con `/api/gestion-usuarios` | No | No | Sí |
| Consultar estadísticas y distribuciones | No | Sí | Sí |
| Calcular distribución | No | Sí | Sí |
| Registrar distribución de intereses | No | No | Sí |

El middleware de propiedad consulta la relación del recurso en Mongo antes de permitir que un estudiante consulte o modifique una cuenta o préstamo. Las rutas administrativas admiten personal con rol `funcionario` o `rector` según la matriz.

## Uso de Postman

La colección incluye login de rector en el grupo `00 - Verificación` y guarda el token en la variable `token`; el Bearer se aplica a las peticiones de la colección. Health y login quedan sin autenticación. También incluye una verificación que espera 401 en `GET /api/ahorros` cuando no se envía token.

Usa una base de demostración recién inicializada; las historias crean documentos y no deben ejecutarse contra una base con datos que quieras conservar. Para repetir una corrida, usa otra base desechable o una copia.

## Sesión Android

Android envía el Bearer guardado con cada solicitud. Si la API responde 401, la app elimina el token y los datos de sesión, vuelve al login y muestra un mensaje de sesión vencida. Un 403 conserva la sesión y presenta el mensaje de permiso denegado.

`AUTH_TOKEN_SECRET` debe ser una cadena aleatoria privada en `.env` para despliegue. No uses la contraseña temporal ni el secreto de desarrollo en producción. La comunicación de producción debe usar HTTPS.
