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
        storedValue = currentValue;
        currentOperator = button.textContent;
        shouldResetDisplay = true;
      });
    });
  
    // 3. Gleichheits-Button (=)
    equalsButton.addEventListener('click', () => {
      if (storedValue === null || currentOperator === null) return;
  
      const num1 = parseFloat(storedValue);
      const num2 = parseFloat(currentValue);
      let result;
  
      switch (currentOperator) {
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
            alert('Cannot divide by zero');
            return;
          }
          result = num1 / num2;
          break;
        default:
          return;
      }
  
      display.value = result;
      currentValue = result.toString();
      storedValue = null;
      currentOperator = null;
      shouldResetDisplay = true;
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
