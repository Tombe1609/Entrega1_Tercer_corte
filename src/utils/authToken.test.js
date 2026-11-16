process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/cooperativa_test';
process.env.AUTH_TOKEN_SECRET ??= 'test-secret-with-at-least-32-bytes-long';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { tokenSecret } = require('../config/config');
const { firmarToken, verificarToken } = require('./authToken');

test('emite un JWT estándar HS256 con identidad como sub y caducidad', () => {
  const token = firmarToken({ id: 'U014', rol: 'estudiante', version_sesion: 3 });
  const [header, payload, signature, extra] = token.split('.');
  const decodedHeader = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'));
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

  assert.equal(extra, undefined);
  assert.equal(decodedHeader.alg, 'HS256');
  assert.equal(claims.iss, 'cooperativa-api');
  assert.equal(claims.aud, 'cooperativa-app');
  assert.equal(claims.sub, 'U014');
  assert.equal(claims.rol, 'estudiante');
  assert.equal(claims.version_sesion, 3);
  assert.equal(claims.exp - claims.iat, 8 * 60 * 60);
  assert.equal('email' in claims, false);
  assert.deepEqual(verificarToken(token), {
    id: 'U014', rol: 'estudiante', version_sesion: 3, iat: claims.iat, exp: claims.exp,
  });
});

test('rechaza tokens modificados, expirados y firmados para otra audiencia', () => {
  const token = firmarToken({ id: 'U014', rol: 'estudiante' });
  const [header, payload, signature] = token.split('.');
  const altered = Buffer.from(JSON.stringify({ sub: 'U999' })).toString('base64url');
  const expired = jwt.sign(
    { rol: 'estudiante', version_sesion: 0 },
    tokenSecret,
    { algorithm: 'HS256', subject: 'U014', issuer: 'cooperativa-api', audience: 'cooperativa-app', expiresIn: -1 },
  );
  const wrongAudience = jwt.sign(
    { rol: 'estudiante', version_sesion: 0 },
    tokenSecret,
    { algorithm: 'HS256', subject: 'U014', issuer: 'cooperativa-api', audience: 'other-app', expiresIn: '1h' },
  );

  assert.equal(verificarToken(`${header}.${altered}.${signature}`), null);
  assert.equal(verificarToken(expired), null);
  assert.equal(verificarToken(wrongAudience), null);
  assert.equal(verificarToken('not-a-jwt'), null);
});

test('no emite tokens para roles no autorizados', () => {
  assert.throws(() => firmarToken({ id: 'U014', rol: 'administrador' }), /rol inválido/);
});
