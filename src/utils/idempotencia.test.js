const test = require('node:test');
const assert = require('node:assert/strict');
const { crearContextoIdempotencia, crearEjecutorIdempotente } = require('./idempotencia');

function coleccionFalsa() {
  const documentos = new Map();
  const id = ({ scope, key }) => `${scope}:${key}`;
  return {
    async findOne(filtro) { return documentos.get(id(filtro)) ?? null; },
    async insertOne(documento) {
      const clave = id(documento);
      if (documentos.has(clave)) {
        const error = new Error('duplicate key');
        error.code = 11000;
        throw error;
      }
      documentos.set(clave, structuredClone(documento));
      return { acknowledged: true };
    },
    async updateOne(filtro, actualizacion) {
      const clave = id(filtro);
      const actual = documentos.get(clave);
      if (!actual || actual.estado !== filtro.estado) return { matchedCount: 0 };
      documentos.set(clave, { ...actual, ...structuredClone(actualizacion.$set) });
      return { matchedCount: 1 };
    },
    async deleteOne(filtro) { return { deletedCount: documentos.delete(id(filtro)) ? 1 : 0 }; },
  };
}

const ejecutarAtomicoDirecto = (trabajo) => trabajo({ session: null, alDeshacer() {} });
async function ejecutarAtomicoConCompensacion(trabajo) {
  const deshacer = [];
  try {
    return await trabajo({ session: null, alDeshacer: (fn) => deshacer.push(fn) });
  } catch (error) {
    for (const revertir of deshacer.reverse()) await revertir();
    throw error;
  }
}

test('repite la respuesta guardada sin volver a ejecutar la operación', async () => {
  const registros = coleccionFalsa();
  const ejecutar = crearEjecutorIdempotente({ obtenerColeccion: () => registros, ejecutarAtomico: ejecutarAtomicoDirecto });
  const contexto = { scope: 'U001:POST:/api/ahorros/A001/depositos', key: 'key-1', request_hash: 'hash-1' };
  let ejecuciones = 0;

  const primera = await ejecutar(contexto, async () => ({ movimiento_id: 'M001', saldo_actual: 2500 }));
  ejecuciones += 1;
  const repetida = await ejecutar(contexto, async () => { ejecuciones += 1; return { movimiento_id: 'M002' }; });

  assert.deepEqual(repetida, primera);
  assert.equal(ejecuciones, 1);
});

test('rechaza reutilizar una clave con datos diferentes', async () => {
  const registros = coleccionFalsa();
  const ejecutar = crearEjecutorIdempotente({ obtenerColeccion: () => registros, ejecutarAtomico: ejecutarAtomicoDirecto });
  const base = { scope: 'U001:POST:/api/ahorros/A001/depositos', key: 'key-1', request_hash: 'hash-1' };
  await ejecutar(base, async () => ({ movimiento_id: 'M001' }));

  await assert.rejects(
    ejecutar({ ...base, request_hash: 'hash-2' }, async () => ({})),
    { status: 409 },
  );
});

test('permite reintentar con la misma clave si la operación falló y se revirtió', async () => {
  const registros = coleccionFalsa();
  const ejecutar = crearEjecutorIdempotente({ obtenerColeccion: () => registros, ejecutarAtomico: ejecutarAtomicoConCompensacion });
  const contexto = { scope: 'U001:POST:/api/ahorros/A001/retiros', key: 'key-2', request_hash: 'hash-2' };
  await assert.rejects(ejecutar(contexto, async () => { throw new Error('simulated failure'); }), /simulated failure/);
  const resultado = await ejecutar(contexto, async () => ({ movimiento_id: 'M003' }));
  assert.deepEqual(resultado, { movimiento_id: 'M003' });
});

test('el contexto exige UUID y calcula huella estable del cuerpo', () => {
  const headers = { 'idempotency-key': '81c57f38-5d61-4c91-9019-5e2ece175002' };
  const request = (body) => ({
    get: (name) => headers[name.toLowerCase()],
    auth: { id: 'U001' },
    method: 'POST',
    originalUrl: '/api/ahorros/A001/depositos?source=app',
    body,
  });

  const a = crearContextoIdempotencia(request({ valor: 2500, descripcion: 'Aporte' }));
  const b = crearContextoIdempotencia(request({ descripcion: 'Aporte', valor: 2500 }));
  assert.equal(a.scope, 'U001:POST:/api/ahorros/A001/depositos');
  assert.equal(a.request_hash, b.request_hash);
  assert.throws(() => crearContextoIdempotencia({ ...request({}), get: () => undefined }), { status: 400 });
});
