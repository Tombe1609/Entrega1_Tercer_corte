const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');

const derivarClave = promisify(scrypt);
const salDeRelleno = randomBytes(16).toString('hex');
const hashDeRelleno = randomBytes(64);

async function hashPassword(password) {
  const sal = randomBytes(16).toString('hex');
  const hash = await derivarClave(password, sal, 64);
  return `${sal}:${hash.toString('hex')}`;
}

async function verificarPassword(password, almacenado) {
  const formato = typeof almacenado === 'string'
    ? /^([0-9a-f]{32}):([0-9a-f]{128})$/i.exec(almacenado)
    : null;
  const esperado = formato ? Buffer.from(formato[2], 'hex') : hashDeRelleno;
  const recibido = await derivarClave(password, formato?.[1] || salDeRelleno, esperado.length);
  return timingSafeEqual(esperado, recibido) && Boolean(formato);
}

module.exports = { hashPassword, verificarPassword };
