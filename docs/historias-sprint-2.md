# Historias de usuario — Sprint 2

El entregable del Sprint 2 solicita actualizar las evidencias del sprint en la herramienta de gestión, sustentar presencialmente el código y demostrar la funcionalidad acumulada. Estas historias continúan el catálogo y las compras implementados.

## HU11 — Consultar mis compras

**Como** estudiante, **quiero** consultar los productos que he comprado, con fecha, valor y estado, **para** revisar mi historial de compras.

### Criterios de aceptación

- La pantalla «Mis compras» muestra nombre del producto, fecha, valor y estado.
- Si no hay compras, aparece un estado vacío con un mensaje claro.
- Cada estudiante consulta únicamente sus propias compras.
- Una compra pagada aparece en esta pantalla después de actualizar los datos.

**Estado:** Implementada en Android usando `GET /api/productos/compras/mias`. Pendiente de verificación manual y evidencia en el tablero.

## HU12 — Administrar publicaciones del catálogo

**Como** funcionario o rector, **quiero** consultar, editar, cerrar y reactivar publicaciones dentro de su vigencia, **para** mantener actualizado el catálogo disponible para los estudiantes.

### Criterios de aceptación

- El catálogo administrativo permite filtrar por todos, vigentes, vencidos y cerrados.
- Cada publicación muestra claramente su estado y fecha límite.
- Un funcionario o rector puede editar nombre, categoría, descripción, precio y fechas, con validación de campos y vigencia.
- No se puede cambiar el precio mientras haya una solicitud de préstamo pendiente asociada al producto.
- Una publicación cerrada solo puede reactivarse cuando la fecha actual de Colombia esté dentro de su periodo de disponibilidad.
- Una publicación vencida o cerrada no aparece en la tienda estudiantil ni permite compra o financiación.

**Estado:** Interfaz implementada con `PATCH /api/productos/:producto_id` para editar y `PATCH /api/productos/:producto_id/estado` para cerrar o reactivar. Pendiente de verificación manual y evidencia en el tablero.

## HU13 — Evitar compras duplicadas

**Como** estudiante, **quiero** comprar cada producto una sola vez, **para** evitar cobros repetidos.

### Criterios de aceptación

- Una compra exitosa descuenta el saldo y se registra en el historial.
- El catálogo indica «Ya comprado» para un artículo adquirido.
- Un segundo intento se rechaza y no altera saldo ni historial.
- La regla se aplica tanto en la interfaz como en la API.

**Estado:** Regla y respuesta visual implementadas. Pendiente de comprobar en ejecución y adjuntar evidencia.

## Orden sugerido para la sustentación

1. Iniciar sesión como estudiante y mostrar el catálogo y el estado de vigencia.
2. Comprar un producto con saldo suficiente y mostrar saldo actualizado y «Mis compras».
3. Intentar comprar el mismo producto otra vez y mostrar el rechazo sin cambio de saldo.
4. Iniciar sesión como funcionario, filtrar el catálogo y cerrar una publicación.
5. Volver al estudiante y comprobar que la publicación cerrada ya no está disponible.

No marcar estas historias como terminadas en la herramienta hasta repetir esos pasos y adjuntar las evidencias.
