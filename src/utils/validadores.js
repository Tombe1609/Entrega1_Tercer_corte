const AppError = require('./AppError');

/*
 * Validadores sencillos (sin librerías externas). Cada función agrega los
 * problemas encontrados al arreglo `errores`; al final se llama a
 * `lanzarSiHayErrores` para responder 400 con la lista completa.
 */

const EJEMPLOS_ID = { usuario: 'U001', funcionario: 'F001', ahorro: 'A001', prestamo: 'P001' };

const PATRONES_ID = {
  usuario: /^U\d{3,}$/,
  funcionario: /^F\d{3,}$/,
  ahorro: /^A\d{3,}$/,
  prestamo: /^P\d{3,}$/,
};

function lanzarSiHayErrores(errores) {
  if (errores.length > 0) {
    throw new AppError(400, 'Los datos enviados no son válidos.', errores);
  }
}

/** El cuerpo debe ser un objeto JSON (no arreglo, no texto). */
function exigirCuerpo(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(400, 'El cuerpo de la solicitud debe ser un objeto JSON.');
  }
  return body;
}

/** Texto obligatorio. Rechaza objetos (evita inyección de operadores como {"$ne": null}). */
function texto(body, campo, errores, { min = 1, max = 120 } = {}) {
  const valor = body[campo];
  if (valor === undefined || valor === null || valor === '') {
    errores.push(`El campo "${campo}" es obligatorio.`);
    return undefined;
  }
  if (typeof valor !== 'string') {
    errores.push(`El campo "${campo}" debe ser texto.`);
    return undefined;
  }
  const limpio = valor.trim();
  if (limpio.length < min || limpio.length > max) {
    errores.push(`El campo "${campo}" debe tener entre ${min} y ${max} caracteres.`);
    return undefined;
  }
  return limpio;
}

/** Texto opcional: si no viene se usa `porDefecto`. */
function textoOpcional(body, campo, errores, { max = 200, porDefecto } = {}) {
  const valor = body[campo];
  if (valor === undefined || valor === null || valor === '') return porDefecto;
  if (typeof valor !== 'string') {
    errores.push(`El campo "${campo}" debe ser texto.`);
    return undefined;
  }
  const limpio = valor.trim();
  if (limpio.length === 0 || limpio.length > max) {
    errores.push(`El campo "${campo}" debe tener entre 1 y ${max} caracteres.`);
    return undefined;
  }
  return limpio;
}

function email(body, campo, errores) {
  const valor = texto(body, campo, errores, { min: 5, max: 120 });
  if (valor !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
    errores.push(`El campo "${campo}" no tiene un formato de correo válido.`);
    return undefined;
  }
  return valor === undefined ? undefined : valor.toLowerCase();
}

/** Texto compuesto solo por dígitos (documento, teléfono). */
function digitos(body, campo, errores, { min, max }) {
  const valor = texto(body, campo, errores, { min, max });
  if (valor !== undefined && !/^\d+$/.test(valor)) {
    errores.push(`El campo "${campo}" debe contener solo dígitos.`);
    return undefined;
  }
  return valor;
}

/** Número mayor que cero, finito, con máximo 2 decimales. */
function montoPositivo(body, campo, errores, { max = 999999999999 } = {}) {
  const valor = body[campo];
  if (valor === undefined || valor === null || valor === '') {
    errores.push(`El campo "${campo}" es obligatorio.`);
    return undefined;
  }
  if (typeof valor !== 'number' || !Number.isFinite(valor)) {
    errores.push(`El campo "${campo}" debe ser un número.`);
    return undefined;
  }
  if (valor <= 0) {
    errores.push(`El campo "${campo}" debe ser mayor que cero.`);
    return undefined;
  }
  if (valor > max) {
    errores.push(`El campo "${campo}" no puede superar ${max}.`);
    return undefined;
  }
  if (Math.round(valor * 100) / 100 !== valor) {
    errores.push(`El campo "${campo}" admite máximo 2 decimales.`);
    return undefined;
  }
  return valor;
}

/** Valor que debe pertenecer a una lista. Si no viene y hay `porDefecto`, se usa ese. */
function enumerado(valor, campo, permitidos, errores, { porDefecto, obligatorio = false } = {}) {
  if (valor === undefined || valor === null || valor === '') {
    if (obligatorio) {
      errores.push(`El campo "${campo}" es obligatorio. Valores permitidos: ${permitidos.join(', ')}.`);
      return undefined;
    }
    return porDefecto;
  }
  if (typeof valor !== 'string' || !permitidos.includes(valor)) {
    errores.push(`El campo "${campo}" debe ser uno de: ${permitidos.join(', ')}.`);
    return undefined;
  }
  return valor;
}

/** Identificador de negocio recibido en el cuerpo (p. ej. "U001"). */
function idEnCuerpo(body, campo, tipo, errores) {
  const valor = texto(body, campo, errores, { min: 2, max: 12 });
  if (valor !== undefined && !PATRONES_ID[tipo].test(valor.toUpperCase())) {
    errores.push(`El campo "${campo}" no tiene un formato válido (ejemplo: ${EJEMPLOS_ID[tipo]}).`);
    return undefined;
  }
  return valor === undefined ? undefined : valor.toUpperCase();
}

/** Identificador recibido en la URL. Devuelve el id normalizado en mayúsculas o lanza 400. */
function idParametro(valor, tipo, nombre) {
  const id = String(valor || '').toUpperCase();
  if (!PATRONES_ID[tipo].test(id)) {
    throw new AppError(400, `El parámetro "${nombre}" no tiene un formato válido (ejemplo: ${EJEMPLOS_ID[tipo]}).`);
  }
  return id;
}

/** Periodo con formato AAAA-MM. */
function periodo(valor, campo, errores) {
  if (valor === undefined || valor === null || valor === '') {
    errores.push(`El campo "${campo}" es obligatorio (formato AAAA-MM).`);
    return undefined;
  }
  if (typeof valor !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(valor)) {
    errores.push(`El campo "${campo}" debe tener el formato AAAA-MM (ejemplo: 2026-04).`);
    return undefined;
  }
  return valor;
}

/** Verifica que MongoDB confirmó la escritura. */
function confirmarEscritura(resultado, mensaje) {
  if (!resultado || resultado.acknowledged !== true) {
    throw new AppError(500, mensaje || 'MongoDB no confirmó la operación.');
  }
}

module.exports = {
  lanzarSiHayErrores,
  exigirCuerpo,
  texto,
  textoOpcional,
  email,
  digitos,
  montoPositivo,
  enumerado,
  idEnCuerpo,
  idParametro,
  periodo,
  confirmarEscritura,
};
