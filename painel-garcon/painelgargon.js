/* =============================
   CONFIGURAÇÃO DO SUPABASE
============================ */

import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYWtibmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E"; // sua key

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==============================
// MOSTRAR NOME DO GARÇOM NO TOPO
// ==============================

const nomeGarcom = document.getElementById("nomeGarcom");

// Pega o usuário logado do localStorage
const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));

// Se não existir usuário, volta para login
if (!usuarioLogado) {
  window.location.href = "loginGarcom.html";
} else {
  // Mostra o nome do garçom com "Bem-vindo"
  nomeGarcom.innerText = `Bem-vindo (a), ${usuarioLogado.username}`;
}

// Elementos do tutorial
const tutorial = document.getElementById("tutorialPainel");
const btnFecharTutorial = document.getElementById("btnFecharTutorial");

// Verifica se o tutorial já foi visto
const tutorialVisto = localStorage.getItem("tutorialVisto");

if (!tutorialVisto) {
  // Mostra o tutorial
  tutorial.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // trava scroll
}

// Fecha o tutorial
btnFecharTutorial.addEventListener("click", () => {
  tutorial.classList.add("hidden");
  document.body.style.overflow = ""; // libera scroll
  localStorage.setItem("tutorialVisto", "true"); // marca como visto
});


/* =====================================================
   CONTROLE DE ACESSO – PAINEL DO GARÇOM (COM DELAY 10s)
===================================================== */

let logoutEmAndamento = false;

// 🔍 Verifica se o garçom ainda tem acesso
async function verificarAcessoGarcom() {
  if (logoutEmAndamento) return;

  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));

  // Sem sessão
  if (!usuarioLogado || !usuarioLogado.id) {
    window.location.href = "garconLogin.html";
    return;
  }

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, ativo, cargo")
    .eq("id", usuarioLogado.id)
    .maybeSingle();

  // Usuário removido
  if (error || !data) {
    iniciarLogout("⚠️ Seu acesso foi removido pelo administrador.");
    return;
  }

  // Usuário desativado
  if (data.ativo === false) {
    iniciarLogout("🚫 Seu acesso foi desativado pelo administrador.");
    return;
  }

  // Cargo incorreto
  if (data.cargo !== "Garçom") {
    iniciarLogout("⛔ Você não possui permissão para acessar este painel.");
  }
}

// ⏳ Logout forçado com mensagem por 10 segundos
function iniciarLogout(mensagem) {
  if (logoutEmAndamento) return;

  logoutEmAndamento = true;

  abrirModalErro(`
    ${mensagem}
    Você será redirecionado para o login em 10 segundos.
  `);

  setTimeout(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}

    localStorage.removeItem("usuarioLogado");
    window.location.href = "garconLogin.html";
  }, 10000); // ⏱️ 10 segundos
}

// funçao que oculta o conteudo
function toggleEstatisticas() {

  const conteudo = document.getElementById("conteudoEstatisticas");
  const icone = document.getElementById("iconeEstatisticas");

  if (!conteudo || !icone) return;

  conteudo.classList.toggle("fechado");
  icone.classList.toggle("aberto");
}

document.getElementById("campoEstatisticas")
  .addEventListener("click", toggleEstatisticas);

/* =====================================================
   RELATÓRIO PDF DO GARÇOM (COM LOGO E EMPRESA)
===================================================== */
// ✅ DATA ATUAL NO PADRÃO BRASIL
function dataHojeBrasil() {
  const hoje = new Date();
  hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
  return hoje.toISOString().split("T")[0];
}


// elementos
const selectMesa = document.getElementById("mesa");
const statusMesa = document.getElementById("statusMesa");
const textoStatus = document.getElementById("textoStatus");
const notificacao = document.getElementById("notificacao");
const somAlerta = document.getElementById("somAlerta");
const listaProdutos = document.getElementById("listaProdutos");
const inputPesquisa = document.getElementById("pesquisa");

let mesasDados = [];
let produtosDados = [];
let somLiberado = false;

// liberta o som com o primeiro clique do usuário
document.addEventListener("click", () => {
  if (!somLiberado) {
    somAlerta.play().catch(() => {});
    somAlerta.pause();
    somAlerta.currentTime = 0;
    somLiberado = true;
  }
});

async function carregarMesas() {
  const { data, error } = await supabase
    .from("mesas")
    .select("id, descricao, atendida, cliente_presente, ultimo_atendimento")
    .eq("ativo", true)
    .eq("cliente_presente", true)
    .order("numero", { ascending: true });

  if (error) {
    console.error("Erro ao carregar mesas:", error);
    selectMesa.innerHTML = `<option value="">Erro ao carregar mesas: ${error.message}</option>`;
    return;
  }

  mesasDados = data;

  selectMesa.innerHTML = '<option value="">Selecione a mesa</option>';

  data.forEach((mesa) => {
    selectMesa.innerHTML += `
      <option value="${mesa.id}">
        ${mesa.descricao}
      </option>
    `;
  });

  verificarMesasNaoAtendidas();
}


// Carrega os produtos
async function carregarProdutos() {
  const { data, error } = await supabase
    .from("produtos")
    .select("id, descricao, estoque, valor_sugerido, categoria")
    .order("descricao", { ascending: true });

  if (error) {
    console.error("Erro ao carregar produtos:", error);
    listaProdutos.innerHTML = `<p>Erro ao carregar produtos</p>`;
    return;
  }

  produtosDados = data;
  renderizarProdutos(produtosDados);
}



async function carregarProdutosPorCategoria(nomeCategoria) {
  const { data, error } = await supabase
    .from("produtos")
    .select("id, descricao, estoque, valor_sugerido, categoria")
    .eq("categoria", nomeCategoria)
    .order("descricao", { ascending: true });

  if (error) {
    console.error("Erro ao filtrar produtos:", error);
    listaProdutos.innerHTML = `
      <div class="produtoItem">
        <p>Erro ao carregar produtos</p>
      </div>
    `;
    return;
  }

  // ✅ CATEGORIA EXISTE, MAS SEM PRODUTOS
  if (!data || data.length === 0) {
    listaProdutos.innerHTML = `
      <div class="produtoItem">
        <p>
          🕒 Ainda não temos produtos nesta categoria.<br>
          <strong>Em breve serão adicionados!</strong>
        </p>
      </div>
    `;
    produtosDados = [];
    return;
  }

  produtosDados = data;
  renderizarProdutos(produtosDados);
}


// Renderiza a lista de produtos
function renderizarProdutos(produtos) {
  listaProdutos.innerHTML = "";

  produtos.forEach((produto) => {
    const estaDisponivel = produto.estoque > 0;

    listaProdutos.innerHTML += `
      <div class="produtoItem ${estaDisponivel ? "" : "produtoIndisponivel"}">
        <label>
          <input 
            type="checkbox" 
            data-id="${produto.id}" 
            ${estaDisponivel ? "" : "disabled"} 
            class="checkboxProduto"
          />
          <div class="produtoInfo">
            <strong>${produto.descricao}</strong>
            <span>
              Estoque: ${produto.estoque}
              ${estaDisponivel ? "" : " - Indisponível"}
            </span>
          </div>
        </label>

        <input 
          type="number" 
          class="quantidadeProduto" 
          data-id="${produto.id}" 
          value="1" 
          min="1" 
          max="${produto.estoque}" 
          disabled
        />
      </div>
    `;
  });

  ativarQuantidade();
}

// ELEMENTOS DO MODAL
const modalErro = document.getElementById("modalErro");
const mensagemErro = document.getElementById("mensagemErro");
const fecharModalErro = document.getElementById("fecharModalErro");
const btnOkErro = document.getElementById("btnOkErro");

// FUNÇÃO PARA ABRIR MODAL
function abrirModalErro(texto) {
  mensagemErro.textContent = texto;
  modalErro.classList.remove("hidden");
}

// FECHAR MODAL
fecharModalErro.addEventListener("click", () => {
  modalErro.classList.add("hidden");
});

btnOkErro.addEventListener("click", () => {
  modalErro.classList.add("hidden");
});

// FECHAR CLICANDO FORA
modalErro.addEventListener("click", (e) => {
  if (e.target === modalErro) {
    modalErro.classList.add("hidden");
  }
});

// Ativa checkbox e input de quantidade
function ativarQuantidade() {
  const checkboxes = document.querySelectorAll(".checkboxProduto");

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const id = checkbox.getAttribute("data-id");
      const inputQtd = document.querySelector(`.quantidadeProduto[data-id="${id}"]`);

      if (checkbox.checked) {
        inputQtd.disabled = false;
      } else {
        inputQtd.disabled = true;
        inputQtd.value = 1;
      }

      calcularTotal();
    });
  });

  const inputsQtd = document.querySelectorAll(".quantidadeProduto");

  inputsQtd.forEach((input) => {
    input.addEventListener("input", () => {
      const id = input.getAttribute("data-id");
      const produto = produtosDados.find((p) => String(p.id) === id);

      if (Number(input.value) > produto.estoque) {
        abrirModalErro(`Não temos essa quantidade em estoque!\nEstoque atual: ${produto.estoque}`);
        input.value = produto.estoque;
      }

      calcularTotal();
    });
  });
}

// Calcula o total do pedido
function calcularTotal() {
  let total = 0;

  const checkboxes = document.querySelectorAll(".checkboxProduto:checked");

  checkboxes.forEach((checkbox) => {
    const id = checkbox.getAttribute("data-id");
    const qtd = Number(document.querySelector(`.quantidadeProduto[data-id="${id}"]`).value);

    const produto = produtosDados.find((p) => String(p.id) === id);

    if (produto) {
      total += produto.valor_sugerido * qtd;
    }
  });

  document.getElementById("valorTotal").textContent = total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Busca por produto (campo pesquisa)
inputPesquisa.addEventListener("input", () => {
  const texto = inputPesquisa.value.trim().toLowerCase();

  if (texto === "") {
    renderizarProdutos(produtosDados);
    return;
  }

  const produtosFiltrados = produtosDados.filter((produto) =>
    produto.descricao.toLowerCase().includes(texto)
  );

  if (produtosFiltrados.length === 0) {
    listaProdutos.innerHTML = `
      <div class="produtoItem">
  <p> Produto não encontrado!</p>
</div>

    `;
    return;
  }

  renderizarProdutos(produtosFiltrados);
});

// FUNÇÃO DE LOGOUT
async function deslogar() {
  try {
    // Se estiver usando Supabase Auth
    await supabase.auth.signOut();

    // Remove usuário do localStorage
    localStorage.removeItem("usuarioLogado");

    // Redireciona para a tela de login do garçom
    window.location.href = "garconLogin.html";
  } catch (error) {
    console.error("Erro ao deslogar:", error);
    alert("Não foi possível sair. Tente novamente.");
  }
}

// Torna a função global para poder ser chamada pelo onclick do botão
window.deslogar = deslogar;


async function carregarCategorias() {
  const select = document.getElementById("filtroCategoria");

  // limpa opções antigas (mantém "Todos")
  select.innerHTML = `<option value="todos">Todas</option>`;

  const { data, error } = await supabase
    .from("categorias")
    .select("nome")
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao buscar categorias:", error);
    return;
  }

  data.forEach(categoria => {
    const option = document.createElement("option");
    option.value = categoria.nome;   // usa o nome para filtrar
    option.textContent = categoria.nome;
    select.appendChild(option);
  });
}

/* chama ao carregar a página */
carregarCategorias();

document.getElementById("filtroCategoria").addEventListener("change", (e) => {
  const categoriaSelecionada = e.target.value;

  if (categoriaSelecionada === "todos") {
    carregarProdutos(); // carrega todos
  } else {
    carregarProdutosPorCategoria(categoriaSelecionada);
  }
});



// Verifica mesas não atendidas
async function verificarMesasNaoAtendidas() {
  const { data, error } = await supabase
    .from("mesas")
    .select("id")
    .eq("ativo", true)
    .eq("cliente_presente", true)
    .eq("atendida", false);

  if (error) {
    console.error("Erro ao verificar mesas:", error);
    return;
  }

  if (data.length > 0) {
    notificacao.classList.remove("hidden");

    if (somLiberado) {
      somAlerta.play();
    }
  } else {
    notificacao.classList.add("hidden");
  }
}

// supabase
supabase
  .channel("mesas-realtime")
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "mesas",
    },
    (payload) => {
      const mesaAtualizada = payload.new;

      console.log("📡 Mesa alterada:", mesaAtualizada);

      // 1️⃣ Atualiza o estado local
      const index = mesasDados.findIndex(
        m => String(m.id) === String(mesaAtualizada.id)
      );

      if (index !== -1) {
        mesasDados[index] = mesaAtualizada;
      }

      // 2️⃣ Atualiza status da mesa selecionada
      atualizarStatusMesaSelecionada();

      // 3️⃣ Atualiza painel visual
      renderizarMesasPainel();

      // 🔔 4️⃣ ATUALIZA NOTIFICAÇÃO (⚠️ ISSO FALTAVA)
      verificarMesasNaoAtendidas();
    }
  )
  .subscribe();

  function renderizarMesasPainel() {
  const painel = document.getElementById("painelMesas");
  painel.innerHTML = "";

  mesasDados
    .filter(m => m.cliente_presente)
    .forEach(mesa => {
      const div = document.createElement("div");
      div.className = mesa.atendida ? "mesa atendida" : "mesa livre";
      div.textContent = mesa.descricao;
      painel.appendChild(div);
    });
}



// REALTIME PRODUTOS
supabase
  .channel("public:produtos")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "produtos" },
    () => {
      carregarProdutos();
    }
  )
  .subscribe();

// Atualiza o status quando escolher a mesa
selectMesa.addEventListener("change", () => {
  const mesaId = selectMesa.value;
  const mesa = mesasDados.find((m) => String(m.id) === mesaId);

  if (!mesa) {
    statusMesa.className = "status-mesa";
    textoStatus.textContent = "Selecione uma mesa para ver o status";
    return;
  }

  if (mesa.atendida) {
    statusMesa.className = "status-mesa atendida";
    textoStatus.textContent = `${mesa.descricao} já foi atendida.`;
  } else {
    statusMesa.className = "status-mesa nao-atendida";
    textoStatus.textContent = `${mesa.descricao} ainda não foi atendida.`;
  }
});




// Função para gerar UUID (se ainda não tiver)
function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

let canalMesasRealtime = null;



document.addEventListener("DOMContentLoaded", () => {
  carregarMesas();
  carregarProdutos();

});


async function verificarMesasInativas() {
  const agora = new Date();

  const { data: mesas, error } = await supabase
    .from("mesas")
    .select("id, ultimo_atendimento, descricao")
    .eq("atendida", true);

  if (error) {
    console.error("Erro ao buscar mesas:", error);
    return;
  }

  for (const mesa of mesas) {
    if (!mesa.ultimo_atendimento) continue;

    const ultimo = new Date(mesa.ultimo_atendimento);
    const diffSegundos = (agora - ultimo) / 1000;

    // ⏱️ 40 MINUTOS = 2400 segundos
    if (diffSegundos >= 2400) {
      const { error: updateError } = await supabase
        .from("mesas")
        .update({
          atendida: false,
          ultimo_atendimento: null
        })
        .eq("id", mesa.id);

      if (updateError) {
        console.error("Erro ao liberar mesa:", updateError);
      } else {
        console.log(`✅ Mesa ${mesa.descricao} liberada após 40 minutos`);
      }
    }
  }
}

// Verifica mesas a cada 10 segundos (pode ajustar se quiser)
setInterval(verificarMesasInativas, 10000);


// =============================
// 🔄 FUNÇÃO PARA LIBERAR MESAS APÓS 10 MINUTOS
// =============================
async function liberarMesas10Minutos() {
  try {
    const agora = new Date();

    // Busca todas as mesas que estão marcadas como atendidas
    const { data: mesas, error } = await supabase
      .from("mesas")
      .select("id, atendida, descricao, ultimo_atendimento")
      .eq("atendida", true);

    if (error) {
      console.error("Erro ao buscar mesas:", error);
      return;
    }

    if (!mesas || mesas.length === 0) return;

    for (const mesa of mesas) {
      if (!mesa.ultimo_atendimento) continue;

      const ultimo = new Date(mesa.ultimo_atendimento);
      const diffSegundos = (agora - ultimo) / 1000;
      const diffMinutos = diffSegundos / 60;

      // ⏱️ Se passou 10 minutos desde o último atendimento
      if (diffMinutos >= 10) {
        const { error: updateError } = await supabase
          .from("mesas")
          .update({
            atendida: false,
            ultimo_atendimento: null // limpa o último atendimento
          })
          .eq("id", mesa.id);

        if (updateError) {
          console.error("Erro ao liberar mesa:", updateError);
        } else {
          console.log(`✅ Mesa ${mesa.descricao} liberada automaticamente após 10 minutos`);
        }
      }
    }
  } catch (err) {
    console.error("Erro na função liberarMesas10Minutos:", err);
  }
}

// =============================
// 🔄 RODAR AUTOMATICAMENTE A CADA 1 MINUTO
// =============================
document.addEventListener("DOMContentLoaded", () => {
  setInterval(liberarMesas10Minutos, 60000); // 60.000 ms = 1 minuto
});


function atualizarStatusMesaSelecionada() {
  const mesaId = selectMesa.value;
  if (!mesaId) return;

  const mesa = mesasDados.find(m => String(m.id) === mesaId);

  statusMesa.className = "status-mesa";
  textoStatus.textContent = "Status indisponível";

  if (!mesa) return;

  if (mesa.atendida === true) {
    statusMesa.className = "status-mesa atendida";
    textoStatus.textContent = `${mesa.descricao} já foi atendida.`;
  }

  if (mesa.atendida === false) {
    statusMesa.className = "status-mesa nao-atendida";
    textoStatus.textContent = `${mesa.descricao} ainda não foi atendida.`;
  }
}

// =============================
// 🔥 REMOVE ACENTOS
// =============================
function removerAcentos(texto) {

  console.log("🔤 removerAcentos() recebido:", texto);

  if (!texto) return "";

  const resultado = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  console.log("🔤 removerAcentos() resultado:", resultado);

  return resultado;
}


// =============================
// 🔥 CONVERTE HORA PARA SEGUNDOS
// =============================
function horaParaSegundos(hora) {

  console.log("⏱️ Convertendo hora:", hora);

  if (!hora) return 0;

  const partes = hora.split(":").map(Number);

  if (partes.length !== 3 || partes.some(isNaN)) {
    console.error("❌ Hora inválida:", hora);
    return 0;
  }

  const segundos = partes[0] * 3600 + partes[1] * 60 + partes[2];

  console.log("⏱️ Hora em segundos:", segundos);

  return segundos;
}


// =============================
// ✅ VERIFICAR HORÁRIO
// =============================
async function verificarHorarioPedido() {

  console.log("========== 🚀 INÍCIO VERIFICAÇÃO HORÁRIO ==========");

  try {

    const agora = new Date();
    console.log("📆 Data completa agora:", agora);

    const diasSemana = [
      "domingo",
      "segunda",
      "terça",
      "quarta",
      "quinta",
      "sexta",
      "sábado"
    ];

    let diaAtual = diasSemana[agora.getDay()];
    console.log("📅 Dia original:", diaAtual);

    diaAtual = removerAcentos(diaAtual);

    const horaAtual = agora.toTimeString().split(" ")[0];
    console.log("⏰ Hora atual:", horaAtual);

    // 🔎 Consulta Supabase
    console.log("📡 Consultando Supabase...");

    const { data, error } = await supabase
      .from("horarios_semana")
      .select("hora_inicio, hora_fim")
      .eq("dia_semana", diaAtual)
      .maybeSingle();

    console.log("📡 Resposta Supabase:", data, error);

    if (error || !data) {
      console.error("❌ Erro ou sem dados do Supabase");
      return false;
    }

    const horaInicio = data.hora_inicio;
    const horaFim = data.hora_fim;

    console.log("🕒 Hora início banco:", horaInicio);
    console.log("🕒 Hora fim banco:", horaFim);

    const atualSeg = horaParaSegundos(horaAtual);
    const inicioSeg = horaParaSegundos(horaInicio);
    const fimSeg = horaParaSegundos(horaFim);

    console.log("📊 Segundos atual:", atualSeg);
    console.log("📊 Segundos início:", inicioSeg);
    console.log("📊 Segundos fim:", fimSeg);

    let permitido = false;

    // 🔥 Horário que passa da meia-noite (sexta)
    if (fimSeg < inicioSeg) {

      console.log("🌙 Horário atravessa meia-noite");

      permitido = atualSeg >= inicioSeg || atualSeg <= fimSeg;

    } else {

      permitido = atualSeg >= inicioSeg && atualSeg <= fimSeg;
    }

    console.log("✅ Resultado permitido:", permitido);
    console.log("========== ✅ FIM VERIFICAÇÃO HORÁRIO ==========");

    return permitido;

  } catch (erro) {

    console.error("❌ Erro geral validação horário:", erro);
    return false;
  }
}


// =============================
// 📦 FUNÇÃO GLOBAL ENVIAR PEDIDO
// =============================
window.enviarPedido = async function () {

  console.log("📦 Função enviarPedido executada");

  try {

    // 👉 Aqui entra seu código real de envio
    alert("Pedido enviado com sucesso!");

  } catch (erro) {

    console.error("Erro ao enviar pedido:", erro);
    abrirModalErro("Erro ao enviar pedido.");
  }
};

let mesasPrioridade = []; // todas as mesas ocupadas
let mesasPrioridadeNaoAtendidas = []; // apenas mesas com atendida = false
let liMesasMap = new Map(); // <li> de cada mesa

// 1️⃣ Carrega mesas do Supabase
async function atualizarPrioridadeMesas() {
  try {
    const { data: mesas, error } = await supabase
      .from("mesas")
      .select("*")
      .eq("cliente_presente", true) // somente mesas ocupadas
      .eq("ativo", true);           // somente mesas ativas

    if (error) {
      console.error("Erro ao buscar mesas:", error);
      return;
    }

    // Salva mesas e transforma hora_ocupada em Date
    mesasPrioridade = mesas.map(m => ({
      ...m,
      hora_ocupada: m.hora_ocupada ? new Date(m.hora_ocupada) : new Date()
    }));

    // Filtra apenas as mesas não atendidas para lista de prioridade
    mesasPrioridadeNaoAtendidas = mesasPrioridade.filter(m => !m.atendida);

    atualizarSelectMesas();              // todas mesas ocupadas
    atualizarListaPrioridade();          // só as não atendidas
    atualizarNotificacao();

  } catch (err) {
    console.error("Erro na prioridade de mesas:", err);
  }
}

// 2️⃣ Atualiza select de mesas (todas ocupadas)
function atualizarSelectMesas() {
  const selectMesa = document.getElementById("mesa");
  if (!selectMesa) return;

  const mesaSelecionadaAnterior = selectMesa.value;
  selectMesa.innerHTML = '<option value="">Selecione a mesa</option>';

  mesasPrioridade.forEach(mesa => {
    const option = document.createElement("option");
    option.value = mesa.id;
    option.textContent = mesa.descricao;
    selectMesa.appendChild(option);
  });

  // Mantém mesa selecionada se ainda existir
  if (mesaSelecionadaAnterior && mesasPrioridade.some(m => String(m.id) === mesaSelecionadaAnterior)) {
    selectMesa.value = mesaSelecionadaAnterior;
  }
}

// 3️⃣ Cria ou atualiza lista de prioridade (somente mesas não atendidas)
// controla timers ativos
let timersMesas = new Map();

// 3️⃣ Cria ou atualiza lista de prioridade (somente mesas não atendidas)
function atualizarListaPrioridade() {
  const listaPrioridade = document.getElementById("listaPrioridadeMesas");
  if (!listaPrioridade) return;

  mesasPrioridadeNaoAtendidas.forEach(mesa => {
    let li = liMesasMap.get(mesa.id);

    if (!li) {
      li = document.createElement("li");
      listaPrioridade.appendChild(li);
      liMesasMap.set(mesa.id, li);
    }

    atualizarLiTempo(li, mesa);
  });

  // Remove <li> de mesas que não estão mais na lista de prioridade
  liMesasMap.forEach((li, id) => {
    if (!mesasPrioridadeNaoAtendidas.some(m => m.id === id)) {

      // 🔥 RESET TEMPO
      resetarTempoMesa(id);

      // 🔥 REMOVE TIMER
      if (timersMesas.has(id)) {
        clearInterval(timersMesas.get(id));
        timersMesas.delete(id);
      }

      li.remove();
      liMesasMap.delete(id);
    }
  });
}


// 4️⃣ Atualiza tempo de cada <li> a cada segundo
function atualizarLiTempo(li, mesa) {

  const key = `mesa_tempo_${mesa.id}`;
  let horaOcupada = localStorage.getItem(key);

  // se não existir tempo salvo, salva novo
  if (!horaOcupada) {
    horaOcupada = mesa.hora_ocupada;
    localStorage.setItem(key, horaOcupada);
  } else {
    horaOcupada = new Date(horaOcupada);
  }

  // 🔥 Evita criar múltiplos timers
  if (timersMesas.has(mesa.id)) return;

  function atualizar() {
    const agora = new Date();
    const tempo = Math.floor((agora - new Date(horaOcupada)) / 60000);

    li.textContent = `${mesa.descricao} - ${tempo} min sem pedido`;

    if (tempo > 20) li.style.color = "red";
    else if (tempo > 10) li.style.color = "orange";
    else li.style.color = "green";
  }

  atualizar();

  const timer = setInterval(atualizar, 1000);
  timersMesas.set(mesa.id, timer);
}


// 🔥 Função resetar tempo
function resetarTempoMesa(mesaId) {
  localStorage.removeItem(`mesa_tempo_${mesaId}`);
}


// 5️⃣ Atualiza notificação geral
function atualizarNotificacao() {
  const notificacao = document.getElementById("notificacao");
  const somAlerta = document.getElementById("somAlerta");

  if (!notificacao) return;

  if (mesasPrioridadeNaoAtendidas.length > 0) {
    notificacao.classList.remove("hidden");
    notificacao.innerHTML = `⚠️ Existem mesas aguardando atendimento no momento.`;
    if (somAlerta && somAlerta.paused) somAlerta.play().catch(() => {});
  } else {
    notificacao.classList.add("hidden");
  }
}

// 🔄 Atualiza tempo das mesas em tempo real (1s)
setInterval(() => atualizarListaPrioridade(), 1000);

// 🔄 Atualiza mesas do Supabase a cada 15s
setInterval(atualizarPrioridadeMesas, 15000);

// Chamada inicial
atualizarPrioridadeMesas();

// =============================
// 🔹 CORREÇÃO NA VALIDAÇÃO DO BOTÃO ENVIAR
// =============================
function validarMesaSelecionada(mesaId) {
  // Usa mesasPrioridade para validar, não mesasDados
  return mesasPrioridade.some(m => String(m.id) === String(mesaId));
}

// =============================
// FUNÇÃO DO MODAL GERAR COMANDA
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const modalGerarComanda = document.getElementById("modalGerarComanda");
  if (!modalGerarComanda) return;

  const btnFecharModal = document.getElementById("btnFecharModalCliente");
  const btnCancelarCliente = document.getElementById("btnCancelarCliente");
  const btnConfirmarCliente = document.getElementById("btnConfirmarCliente");
  const inputNomeCliente = document.getElementById("nomeClienteInput");

  // Função para abrir modal
  function abrirModalComanda() {
    if (!modalGerarComanda.classList.contains("hidden")) return;
    inputNomeCliente.value = ""; // Limpa campo
    modalGerarComanda.classList.remove("hidden");
    inputNomeCliente.focus();
  }

  // Função para fechar modal
  function fecharModalComanda() {
    modalGerarComanda.classList.add("hidden");
  }

  // Clique no X para fechar
  btnFecharModal?.addEventListener("click", fecharModalComanda);

  // Clique no botão Cancelar
  btnCancelarCliente?.addEventListener("click", fecharModalComanda);

  // Clique no botão Confirmar
  btnConfirmarCliente?.addEventListener("click", () => {
    const nomeCliente = inputNomeCliente.value.trim();
    if (!nomeCliente) {
      alert("Informe o nome do cliente para gerar a comanda.");
      return;
    }

    // Aqui você pode gerar a comanda (PDF, impressão, etc.)
    console.log("📝 Comanda gerada para:", nomeCliente);

    // Fecha o modal após confirmar
    fecharModalComanda();
  });

  // Exporta função para o botão enviar
  window.abrirModalGerarComandaAsync = async function () {
    return new Promise((resolve) => {
      abrirModalComanda();

      // Espera o usuário clicar em Confirmar ou Cancelar/Fechar
      function handleClose() {
        modalGerarComanda.removeEventListener("click", handleClose);
        resolve();
      }

      // Escuta botão Confirmar ou Fechar
      btnConfirmarCliente.addEventListener("click", () => resolve(), { once: true });
      btnCancelarCliente.addEventListener("click", () => resolve(), { once: true });
      btnFecharModal.addEventListener("click", () => resolve(), { once: true });
    });
  };
});



// Exemplo de uso ao atualizar dashboard


document.addEventListener("DOMContentLoaded", async () => {
  await carregarMesas();
  await carregarProdutos();


  // Atualiza Supabase com os valores carregados
  await atualizarDashboard();

  // 🔔 verifica logo ao abrir a tela
  verificarMesasNaoAtendidas();
});

// ================================
// FUNÇÃO PARA CARREGAR RELATÓRIO DO DIA
// ================================
async function carregarRelatorioDiario() {
  try {
    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuarioLogado) return;

    const hoje = new Date().toISOString().split("T")[0]; // formato YYYY-MM-DD

    const { data, error } = await supabase
      .from("relatorio_diario_garcom")
      .select("*")
      .eq("garcom_id", usuarioLogado.id)
      .eq("data", hoje);

    if (error) {
      console.error("Erro ao buscar relatório:", error);
      return;
    }

    if (!data || data.length === 0) {
      // Se não tiver registro ainda
      document.getElementById("mesasAtendidas").textContent = 0;
      document.getElementById("pedidosDia").textContent = 0;
      document.getElementById("totalFaturado").textContent = "R$ 0,00";
      return;
    }

    // Se tiver registro (ou vários)
    let totalMesas = 0;
    let totalPedidos = 0;
    let totalFaturado = 0;

    data.forEach(item => {
      totalMesas += item.mesas_atendidas || 0;
      totalPedidos += item.total_pedidos || 0;
      totalFaturado += Number(item.total_faturado) || 0;
    });

    document.getElementById("mesasAtendidas").textContent = totalMesas;
    document.getElementById("pedidosDia").textContent = totalPedidos;
    document.getElementById("totalFaturado").textContent =
      totalFaturado.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });

  } catch (err) {
    console.error("Erro geral ao carregar relatório:", err);
  }
}

carregarRelatorioDiario();

// =============================
// ✅ BOTÃO ENVIAR COMPLETO (RELATORIO_DIARIO_GARCOM)
// =============================

document.addEventListener("DOMContentLoaded", () => {

  const btnEnviar = document.querySelector(".btn-enviar");
  if (!btnEnviar) return;

  // =========================
  // MODAL DE MENSAGEM
  // =========================
  const modalMensagem = document.getElementById("modalMensagem");
  const textoModalMensagem = document.getElementById("textoModalMensagem");
  const btnFecharModalMensagem = document.getElementById("fecharModalMensagem");
  const btnOkModalMensagem = document.getElementById("btnOkModalMensagem");

  function abrirModalMensagem(mensagem) {
    textoModalMensagem.textContent = mensagem;
    modalMensagem.style.display = "flex";
  }

  function fecharModalMensagem() {
    modalMensagem.style.display = "none";
  }

  btnFecharModalMensagem.addEventListener("click", fecharModalMensagem);
  btnOkModalMensagem.addEventListener("click", fecharModalMensagem);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalMensagem.style.display === "flex") {
      fecharModalMensagem();
    }
  });

  // =========================
  // FUNÇÃO PARA SALVAR RELATÓRIO DIÁRIO
  // =========================
  async function salvarRelatorioDiario(usuarioLogado, totalPedido, totalItens) {
    try {
      const hoje = new Date();
      const { data, error } = await supabase
        .from("relatorio_diario_garcom")
        .insert([{
          garcom_id: usuarioLogado.id || null,
          nome_garcom: usuarioLogado.username || null,
          data: hoje,
          mesas_atendidas: 1,
          total_pedidos: 1,
          total_faturado: totalPedido || 0,
          created_at: new Date(),
          updated_at: new Date()
        }])
        .select()
        .maybeSingle();

      if (error) {
        console.error("Erro ao salvar relatório diário:", error);
        return;
      }

      console.log("✅ Relatório diário atualizado:", data);

    } catch (err) {
      console.error("Erro geral ao salvar relatório diário:", err);
    }
  }

  // =========================
  // EVENTO BOTÃO ENVIAR
  // =========================
  btnEnviar.addEventListener("click", async () => {

    try {
      console.log("🚀 Iniciando envio pedido");

      const permitido = await verificarHorarioPedido();
      if (!permitido) {
        abrirModalMensagem("🚫 Fora do horário de atendimento.");
        return;
      }

      const mesaSelecionada = selectMesa.value;
      if (!mesaSelecionada) {
        abrirModalMensagem("Selecione uma mesa.");
        return;
      }

      const mesa = mesasDados.find(m => String(m.id) === mesaSelecionada);
      if (!mesa) {
        abrirModalMensagem("Mesa inválida.");
        return;
      }

      if (mesa.atendida) {
        abrirModalMensagem(`⚠️ ${mesa.descricao} já foi atendida.`);
        return;
      }

      const checkboxes = document.querySelectorAll(".checkboxProduto:checked");
      if (checkboxes.length === 0) {
        abrirModalMensagem("Selecione pelo menos um produto.");
        return;
      }

      const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
      if (!usuarioLogado) {
        abrirModalMensagem("Garçom não identificado.");
        return;
      }

      // =========================
      // CALCULAR ITENS
      // =========================
      let totalPedido = 0;
      let totalItens = 0;

      const itensPedido = Array.from(checkboxes).map(checkbox => {
        const idProduto = checkbox.dataset.id;
        const produto = produtosDados.find(p => String(p.id) === idProduto);

        const inputQtd = document.querySelector(`.quantidadeProduto[data-id="${idProduto}"]`);
        const quantidade = inputQtd ? Number(inputQtd.value) : 1;

        const subtotal = produto.valor_sugerido * quantidade;
        totalPedido += subtotal;
        totalItens += quantidade;

        return {
          id: produto.id,
          nome: produto.nome,
          quantidade,
          valor_unitario: produto.valor_sugerido,
          subtotal
        };
      });

      // =========================
      // PEGAR NOME CLIENTE
      // =========================
      await window.abrirModalGerarComandaAsync();

      const inputNomeCliente =
        document.querySelector("#modalGerarComanda input[name='nomeCliente']") ||
        document.querySelector("#nomeClienteInput");

      const nomeCliente = inputNomeCliente?.value.trim();
      if (!nomeCliente) {
        abrirModalMensagem("Informe o nome do cliente.");
        return;
      }

      // =========================
      // 0️⃣ VERIFICAR SE JÁ EXISTE COMANDA ABERTA
      // =========================
      const { data: comandaAberta, error: erroBuscaComanda } = await supabase
        .from("comandas")
        .select("*")
        .eq("cliente_nome", nomeCliente)
        .eq("status", "aberta")
        .maybeSingle(); // retorna null se não existir

      if (erroBuscaComanda) {
        console.error("Erro ao verificar comanda aberta:", erroBuscaComanda);
        abrirModalMensagem("Erro ao verificar comanda aberta.");
        return;
      }

      if (comandaAberta) {
        abrirModalMensagem(`⚠️ Existe uma comanda aberta para o cliente "${nomeCliente}". Não é possível fazer novos pedidos.`);
        return;
      }

      // =========================
      // 1️⃣ CRIAR COMANDA
      // =========================
      const { error: erroComanda } = await supabase
        .from("comandas")
        .insert([{
          cliente_nome: nomeCliente,
          mesa_id: mesa.id,
          cadeira: 1,
          data_abertura: new Date(),
          status: "aberta"
        }]);

      if (erroComanda) {
        console.error("Erro ao criar comanda:", erroComanda);
        abrirModalMensagem("Erro ao criar comanda.");
        return;
      }

      // =========================
      // 2️⃣ CRIAR PEDIDO
      // =========================
      const { error: erroPedido } = await supabase
        .from("pedidos")
        .insert([{
          subtotal: totalPedido,
          total: totalPedido,
          criado_em: new Date(),
          itens: itensPedido,
          cliente: nomeCliente,
          status: "aberto",
          pagamento: "não informado",
          tipo_entrega: "mesa",
          horario_recebido: new Date().toISOString()
        }]);

      if (erroPedido) {
        console.error("Erro ao salvar pedido:", erroPedido);
        abrirModalMensagem("Erro ao salvar pedido.");
        return;
      }

      // =========================
      // 3️⃣ ATUALIZAR MESA
      // =========================
      await supabase
        .from("mesas")
        .update({
          atendida: true,
          ativo: true,
          ultimo_atendimento: new Date()
        })
        .eq("id", mesa.id);

      // =========================
      // 4️⃣ SALVAR RELATÓRIO DIÁRIO
      // =========================
      await salvarRelatorioDiario(usuarioLogado, totalPedido, totalItens);

      // =========================
      // LIMPAR TELA
      // =========================
      document.querySelectorAll(".checkboxProduto").forEach(c => c.checked = false);
      document.querySelectorAll(".quantidadeProduto").forEach(q => {
        q.disabled = true;
        q.value = 1;
      });

      calcularTotal();

      abrirModalErro("Pedido enviado com sucesso!");

    } catch (erro) {
      console.error("Erro geral:", erro);
      abrirModalMensagem("Erro ao enviar pedido.");
    }

  });

});



// ==============================
// CONEXÃO GARÇOM - CORRIGIDO
// ==============================
let garcomServidorOnline = true;       // Estado real do servidor
let garcomModalAberto = false;         // Se modal está realmente aberto
let garcomAnimacaoPontinhos = null;    // Intervalo da animação "..."

async function verificarServidorGarcom() {
  const modal = document.getElementById("modalGarcomMaintenance");
  const title = document.getElementById("modalGarcomTitle");
  const msg = document.getElementById("modalGarcomMsg");

  if (!modal) return;

  try {
    // Tenta acessar tabela leve
    const { error } = await supabase
      .from("mesas")
      .select("id")
      .limit(1);

    if (error) throw error;

    // ✅ Servidor online
    if (!garcomServidorOnline) {
      // Antes estava offline → fechar modal
      garcomServidorOnline = true;

      if (garcomModalAberto) {
        modal.classList.remove("show");
        garcomModalAberto = false;

        // Limpa animação
        clearInterval(garcomAnimacaoPontinhos);
        garcomAnimacaoPontinhos = null;
      }
    }

  } catch (err) {
    console.error("🚨 Não foi possível conectar ao Supabase (garçom):", err);

    // ❌ Servidor offline
    if (garcomServidorOnline) {
      // Só ativa o modal se o estado mudou
      garcomServidorOnline = false;

      // Configura modal de conexão
      title.textContent = "Servidor em manutenção";
      msg.textContent = "Nosso sistema está temporariamente indisponível. Por favor, tente novamente mais tarde.";

      modal.classList.add("show");
      garcomModalAberto = true;

      // Inicia animação de pontinhos se não estiver rodando
      if (!garcomAnimacaoPontinhos) {
        let dots = 0;
        garcomAnimacaoPontinhos = setInterval(() => {
          dots = (dots + 1) % 4;
          msg.textContent = "Aguarde enquanto verificamos a conexão" + ".".repeat(dots);
        }, 500);
      }
    }
  }
}

// Executa ao abrir e a cada 5 segundos
document.addEventListener("DOMContentLoaded", () => {
  verificarServidorGarcom();
  setInterval(verificarServidorGarcom, 5000);
});

function inicializarMenuLateral() {
  const menuLateral = document.getElementById("menuLateral");
  const btnAbrirMenu = document.getElementById("btnAbrirMenu");
  const btnFecharMenu = document.getElementById("btnFecharMenu");
  const body = document.body;

  // Abrir menu
  btnAbrirMenu.addEventListener("click", () => {
    menuLateral.style.left = "0";
    body.classList.add("menu-aberto");
  });

  // Fechar menu
  btnFecharMenu.addEventListener("click", () => {
    menuLateral.style.left = "-260px";
    body.classList.remove("menu-aberto");
  });

  // Submenus expansíveis
  document.querySelectorAll(".menu-item.expandivel").forEach(item => {
    item.addEventListener("click", () => {
      const submenu = item.nextElementSibling;
      const seta = item.querySelector(".seta");

      if (submenu.style.display === "block") {
        submenu.style.display = "none";
        seta.textContent = "▾";
      } else {
        submenu.style.display = "block";
        seta.textContent = "▴";
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  inicializarMenuLateral();
});

// modal abrir comandas
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modalComandas");
  const btnFechar = modal.querySelector(".close-modal");
  const menuLateral = document.getElementById("menuLateral"); // menu lateral

  // Função para abrir o modal
  function abrirModal() {
    modal.classList.add("aberto"); // adiciona classe para mostrar modal
    modal.style.display = "flex";  // garante visibilidade
    document.getElementById("inputCliente").focus();
  }

  // Função para fechar o modal
  function fecharModal() {
    modal.classList.remove("aberto");
    modal.style.display = "none";
    document.getElementById("inputCliente").value = "";
    document.getElementById("resultadoComanda").innerHTML = "";
  }

  // Função para fechar o menu lateral
  function fecharMenuLateral() {
    menuLateral.classList.remove("aberto");
    menuLateral.style.left = "-240px"; // força o fechamento
  }

  // Abrir modal ao clicar em "Ver Comandas"
  document.querySelectorAll(".submenu-item").forEach(item => {
    if (item.textContent.trim() === "Ver Comandas") {
      item.addEventListener("click", () => {
        fecharMenuLateral(); // fecha o menu lateral
        abrirModal();        // abre o modal
      });
    }
  });

  // Fechar modal ao clicar no X
  btnFechar.addEventListener("click", fecharModal);

  // Fechar modal ao clicar fora do conteúdo
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      fecharModal();
    }
  });
});


// ===============================
// EVENTO DO BOTÃO PESQUISAR
// ===============================
document
  .getElementById("btnPesquisarCliente")
  .addEventListener("click", buscarComandaPorCliente);

// ===============================
// BUSCAR COMANDA PELO NOME (TABELA: comandas)
// ===============================
async function buscarComandaPorCliente() {
  const nomeCliente = document.getElementById("inputCliente").value.trim();
  const resultadoDiv = document.getElementById("resultadoComanda");

  if (!nomeCliente) {
    resultadoDiv.innerHTML = "<p style='color:red;'>Digite um nome para pesquisar.</p>";
    return;
  }

  resultadoDiv.innerHTML = "<p>🔎 Buscando...</p>";

  try {
    const { data, error } = await supabase
      .from("comandas")
      .select("*")
      .ilike("cliente_nome", `%${nomeCliente}%`)
      .eq("status", "aberta")
      .order("data_abertura", { ascending: false });

    console.log("🔹 Resultado da busca de comandas:", data, error);

    if (error) throw error;

    if (!data || data.length === 0) {
      resultadoDiv.innerHTML = "<p>Nenhuma comanda aberta encontrada.</p>";
      return;
    }

    // Monta HTML das comandas encontradas
    resultadoDiv.innerHTML = data.map(comanda => `
      <div class="card-comanda">
        <p><strong>Cliente:</strong> ${comanda.cliente_nome}</p>
        <p><strong>Mesa:</strong> ${comanda.mesa_id}</p>
        <p><strong>Cadeira:</strong> ${comanda.cadeira}</p>
        <p><strong>Aberta em:</strong> ${new Date(comanda.data_abertura).toLocaleString()}</p>
        <button class="btn-abrir-comanda" data-id="${comanda.id}" data-cliente="${comanda.cliente_nome}">
          Abrir Comanda
        </button>
      </div>
    `).join("");

    // Evento botão abrir
    document.querySelectorAll(".btn-abrir-comanda").forEach(btn => {
      btn.addEventListener("click", () => {
        const comandaId = btn.getAttribute("data-id");
        const nomeCliente = btn.getAttribute("data-cliente");
        console.log("🔹 Abrindo comanda ID:", comandaId, "Cliente:", nomeCliente);
        abrirComanda(comandaId, nomeCliente);
      });
    });

  } catch (err) {
    console.error("❌ Erro ao buscar comandas:", err);
    resultadoDiv.innerHTML = "<p style='color:red;'>Erro ao buscar comandas.</p>";
  }
}

// ===============================
// ABRIR COMANDA (TABELA: pedidos)
// Mostra os itens bonitinhos
// ===============================
// ===============================
// ABRIR COMANDA (TABELA: pedidos)
// ===============================
async function abrirComanda(comandaId, nomeCliente) {
  const resultadoDiv = document.getElementById("resultadoComanda");
  resultadoDiv.innerHTML = "<p>🔄 Carregando pedidos...</p>";

  try {
    // Busca pedidos do cliente com status aberto
    const { data: pedidos, error: pedidosError } = await supabase
      .from("pedidos")
      .select("itens, total")
      .eq("cliente", nomeCliente)
      .eq("status", "aberto");

    console.log("🔹 Resultado da busca de pedidos:", pedidos, pedidosError);

    if (pedidosError) throw pedidosError;
    if (!pedidos || pedidos.length === 0) {
      resultadoDiv.innerHTML = "<p>Essa comanda ainda não possui pedidos.</p>";
      return;
    }

    let totalGeral = 0;

    const htmlPedidos = await Promise.all(
      pedidos.map(async (pedido, index) => {
        totalGeral += Number(pedido.total || 0);

        // Para cada item do pedido, buscamos o nome do produto na tabela 'produtos'
        const itensHTML = await Promise.all(
          pedido.itens.map(async item => {
            const { data: produtoData, error: produtoError } = await supabase
              .from("produtos")
              .select("descricao")
              .eq("id", item.id)
              .single();

            let nomeProduto = item.id; // default caso não encontre
            if (produtoError) {
              console.warn(`Produto não encontrado para id ${item.id}:`, produtoError);
            } else if (produtoData && produtoData.descricao) {
              nomeProduto = produtoData.descricao;
            }

            const qtd = Number(item.quantidade);
            const preco = Number(item.valor_unitario);
            const subtotal = Number(item.subtotal || qtd * preco);

            return `
              <div class="item-pedido" style="padding:5px 0; border-bottom:1px solid #ddd;">
                <p><strong>${nomeProduto}</strong></p>
                <p>Qtd: ${qtd} | Preço Unitário: R$ ${preco.toFixed(2)} | Subtotal: R$ ${subtotal.toFixed(2)}</p>
              </div>
            `;
          })
        );

        return `
          <div class="pedido-comanda" style="margin-bottom:15px; padding:10px; background:#f9f9f9; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <p><strong>Pedido ${index + 1}</strong></p>
            ${itensHTML.join("")}
            <p style="text-align:right; font-weight:bold; margin-top:5px;">Total do Pedido: R$ ${Number(pedido.total).toFixed(2)}</p>
          </div>
        `;
      })
    );

    resultadoDiv.innerHTML = `
      <h3>Pedidos da Comanda</h3>
      ${htmlPedidos.join("")}
      <h3>Total Geral: R$ ${totalGeral.toFixed(2)}</h3>
      <br>
      <button id="btnVoltar">⬅ Voltar</button>
    `;

    // Botão voltar
    document.getElementById("btnVoltar")
      .addEventListener("click", buscarComandaPorCliente);

  } catch (err) {
    console.error("❌ Erro ao buscar pedidos:", err);
    resultadoDiv.innerHTML = "<p style='color:red;'>Erro ao carregar pedidos.</p>";
  }
}


document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // MODAIS
  // =========================
  const modalAdicionarPedido = document.getElementById("modalAdicionarPedidoModal");
  const btnFecharModalAdicionarPedido = document.getElementById("fecharModalAdicionarPedidoModal");
  const btnConfirmarCliente = document.getElementById("btnConfirmarClienteModal");
  const inputNomeCliente = document.getElementById("inputNomeClienteModal");
  const btnAbrirModalAdicionarPedido = document.getElementById("btnAbrirAdicionarPedido");

  const adicionarPedidosContainer = document.getElementById("adicionarPedidosContainer");
  const inputNovoPedido = document.getElementById("inputNovoPedido");
  const inputQuantidadePedido = document.getElementById("inputQuantidadePedido");
  const btnAdicionarPedido = document.getElementById("btnAdicionarPedido");
  const listaPedidos = document.getElementById("listaPedidos");

  // =========================
  // MODAL DE MENSAGEM
  // =========================
  const modalMensagem = document.getElementById("modalMensagem");
  const textoModalMensagem = document.getElementById("textoModalMensagem");
  const btnFecharModalMensagem = document.getElementById("fecharModalMensagem");
  const btnOkModalMensagem = document.getElementById("btnOkModalMensagem");

  function abrirModalMensagem(mensagem) {
    textoModalMensagem.textContent = mensagem;
    modalMensagem.style.display = "flex";     // flex para centralizar
    modalMensagem.style.zIndex = "99999";     // garantir acima de tudo
  }

  function fecharModalMensagem() {
    modalMensagem.style.display = "none";
  }

  btnFecharModalMensagem.addEventListener("click", fecharModalMensagem);
  btnOkModalMensagem.addEventListener("click", fecharModalMensagem);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalMensagem.style.display === "flex") {
      fecharModalMensagem();
    }
  });

  // =========================
  // MENSAGEM DE ERRO PRODUTO
  // =========================
  let msgErroProduto = document.createElement("p");
  msgErroProduto.style.color = "red";
  msgErroProduto.style.fontSize = "13px";
  msgErroProduto.style.marginTop = "4px";
  inputNovoPedido.insertAdjacentElement("afterend", msgErroProduto);

  // =========================
  // CONTAINER PARA INPUT + LISTA DE SUGESTÕES
  // =========================
  const containerInputProduto = document.createElement("div");
  containerInputProduto.style.position = "relative";
  inputNovoPedido.parentNode.insertBefore(containerInputProduto, inputNovoPedido);
  containerInputProduto.appendChild(inputNovoPedido);

  let listaSugestoes = document.createElement("ul");
  listaSugestoes.style.border = "1px solid #ccc";
  listaSugestoes.style.borderRadius = "6px";
  listaSugestoes.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
  listaSugestoes.style.maxHeight = "150px";
  listaSugestoes.style.overflowY = "auto";
  listaSugestoes.style.padding = "5px 0";
  listaSugestoes.style.background = "#fff";
  listaSugestoes.style.position = "absolute";
  listaSugestoes.style.top = inputNovoPedido.offsetHeight + "px";
  listaSugestoes.style.left = "0";
  listaSugestoes.style.width = "100%";
  listaSugestoes.style.zIndex = 1000;
  listaSugestoes.style.display = "none";
  containerInputProduto.appendChild(listaSugestoes);

  let comandaAtualId = null;

  // =========================
  // FUNÇÕES MODAL ADICIONAR PEDIDO
  // =========================
  function abrirModalAdicionarPedido() {
    modalAdicionarPedido.classList.add("show");
    inputNomeCliente.value = "";
    inputNomeCliente.focus();
    adicionarPedidosContainer.style.display = "none";
    listaPedidos.innerHTML = "";
    comandaAtualId = null;
    msgErroProduto.textContent = "";
    listaSugestoes.style.display = "none";
  }

  function fecharModalAdicionarPedido() {
    modalAdicionarPedido.classList.remove("show");
    msgErroProduto.textContent = "";
    listaSugestoes.style.display = "none";
  }

  btnAbrirModalAdicionarPedido.addEventListener("click", (e) => {
    e.preventDefault();
    abrirModalAdicionarPedido();
  });

  btnFecharModalAdicionarPedido.addEventListener("click", fecharModalAdicionarPedido);
  modalAdicionarPedido.addEventListener("click", (e) => {
    if (e.target === modalAdicionarPedido) fecharModalAdicionarPedido();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalAdicionarPedido.classList.contains("show")) {
      fecharModalAdicionarPedido();
    }
  });

  // =========================
  // CONFIRMAR CLIENTE
  // =========================
  btnConfirmarCliente.addEventListener("click", async () => {
    const nomeCliente = inputNomeCliente.value.trim();
    if (!nomeCliente) {
      abrirModalMensagem("Informe o nome do cliente!");
      inputNomeCliente.focus();
      return;
    }
    await verificarComandaAberta(nomeCliente);
  });

  async function verificarComandaAberta(nomeCliente) {
    const { data, error } = await supabase
      .from("comandas")
      .select("*")
      .eq("cliente_nome", nomeCliente)
      .eq("status", "aberta");

    if (error) {
      console.error("Erro ao verificar comanda:", error);
      return;
    }

    if (data && data.length > 0) {
      abrirModalMensagem(`⚠️ O cliente "${nomeCliente}" já possui uma comanda aberta.`);
      comandaAtualId = data[0].id;
      adicionarPedidosContainer.style.display = "block";
      inputNovoPedido.focus();
      listaPedidos.innerHTML = "";

      // Sugestões de produtos
      inputNovoPedido.addEventListener("input", async () => {
        const termo = inputNovoPedido.value.trim();
        if (!termo) {
          listaSugestoes.style.display = "none";
          msgErroProduto.textContent = "";
          return;
        }

        const { data: produtosData, error: produtosError } = await supabase
          .from("produtos")
          .select("descricao")
          .ilike("descricao", `%${termo}%`)
          .eq("situacao", "ativo")
          .limit(10);

        if (produtosError || !produtosData || produtosData.length === 0) {
          msgErroProduto.textContent = `❌ Produto "${termo}" não existe no sistema.`;
          listaSugestoes.style.display = "none";
          return;
        }

        msgErroProduto.textContent = "";
        listaSugestoes.innerHTML = "";
        produtosData.forEach(p => {
          const li = document.createElement("li");
          li.textContent = p.descricao;
          li.style.cursor = "pointer";
          li.style.padding = "6px 10px";
          li.style.transition = "background 0.2s";
          li.addEventListener("mouseover", () => li.style.backgroundColor = "#f0f0f0");
          li.addEventListener("mouseout", () => li.style.backgroundColor = "#fff");
          li.addEventListener("click", () => {
            inputNovoPedido.value = p.descricao;
            listaSugestoes.style.display = "none";
            inputQuantidadePedido.focus();
          });
          listaSugestoes.appendChild(li);
        });
        listaSugestoes.style.display = "block";
      });

      // Adicionar pedido
      btnAdicionarPedido.onclick = async () => {
        const produto = inputNovoPedido.value.trim();
        const quantidade = parseInt(inputQuantidadePedido.value);

        if (!produto || quantidade < 1) {
          msgErroProduto.textContent = "Informe o produto e a quantidade!";
          return;
        }

        const { data: produtoData, error: produtoError } = await supabase
          .from("produtos")
          .select("descricao")
          .ilike("descricao", `%${produto}%`)
          .eq("situacao", "ativo")
          .limit(1)
          .single();

        if (produtoError || !produtoData) {
          msgErroProduto.textContent = `❌ Produto "${produto}" não existe no sistema.`;
          return;
        }

        msgErroProduto.textContent = "";

        const { data: pedidoData, error: pedidoError } = await supabase
          .from("pedidos")
          .insert([{ comanda_id: comandaAtualId, produto: produtoData.descricao, quantidade }]);

        if (pedidoError) {
          console.error("Erro ao adicionar pedido:", pedidoError);
          abrirModalMensagem("Erro ao adicionar pedido.");
          return;
        }

        const li = document.createElement("li");
        li.textContent = `${produtoData.descricao} - ${quantidade}`;
        li.style.padding = "5px 8px";
        li.style.borderBottom = "1px solid #eee";
        listaPedidos.appendChild(li);

        inputNovoPedido.value = "";
        inputQuantidadePedido.value = 1;
        inputNovoPedido.focus();
      };

    } else {
      abrirModalMensagem(`✅ Cliente "${nomeCliente}" não possui comanda aberta. Pode prosseguir.`);
      adicionarPedidosContainer.style.display = "none";
      comandaAtualId = null;
    }
  }
});
