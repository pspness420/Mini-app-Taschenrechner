const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
 
const app = express();
const port = 3001;
 
// Middleware für JSON-Parsing und CORS
app.use(express.json());
app.use(cors());
 
// Verbindung zur MySQL-Datenbank
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'Oyuncak16',
  database: 'taschenrechner_db'
});
 
// Verbindung testen
db.connect((err) => {
  if (err) {
    console.error('❌ Fehler beim Verbinden zur Datenbank:', err.message);
    process.exit(1);
  }
  console.log('✅ Erfolgreich mit der Datenbank verbunden.');
});
 
// Swagger-Konfiguration
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Taschenrechner API',
      version: '1.0.0',
      description: 'API für Taschenrechner-Berechnungen mit CRUD-Funktionen'
    },
    servers: [{ url: 'http://localhost:3001' }]
  },
  apis: ['./server.js'],
};
 
const swaggerSpec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
 
/**
 * @swagger
 * /api/rechnungen:
 *   get:
 *     summary: Gibt alle gespeicherten Rechnungen zurück
 *     tags: [Rechnungen]
 *     responses:
 *       200:
 *         description: Erfolgreiche Rückgabe der Rechnungen
 */
app.get('/api/rechnungen', (req, res) => {
  const query = 'SELECT * FROM rechnungen';
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Fehler beim Abrufen der Daten:', err);
      return res.status(500).json({ error: 'Fehler beim Abrufen der Daten' });
    }
    res.json(results);
  });
});
 
/**
 * @swagger
 * /api/calculate:
 *   get:
 *     summary: Berechnet zwei Zahlen und speichert das Ergebnis in der Datenbank.
 *     parameters:
 *       - in: query
 *         name: num1
 *         required: true
 *         schema:
 *           type: number
 *         description: Erste Zahl
 *       - in: query
 *         name: num2
 *         required: true
 *         schema:
 *           type: number
 *         description: Zweite Zahl
 *       - in: query
 *         name: op
 *         required: true
 *         schema:
 *           type: string
 *         description: Mathematischer Operator (+, -, *, /)
 *     responses:
 *       200:
 *         description: Erfolgreiche Berechnung
 *       400:
 *         description: Ungültige Parameter
 */
app.get('/api/calculate', (req, res) => {
  const num1 = parseFloat(req.query.num1);
  const num2 = parseFloat(req.query.num2);
  const op = req.query.op;
 
  if (isNaN(num1) || isNaN(num2) || !op) {
    return res.status(400).json({ error: "❌ Ungültige Parameter" });
  }
 
  let result;
  switch (op) {
    case '+': result = num1 + num2; break;
    case '-': result = num1 - num2; break;
    case '*': result = num1 * num2; break;
    case '/':
      if (num2 === 0) return res.status(400).json({ error: "❌ Division durch 0 nicht erlaubt" });
      result = num1 / num2;
      break;
    default:
      return res.status(400).json({ error: "❌ Ungültiger Operator" });
  }
 
  const insertQuery = `INSERT INTO rechnungen (erste_zahl, zweite_zahl, operator, ergebnis) VALUES (?, ?, ?, ?)`;
  db.query(insertQuery, [num1, num2, op, result], (err) => {
    if (err) {
      console.error('❌ Fehler beim Einfügen in die Datenbank:', err);
      return res.status(500).json({ error: "Fehler beim Einfügen in die Datenbank" });
    }
    res.json({ result });
  });
});
 
/**
 * @swagger
 * /api/rechnungen/{id}:
 *   get:
 *     summary: Gibt eine Rechnung anhand der ID zurück
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID der Rechnung
 *     responses:
 *       200:
 *         description: Rechnung gefunden
 *       404:
 *         description: Keine Rechnung mit dieser ID gefunden
 */
app.get('/api/rechnungen/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM rechnungen WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('❌ Fehler beim Abrufen der Daten:', err);
      return res.status(500).json({ error: 'Fehler beim Abrufen der Daten' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Keine Rechnung mit dieser ID gefunden' });
    }
    res.json(results[0]);
  });
});
 
/**
 * @swagger
 * /api/rechnungen:
 *   post:
 *     summary: Erstellt eine neue Rechnung
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               erste_zahl:
 *                 type: number
 *               zweite_zahl:
 *                 type: number
 *               operator:
 *                 type: string
 *               ergebnis:
 *                 type: number
 *     responses:
 *       201:
 *         description: Rechnung erfolgreich erstellt
 */
app.post('/api/rechnungen', (req, res) => {
  const { erste_zahl, zweite_zahl, operator, ergebnis } = req.body;
  const query = `INSERT INTO rechnungen (erste_zahl, zweite_zahl, operator, ergebnis) VALUES (?, ?, ?, ?)`;
  db.query(query, [erste_zahl, zweite_zahl, operator, ergebnis], (err, result) => {
    if (err) {
      console.error('❌ Fehler beim Einfügen in die Datenbank:', err);
      return res.status(500).json({ error: 'Fehler beim Einfügen in die Datenbank' });
    }
    res.status(201).json({ id: result.insertId, erste_zahl, zweite_zahl, operator, ergebnis });
  });
});
 
// --------------------
// Server starten
// --------------------
app.listen(port, () => {
  console.log(`🚀 Server läuft auf http://localhost:${port}`);
});