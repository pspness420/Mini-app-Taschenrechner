const express = require('express');
const app = express();
const port = 3000;

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
    res.json({ result });
});

// Statische Dateien ausliefern (z.B. index.html, calculator.js)
app.use(express.static(__dirname));

app.listen(port, () => {
    console.log(`Calculator API running at http://localhost:${port}`);
});
