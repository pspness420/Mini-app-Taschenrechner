// server.js

const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = 3001;  // Hier den gewünschten Port angeben

// 1. Verbindung zur Datenbank herstellen
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',          // Benutzername in HeidiSQL
  password: 'TunaCan2005', // Dein Passwort
  database: 'taschenrechner_db' // Name deiner Datenbank
});

db.connect((err) => {
  if (err) {
    console.error('Fehler beim Verbinden zur Datenbank:', err);
    process.exit(1);
  }
  console.log('Erfolgreich mit der Datenbank verbunden.');
});

// 2. Statische Dateien ausliefern (index.html, calculator.js, style.css usw.)
app.use(express.static(path.join(__dirname)));

// 3. API-Endpunkt für die Berechnung
app.get('/api/calculate', (req, res) => {
  const num1 = parseFloat(req.query.num1);
  const num2 = parseFloat(req.query.num2);
  const op = req.query.op;

  if (isNaN(num1) || isNaN(num2)) {
    return res.status(400).json({ error: "Invalid numbers" });
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
      if (num2 === 0) {
        return res.status(400).json({ error: "Division by zero is not allowed." });
      }
      result = num1 / num2;
      break;
    default:
      return res.status(400).json({ error: "Invalid operator. Use +, -, *, or /" });
  }

  // 4. Ergebnis in der Datenbank speichern
  const insertQuery = `
    INSERT INTO rechnungen (erste_zahl, zweite_zahl, operator, ergebnis)
    VALUES (?, ?, ?, ?)
  `;
  db.query(insertQuery, [num1, num2, op, result], (err) => {
    if (err) {
      console.error('Fehler beim Einfügen in die Datenbank:', err);
      return res.status(500).json({ error: "Fehler beim Einfügen in die Datenbank" });
    }
    // Erfolgreiche Antwort an den Client
    res.json({ result });
  });
});

// 5. Server starten
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
