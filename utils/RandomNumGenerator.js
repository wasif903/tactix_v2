const generatedNumbers = new Set();

function generateUniqueOrderNumber(totalDigits) {
  const min = Math.pow(10, totalDigits - 1);
  const max = Math.pow(10, totalDigits) - 1;

  function generateNumber() {
    const orderNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    if (!generatedNumbers.has(orderNumber.toString())) {
      generatedNumbers.add(orderNumber.toString());
      return orderNumber.toString();
    } else {
      return generateNumber();
    }
  }

  return generateNumber();
}

export default generateUniqueOrderNumber
// Example usage
// const orderNumber = generateUniqueOrderNumber(14);
// console.log(orderNumber);
// Generates a unique 14-digit order number
