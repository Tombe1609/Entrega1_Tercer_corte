const { createHmac, timingSafeEqual } = require('node:crypto');
const { tokenSecret } = require('../config/config');

function firmarToken(payload) {
  const ahora = Math.floor(Date.now() / 1000);
  const contenido = Buffer.from(JSON.stringify({ ...payload, iat: ahora, exp: ahora + 8 * 60 * 60 })).toString('base64url');
  const firma = createHmac('sha256', tokenSecret).update(contenido).digest('base64url');
  return `${contenido}.${firma}`;
}

function verificarToken(token) {
  if (typeof token !== 'string') return null;
  const partes = token.split('.');
  if (partes.length !== 2) return null;
  const [contenido, firma] = partes;
  const esperada = createHmac('sha256', tokenSecret).update(contenido).digest();
  let recibida;
  try { recibida = Buffer.from(firma, 'base64url'); } catch (_) { return null; }
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
  try {
    const datos = JSON.parse(Buffer.from(contenido, 'base64url').toString('utf8'));
    if (!datos.exp || datos.exp <= Math.floor(Date.now() / 1000)) return null;
    return datos;
  } catch (_) { return null; }
}

module.exports = { firmarToken, verificarToken };
