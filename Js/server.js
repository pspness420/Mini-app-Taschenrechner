const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const port = 3001;

// Body-Parser aktivieren, um JSON im Request-Body zu verarbeiten
app.use(express.json());

// Verbindung zur Datenbank
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'TunaCan2005',
  database: 'taschenrechner_db'
});

db.connect((err) => {
  if (err) {
    console.error('Fehler beim Verbinden zur Datenbank:', err);
    process.exit(1);
  }
  console.log('Erfolgreich mit der Datenbank verbunden.');
});

// --------------------
// Swagger-Konfiguration
// --------------------
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Taschenrechner API',
      version: '1.0.0',
      description: 'API für Taschenrechner-Berechnungen mit CRUD-Funktionen'
    },
    servers: [
      { url: 'http://localhost:3001' }
    ]
  },
  apis: ['./server.js'], // Pfad, in dem Swagger-Kommentare stehen
};

const swaggerSpec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --------------------
// Statische Dateien
// --------------------
app.use(express.static(path.join(__dirname)));

// --------------------
// Swagger-Dokumentation für /api/calculate (GET)
// --------------------
/**
 * @swagger
 * /api/calculate:
 *   get:
 *     summary: Berechnet zwei Zahlen und speichert das Ergebnis in der Datenbank.
 *     parameters:
 *       - in: query
 *         name: num1
 *         schema:
 *           type: number
 *         required: true
 *         description: Erste Zahl
 *       - in: query
 *         name: num2
 *         schema:
 *           type: number
 *         required: true
 *         description: Zweite Zahl
 *       - in: query
 *         name: op
 *         schema:
 *           type: string
 *         required: true
 *         description: Operator (+, -, *, /)
 *     responses:
 *       200:
 *         description: Berechnung erfolgreich
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: number
 *       400:
 *         description: Ungültige Parameter
 *       500:
 *         description: Fehler beim Einfügen in die Datenbank
 */
app.get('/api/calculate', (req, res) => {
  const num1 = parseFloat(req.query.num1);
  const num2 = parseFloat(req.query.num2);
  const op = req.query.op;

  if (isNaN(num1) || isNaN(num2) || !op) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  let result;
  switch (op) {
    case '+':
      result = num1 + num2;
      break;
    case '-':
      result = num1 - num2;
      break;
    case '*':
      result = num1 * num2;
      break;
    case '/':
      if (num2 === 0) return res.status(400).json({ error: "Division durch 0 nicht erlaubt" });
      result = num1 / num2;
      break;
    default:
      return res.status(400).json({ error: "Ungültiger Operator. Erlaubt sind: +, -, *, /" });
  }

  const insertQuery = `
    INSERT INTO rechnungen (erste_zahl, zweite_zahl, operator, ergebnis)
    VALUES (?, ?, ?, ?)
  `;
  db.query(insertQuery, [num1, num2, op, result], (err) => {
    if (err) {
      console.error('Fehler beim Einfügen in die Datenbank:', err);
      return res.status(500).json({ error: "Fehler beim Einfügen in die Datenbank" });
    }
    res.json({ result });
  });
});

// --------------------
// CRUD-Endpunkte
// --------------------

/**
 * @swagger
 * components:
 *   schemas:
 *     Rechnung:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         erste_zahl:
 *           type: number
 *         zweite_zahl:
 *           type: number
 *         operator:
 *           type: string
 *         ergebnis:
 *           type: number
 *       example:
 *         id: 1
 *         erste_zahl: 5
 *         zweite_zahl: 10
 *         operator: "+"
 *         ergebnis: 15
 */

/**
 * @swagger
 * /api/rechnungen:
 *   get:
 *     summary: Gibt alle gespeicherten Rechnungen zurück
 *     responses:
 *       200:
 *         description: Eine Liste aller Rechnungen
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Rechnung'
 *       500:
 *         description: Serverfehler
 */
app.get('/api/rechnungen', (req, res) => {
  const query = 'SELECT * FROM rechnungen';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Fehler beim Abrufen der Daten:', err);
      return res.status(500).json({ error: 'Fehler beim Abrufen der Daten' });
    }
    res.json(results);
  });
});

/**
 * @swagger
 * /api/rechnungen/{id}:
 *   get:
 *     summary: Gibt eine einzelne Rechnung anhand der ID zurück
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID der Rechnung
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rechnung gefunden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rechnung'
 *       404:
 *         description: Keine Rechnung mit dieser ID gefunden
 *       500:
 *         description: Serverfehler
 */
app.get('/api/rechnungen/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM rechnungen WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Fehler beim Abrufen der Daten:', err);
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
 *             required:
 *               - erste_zahl
 *               - zweite_zahl
 *               - operator
 *     responses:
 *       201:
 *         description: Rechnung erfolgreich erstellt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rechnung'
 *       400:
 *         description: Ungültige Eingabedaten
 *       500:
 *         description: Serverfehler
 */
app.post('/api/rechnungen', (req, res) => {
  const { erste_zahl, zweite_zahl, operator } = req.body;

  // Validierung
  if (
    typeof erste_zahl !== 'number' ||
    typeof zweite_zahl !== 'number' ||
    typeof operator !== 'string'
  ) {
    return res.status(400).json({ error: 'Ungültige Eingabedaten' });
  }

  // Ergebnis berechnen (optional, je nachdem ob du das gleich beim POST machen willst)
  let ergebnis;
  switch (operator) {
    case '+':
      ergebnis = erste_zahl + zweite_zahl;
      break;
    case '-':
      ergebnis = erste_zahl - zweite_zahl;
      break;
    case '*':
      ergebnis = erste_zahl * zweite_zahl;
      break;
    case '/':
      if (zweite_zahl === 0) {
        return res.status(400).json({ error: 'Division durch 0 nicht erlaubt' });
      }
      ergebnis = erste_zahl / zweite_zahl;
      break;
    default:
      return res.status(400).json({ error: 'Ungültiger Operator' });
  }

  const query = `
    INSERT INTO rechnungen (erste_zahl, zweite_zahl, operator, ergebnis)
    VALUES (?, ?, ?, ?)
  `;
  db.query(query, [erste_zahl, zweite_zahl, operator, ergebnis], (err, result) => {
    if (err) {
      console.error('Fehler beim Einfügen in die Datenbank:', err);
      return res.status(500).json({ error: 'Fehler beim Einfügen in die Datenbank' });
    }
    // Neu erstellten Datensatz zurückgeben
    const newId = result.insertId;
    res.status(201).json({ id: newId, erste_zahl, zweite_zahl, operator, ergebnis });
  });
});

/**
 * @swagger
 * /api/rechnungen/{id}:
 *   put:
 *     summary: Aktualisiert eine bestehende Rechnung
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID der zu aktualisierenden Rechnung
 *         schema:
 *           type: integer
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
 *     responses:
 *       200:
 *         description: Rechnung erfolgreich aktualisiert
 *       400:
 *         description: Ungültige Eingabedaten
 *       404:
 *         description: Rechnung nicht gefunden
 *       500:
 *         description: Serverfehler
 */
app.put('/api/rechnungen/:id', (req, res) => {
  const { id } = req.params;
  const { erste_zahl, zweite_zahl, operator } = req.body;

  // Optional: Ergebnis neu berechnen
  let ergebnis;
  if (operator === '+') {
    ergebnis = erste_zahl + zweite_zahl;
  } else if (operator === '-') {
    ergebnis = erste_zahl - zweite_zahl;
  } else if (operator === '*') {
    ergebnis = erste_zahl * zweite_zahl;
  } else if (operator === '/') {
    if (zweite_zahl === 0) {
      return res.status(400).json({ error: 'Division durch 0 nicht erlaubt' });
    }
    ergebnis = erste_zahl / zweite_zahl;
  } else {
    return res.status(400).json({ error: 'Ungültiger Operator' });
  }

  const query = `
    UPDATE rechnungen
    SET erste_zahl = ?, zweite_zahl = ?, operator = ?, ergebnis = ?
    WHERE id = ?
  `;
  db.query(query, [erste_zahl, zweite_zahl, operator, ergebnis, id], (err, result) => {
    if (err) {
      console.error('Fehler beim Aktualisieren der Daten:', err);
      return res.status(500).json({ error: 'Fehler beim Aktualisieren der Daten' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Keine Rechnung mit dieser ID gefunden' });
    }
    res.json({ id, erste_zahl, zweite_zahl, operator, ergebnis });
  });
});

/**
 * @swagger
 * /api/rechnungen/{id}:
 *   delete:
 *     summary: Löscht eine Rechnung anhand der ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID der zu löschenden Rechnung
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rechnung erfolgreich gelöscht
 *       404:
 *         description: Keine Rechnung mit dieser ID gefunden
 *       500:
 *         description: Serverfehler
 */
app.delete('/api/rechnungen/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM rechnungen WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Fehler beim Löschen:', err);
      return res.status(500).json({ error: 'Fehler beim Löschen' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Keine Rechnung mit dieser ID gefunden' });
    }
    res.json({ message: 'Rechnung erfolgreich gelöscht' });
  });
});

// --------------------
// Server starten
// --------------------
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
