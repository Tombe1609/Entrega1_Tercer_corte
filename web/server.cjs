// Segundo servidor Express: entrega el build de React en un proceso/puerto separado de la API.
const express = require('express');
const fs = require('node:fs');
const path = require('node:path');

const app = express();
const webDist = path.resolve(__dirname, '../public');
const indexFile = path.join(webDist, 'index.html');
const port = Number(process.env.WEB_PORT) || 4000;

app.disable('x-powered-by');
app.use(express.static(webDist));
app.get('*', (req, res) => {
  if (!fs.existsSync(indexFile)) {
    return res.status(503).send('La web aún no está compilada. Ejecuta npm run web:build.');
  }
  return res.sendFile(indexFile);
});

app.listen(port, () => {
  console.log(`Frontend React servido por Express en http://localhost:${port}`);
});
