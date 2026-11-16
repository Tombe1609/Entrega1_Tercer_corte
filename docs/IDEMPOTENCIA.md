# Idempotencia en operaciones financieras

Las solicitudes que pueden cambiar saldos deben incluir el encabezado
`Idempotency-Key` con un UUID nuevo para cada acción confirmada por el usuario.
Si se pierde la respuesta y se reenvía la misma acción, el cliente debe conservar
y reutilizar esa clave. No debe generar otra clave para el mismo intento.

## Operaciones cubiertas

- `POST /api/ahorros/:ahorro_id/depositos`
- `POST /api/ahorros/:ahorro_id/retiros`
- `POST /api/ahorros/transferencias`
- `POST /api/productos/:producto_id/compras`
- `POST /api/prestamos/:prestamo_id/aprobar`
- `POST /api/prestamos/:prestamo_id/cuotas/:numero/pagar`

La clave se asocia al usuario autenticado, método y ruta. La API guarda una
huella SHA-256 del contenido, sin almacenar el cuerpo enviado. Reutilizar la
misma clave con otro contenido devuelve `409 Conflict`; repetir la misma acción
completada devuelve el resultado original. La clave y el resultado se confirman
en la misma transacción MongoDB que el cambio financiero.

Si la API responde `409` indicando que la operación está en proceso o necesita
verificación, consulta el saldo y el historial antes de crear una acción nueva.
No borres ni cambies la clave mientras no sepas si el primer intento se aplicó.

Ejemplo de encabezado:

```http
Idempotency-Key: 81c57f38-5d61-4c91-9019-5e2ece175002
```

La API crea un índice único compuesto `scope + key` al iniciar. Los registros
no expiran automáticamente para evitar que una clave antigua pueda volver a
ejecutar una operación; la retención deberá revisarse antes de un despliegue con
volumen real.
