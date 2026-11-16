const jwt = require('jsonwebtoken');
const { tokenSecret } = require('../config/config');

// These claims identify this API as issuer and the Android client as audience.
const ISSUER = 'cooperativa-api';
const AUDIENCE = 'cooperativa-app';
const ALGORITHM = 'HS256';
const MAX_AGE = '8h';
const ROLES = new Set(['estudiante', 'funcionario', 'rector']);

/** Creates a standard, signed JWT with only the claims required by authorization. */
function firmarToken({ id, rol, version_sesion = 0 }) {
  if (typeof id !== 'string' || !id || !ROLES.has(rol)) {
    throw new TypeError('No se puede emitir un token para una identidad o rol inválido.');
  }

  return jwt.sign(
    { rol, version_sesion },
    tokenSecret,
    {
      algorithm: ALGORITHM,
      subject: id,
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresIn: MAX_AGE,
    },
  );
}

/** Verifies signature and standard claims, then maps `sub` to the existing auth contract. */
function verificarToken(token) {
  if (typeof token !== 'string') return null;

  try {
    const claims = jwt.verify(token, tokenSecret, {
      algorithms: [ALGORITHM],
      issuer: ISSUER,
      audience: AUDIENCE,
      maxAge: MAX_AGE,
    });
    if (!claims || typeof claims !== 'object' || typeof claims.sub !== 'string' || !claims.sub ||
        !ROLES.has(claims.rol) || !Number.isInteger(claims.version_sesion) || claims.version_sesion < 0 ||
        !Number.isInteger(claims.iat) || !Number.isInteger(claims.exp)) {
      return null;
    }

    // Keep the middleware's established shape while JWT uses the standard `sub` claim.
    return {
      id: claims.sub,
      rol: claims.rol,
      version_sesion: claims.version_sesion,
      iat: claims.iat,
      exp: claims.exp,
    };
  } catch (_) {
    return null;
  }
}

module.exports = { firmarToken, verificarToken };
