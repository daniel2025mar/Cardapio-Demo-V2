// Mostrar ou esconder calculadora
export function abrirCalculadora() {
  const calc = document.getElementById("calculadora");
  if (!calc) return console.error("Elemento da calculadora não encontrado!");
  calc.classList.add("calculadora-ativa");
}

// Fechar calculadora
export function fecharCalculadora() {
  const calc = document.getElementById("calculadora");
  if (calc) calc.classList.remove("calculadora-ativa");
}

// Adicionar número ou operador no display
export function calcPress(valor) {
  const display = document.getElementById("calcDisplay");
  if (!display) return;

  const operadores = ['+', '-', '*', '/'];
  let ultimoChar = display.value.slice(-1);

  // Substituir caracteres especiais
  if (valor === '×') valor = '*';
  if (valor === '÷') valor = '/';
  if (valor === '−') valor = '-';

  // Evitar operadores repetidos
  if (operadores.includes(valor) && operadores.includes(ultimoChar)) return;

  display.value += valor;
}

// Calcular resultado
export function calcCalcular() {
  const display = document.getElementById("calcDisplay");
  if (!display) return;

  const expressao = display.value;
  if (!expressao) return;

  try {
    const resultado = Function(`return ${expressao}`)();
    display.value = resultado;
  } catch (erro) {
    display.value = "Erro!";
  }
}

// Limpar display
export function calcLimpar() {
  const display = document.getElementById("calcDisplay");
  if (display) display.value = "";
}

// Lidar com teclado físico
export function ativarTecladoCalculadora() {
  document.addEventListener("keydown", (e) => {
    const teclasPermitidas = "0123456789+-*/.";
    const display = document.getElementById("calcDisplay");
    if (!display) return;

    // Fechar calculadora com Esc
    if (e.key === "Escape") {
      fecharCalculadora();
      return;
    }

    // Enter = calcular
    if (e.key === "Enter") {
      calcCalcular();
      return;
    }

    // Backspace = apagar último
    if (e.key === "Backspace") {
      display.value = display.value.slice(0, -1);
      return;
    }

    // Se for número ou operador permitido
    if (teclasPermitidas.includes(e.key)) {
      calcPress(e.key);
    }
  });
}

// Tornar funções globais para HTML
window.abrirCalculadora = abrirCalculadora;
window.fecharCalculadora = fecharCalculadora;
window.calcPress = calcPress;
window.calcCalcular = calcCalcular;
window.calcLimpar = calcLimpar;
window.ativarTecladoCalculadora = ativarTecladoCalculadora;

// Ativar teclado assim que o módulo carregar
ativarTecladoCalculadora();
