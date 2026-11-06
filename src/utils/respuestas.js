/** Formato único de respuesta JSON: { success, message, data } */
function ok(res, data, message = 'Operación realizada correctamente') {
  return res.status(200).json({ success: true, message, data });
}

function creado(res, data, message = 'Recurso creado correctamente') {
  return res.status(201).json({ success: true, message, data });
}

module.exports = { ok, creado };
