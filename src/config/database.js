const { MongoClient } = require('mongodb');
const config = require('./config');

let client = null;
let db = null;
let transacciones = false;

/** Conecta con MongoDB y detecta si el servidor permite transacciones (replica set). */
async function conectar() {
  client = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  db = client.db(config.dbName);
  await db.command({ ping: 1 });

  try {
    const info = await db.command({ hello: 1 });
    transacciones = Boolean(info.setName) || info.msg === 'isdbgrid';
  } catch (error) {
    transacciones = false;
  }
  return db;
}

function obtenerDb() {
  if (!db) throw new Error('La base de datos no está conectada.');
  return db;
}

function obtenerClient() {
  if (!client) throw new Error('La base de datos no está conectada.');
  return client;
}

function coleccion(nombre) {
  return obtenerDb().collection(nombre);
}

function soportaTransacciones() {
  return transacciones;
}

async function cerrar() {
  if (client) await client.close();
  client = null;
  db = null;
}

module.exports = { conectar, obtenerDb, obtenerClient, coleccion, soportaTransacciones, cerrar };
