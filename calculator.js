document.addEventListener('DOMContentLoaded', () => {
    const display = document.querySelector('.display');
    const numberButtons = document.querySelectorAll('.number');
    const operatorButtons = document.querySelectorAll('.operator');
    const equalsButton = document.querySelector('.equals');
    const clearButton = document.querySelector('.clear');
  
    let currentValue = '0';
    let storedValue = null;
    let currentOperator = null;
    let shouldResetDisplay = false;
  
    // 1. Zahlen-Buttons
    numberButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Falls das Display „0“ ist oder wir es zurücksetzen sollen, ersetzen wir den Inhalt
        if (display.value === '0' || shouldResetDisplay) {
          display.value = button.textContent;
          shouldResetDisplay = false;
        } else {
          display.value += button.textContent;
        }
        currentValue = display.value;
      });
    });
  
    // 2. Operator-Buttons
    operatorButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Wenn bereits ein Operator gewählt wurde und wir nicht frisch resetten, 
        // könnte man hier eine Zwischenauswertung machen. (Optional)
        storedValue = currentValue;
        currentOperator = button.textContent;
        shouldResetDisplay = true;
      });
    });
  
    // 3. Gleichheits-Button (=)
    equalsButton.addEventListener('click', async () => {
      // Wenn keine gespeicherte Zahl oder kein Operator vorliegt, kann nichts berechnet werden
      if (storedValue === null || currentOperator === null) return;
  
      const num1 = parseFloat(storedValue);
      const num2 = parseFloat(currentValue);
      const op = currentOperator;
  
      // Anfrage an den Express-Server (API)
      try {
        const response = await fetch(
          `/api/calculate?num1=${num1}&num2=${num2}&op=${encodeURIComponent(op)}`
        );
        if (!response.ok) {
          // Falls ein Fehler (z.B. Division durch 0) zurückkommt
          const errorData = await response.json();
          alert(errorData.error);
          return;
        }
        // JSON-Antwort mit Ergebnis
        const data = await response.json();
        display.value = data.result;
        currentValue = data.result.toString();
        storedValue = null;
        currentOperator = null;
        shouldResetDisplay = true;
      } catch (error) {
        console.error('Fehler beim Rechnen:', error);
      }
    });
  
    // 4. Clear-Button (C)
    clearButton.addEventListener('click', () => {
      display.value = '0';
      currentValue = '0';
      storedValue = null;
      currentOperator = null;
      shouldResetDisplay = false;
    });
  });
  