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

  // Zahlen-Buttons
  numberButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (display.value === '0' || shouldResetDisplay) {
        display.value = button.textContent;
        shouldResetDisplay = false;
      } else {
        display.value += button.textContent;
      }
      currentValue = display.value;
    });
  });

  // Operator-Buttons
  operatorButtons.forEach(button => {
    button.addEventListener('click', () => {
      storedValue = currentValue;
      currentOperator = button.textContent;
      shouldResetDisplay = true;
    });
  });

  // Gleichheits-Button
  equalsButton.addEventListener('click', () => {
    if (storedValue === null || currentOperator === null) return;
    // Den Operator URL-kodieren, damit z.B. "+" korrekt übertragen wird
    const encodedOperator = encodeURIComponent(currentOperator);
    fetch(`/api/calculate?num1=${storedValue}&num2=${currentValue}&op=${encodedOperator}`)
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          return;
        }
        display.value = data.result;
        currentValue = data.result.toString();
        storedValue = null;
        currentOperator = null;
        shouldResetDisplay = true;
      })
      .catch(error => {
        console.error('Fehler:', error);
        alert('Serverfehler');
      });
  });

  // Clear-Button
  clearButton.addEventListener('click', () => {
    display.value = '0';
    currentValue = '0';
    storedValue = null;
    currentOperator = null;
    shouldResetDisplay = false;
  });
});
