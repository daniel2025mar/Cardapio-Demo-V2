// Supondo que você tenha a variável codigoComanda definida
const codigoComanda = "0001"; // pode ser qualquer código que você queira

// Gerar o código de barras dinamicamente
JsBarcode("#barcode", codigoComanda, {
  format: "CODE128",
  width: 1.5,
  height: 50,
  displayValue: false // se quiser mostrar o número embaixo, coloque true
});

// Mostrar o código no card (texto)
document.getElementById("cardNumber").innerText = codigoComanda;
