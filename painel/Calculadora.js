// =============================
// UTILIDADES (FORMATAÇÃO)
// =============================
function formatarNumero(valor) {
  if (valor === "" || valor === "-" || isNaN(valor)) return valor;
  return Number(valor).toLocaleString("pt-BR");
}

function removerFormatacao(valor) {
  return valor.replace(/\./g, "");
}

function contemOperador(valor) {
  return /[+\-*/]/.test(valor);
}

// =============================
// MOSTRAR / FECHAR CALCULADORA
// =============================
export function abrirCalculadora() {
  const calc = document.getElementById("calculadora");
  if (!calc) return console.error("Elemento da calculadora não encontrado!");
  calc.classList.add("calculadora-ativa");
}

export function fecharCalculadora() {
  const calc = document.getElementById("calculadora");
  if (calc) calc.classList.remove("calculadora-ativa");
}

// =============================
// ADICIONAR NÚMERO OU OPERADOR
// =============================
export function calcPress(valor) {
  const display = document.getElementById("calcDisplay");
  if (!display) return;

  const operadores = ["+", "-", "*", "/"];
  let atual = removerFormatacao(display.value);
  let ultimoChar = atual.slice(-1);

  // Substituições
  if (valor === "×") valor = "*";
  if (valor === "÷") valor = "/";
  if (valor === "−") valor = "-";

  // Evitar operadores duplicados
  if (operadores.includes(valor) && operadores.includes(ultimoChar)) return;

  atual += valor;

  // Formatar somente se não houver operador
  display.value = contemOperador(atual)
    ? atual
    : formatarNumero(atual);
}

// =============================
// CALCULAR RESULTADO
// =============================
export function calcCalcular() {
  const display = document.getElementById("calcDisplay");
  if (!display) return;

  let expressao = removerFormatacao(display.value);
  if (!expressao) return;

  try {
    const resultado = Function(`return ${expressao}`)();
    display.value = formatarNumero(resultado);
  } catch {
    display.value = "Erro!";
  }
}

// =============================
// LIMPAR
// =============================
export function calcLimpar() {
  const display = document.getElementById("calcDisplay");
  if (display) display.value = "";
}

// =============================
// BACKSPACE
// =============================
export function calcBackspace() {
  const display = document.getElementById("calcDisplay");
  if (!display) return;

  let valor = removerFormatacao(display.value);
  valor = valor.slice(0, -1);
  display.value = formatarNumero(valor);
}

// =============================
// PORCENTAGEM
// =============================
export function calcPorcentagem() {
  const display = document.getElementById("calcDisplay");
  if (!display) return;

  let valor = removerFormatacao(display.value);
  if (!valor) return;

  display.value = formatarNumero(Number(valor) / 100);
}

// =============================
// RAIZ QUADRADA
// =============================
export function calcRaiz() {
  const display = document.getElementById("calcDisplay");
  if (!display) return;

  let valor = removerFormatacao(display.value);
  if (!valor) return;

  display.value = formatarNumero(Math.sqrt(Number(valor)));
}

// =============================
// POTÊNCIA (x²)
// =============================
export function calcQuadrado() {
  const display = document.getElementById("calcDisplay");
  if (!display) return;

  let valor = removerFormatacao(display.value);
  if (!valor) return;

  display.value = formatarNumero(Number(valor) ** 2);
}

// =============================
// INVERTER SINAL ±
// =============================
export function calcInverterSinal() {
  const display = document.getElementById("calcDisplay");
  if (!display) return;

  let valor = removerFormatacao(display.value);
  if (!valor) return;

  display.value = formatarNumero(Number(valor) * -1);
}

// =============================
// TECLADO FÍSICO
// =============================
export function ativarTecladoCalculadora() {
  document.addEventListener("keydown", (e) => {
    const display = document.getElementById("calcDisplay");
    if (!display) return;

    if (e.key === "Escape") fecharCalculadora();
    if (e.key === "Enter") calcCalcular();
    if (e.key === "Backspace") calcBackspace();

    if ("0123456789+-*/.".includes(e.key)) {
      calcPress(e.key);
    }
  });
}

// =============================
// FUNÇÕES GLOBAIS
// =============================
window.abrirCalculadora = abrirCalculadora;
window.fecharCalculadora = fecharCalculadora;
window.calcPress = calcPress;
window.calcCalcular = calcCalcular;
window.calcLimpar = calcLimpar;
window.calcBackspace = calcBackspace;
window.calcPorcentagem = calcPorcentagem;
window.calcRaiz = calcRaiz;
window.calcQuadrado = calcQuadrado;
window.calcInverterSinal = calcInverterSinal;
window.ativarTecladoCalculadora = ativarTecladoCalculadora;

// =============================
// ATIVAR TECLADO
// =============================
ativarTecladoCalculadora();
