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

// 🚀 Inicialização
document.addEventListener("DOMContentLoaded", () => {
  verificarAcessoGarcom();
});

// 🔄 Revalida acesso a cada 15 segundos
setInterval(verificarAcessoGarcom, 15000);


// 🔄 VERIFICA VIRADA DO DIA (SÓ TELA)
function verificarViradaDoDia() {
  const hoje = dataHojeBrasil();
  const ultimoDia = localStorage.getItem("ultimoDiaRelatorio");

  // se nunca foi salvo, salva o dia atual
  if (!ultimoDia) {
    localStorage.setItem("ultimoDiaRelatorio", hoje);
    return false;
  }

  if (ultimoDia !== hoje) {
    // ⚠️ proteção contra elementos inexistentes
    const mesas = document.getElementById("mesasAtendidas");
    const pedidos = document.getElementById("pedidosDia");
    const faturado = document.getElementById("totalFaturado");

    if (mesas) mesas.textContent = 0;
    if (pedidos) pedidos.textContent = 0;
    if (faturado) faturado.textContent = "R$ 0,00";

    localStorage.setItem("ultimoDiaRelatorio", hoje);
    return true;
  }

  return false;
}

// 📊 CARREGAR RELATÓRIO DO GARÇOM
async function carregarRelatorioGarcom() {
  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuarioLogado || !usuarioLogado.username) {
    return;
  }

  // 🔄 se virou o dia, não busca relatório antigo
  const virouDia = verificarViradaDoDia();
  if (virouDia) return;

  const hoje = dataHojeBrasil();

  const { data, error } = await supabase
    .from("relatorio_garcom")
    .select("mesas_atendidas, total_pedidos, total_faturado")
    .eq("nome_garcom", usuarioLogado.username)
    .eq("data", hoje)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar relatório:", error);
    return;
  }

  const mesas = document.getElementById("mesasAtendidas");
  const pedidos = document.getElementById("pedidosDia");
  const faturado = document.getElementById("totalFaturado");

  if (!data) {
    if (mesas) mesas.textContent = 0;
    if (pedidos) pedidos.textContent = 0;
    if (faturado) faturado.textContent = "R$ 0,00";
    return;
  }

  if (mesas) mesas.textContent = data.mesas_atendidas;
  if (pedidos) pedidos.textContent = data.total_pedidos;
  if (faturado) {
    faturado.textContent = Number(data.total_faturado).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }
}



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

document.addEventListener("DOMContentLoaded", () => {
  carregarMesas();
  carregarProdutos();
  carregarRelatorioGarcom();
   // 🔔 verifica logo ao abrir a tela
  verificarMesasNaoAtendidas();
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
  carregarRelatorioGarcom();


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

  if (mesaSelecionadaAnterior && mesasPrioridade.some(m => String(m.id) === mesaSelecionadaAnterior)) {
    selectMesa.value = mesaSelecionadaAnterior;
  }
}

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
      li.remove();
      liMesasMap.delete(id);
      localStorage.removeItem(`mesa_tempo_${id}`);
    }
  });
}

// 4️⃣ Atualiza tempo de cada <li> a cada segundo, persistindo no localStorage
function atualizarLiTempo(li, mesa) {
  const key = `mesa_tempo_${mesa.id}`;

  // Verifica se já existe tempo salvo no localStorage
  let horaOcupada = localStorage.getItem(key);
  if (!horaOcupada) {
    // Se não existe, salva o valor do banco (hora_ocupada)
    horaOcupada = mesa.hora_ocupada;
    localStorage.setItem(key, horaOcupada);
  } else {
    horaOcupada = new Date(horaOcupada);
  }

  function atualizar() {
    const agora = new Date();
    const tempo = Math.floor((agora - new Date(horaOcupada)) / 60000); // em minutos

    li.textContent = `${mesa.descricao} - ${tempo} min sem pedido`;

    if (tempo > 20) li.style.color = "red";
    else if (tempo > 10) li.style.color = "orange";
    else li.style.color = "green";
  }

  atualizar();
  setInterval(atualizar, 1000);
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
// ✅ BOTÃO ENVIAR COMPLETO (RELATORIO_GARCOM)
// =============================
document.addEventListener("DOMContentLoaded", () => {

  const btnEnviar = document.querySelector(".btn-enviar");
  if (!btnEnviar) return;

  // Função para pegar o horário de SP
  function agoraSP() {
    const agora = new Date();
    const offsetSP = -3 * 60; // SP é UTC-3
    const timeSP = new Date(agora.getTime() + offsetSP * 60 * 1000);
    return timeSP.toISOString().slice(0, 19); // "YYYY-MM-DDTHH:MM:SS"
  }

  btnEnviar.addEventListener("click", async () => {

    try {
      console.log("🚀 Iniciando envio pedido");

      // =============================
      // 1️⃣ VALIDAR HORÁRIO
      // =============================
      const permitido = await verificarHorarioPedido();
      if (!permitido) {
        abrirModalErro("🚫 Fora do horário de atendimento.");
        return;
      }

      // =============================
      // 2️⃣ VALIDAR MESA
      // =============================
      const mesaSelecionada = selectMesa.value;
      if (!mesaSelecionada) {
        abrirModalErro("Selecione uma mesa.");
        return;
      }

      const mesa = mesasDados.find(m => String(m.id) === mesaSelecionada);
      if (!mesa) {
        abrirModalErro("Mesa inválida.");
        return;
      }

      // 🚫 BLOQUEIA SE A MESA JÁ FOI ATENDIDA
      if (mesa.atendida) {
        abrirModalErro(`⚠️ ${mesa.descricao} já foi atendida. Não é possível fazer pedido no momento.`);
        return;
      }

      // =============================
      // 3️⃣ VALIDAR PRODUTOS
      // =============================
      const checkboxes = document.querySelectorAll(".checkboxProduto:checked");
      if (checkboxes.length === 0) {
        abrirModalErro("Selecione pelo menos um produto.");
        return;
      }

      // =============================
      // 4️⃣ PEGAR GARÇOM
      // =============================
      const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
      if (!usuarioLogado) {
        abrirModalErro("Garçom não identificado.");
        return;
      }

      // =============================
      // 5️⃣ CALCULAR TOTAIS
      // =============================
      let totalPedido = 0;
      let totalItens = 0;

      for (const checkbox of checkboxes) {
        const idProduto = checkbox.getAttribute("data-id");
        const inputQtd = document.querySelector(`.quantidadeProduto[data-id="${idProduto}"]`);
        const quantidade = Number(inputQtd.value);

        const produto = produtosDados.find(p => String(p.id) === idProduto);
        if (!produto) continue;

        const subtotal = produto.valor_sugerido * quantidade;
        totalPedido += subtotal;
        totalItens += quantidade;
      }

      // =============================
      // 6️⃣ ATUALIZAR RELATÓRIO GARÇOM
      // =============================
      const hoje = dataHojeBrasil();
      const horaSP = agoraSP();

      const { data: relatorio } = await supabase
        .from("relatorio_garcom")
        .select("*")
        .eq("garcom_id", usuarioLogado.id)
        .eq("data", hoje)
        .maybeSingle();

      if (relatorio) {
        // 🟢 UPDATE
        const { error } = await supabase
          .from("relatorio_garcom")
          .update({
            total_pedidos: relatorio.total_pedidos + totalItens,
            total_faturado: Number(relatorio.total_faturado) + totalPedido,
            mesas_atendidas: relatorio.mesas_atendidas + 1,
            updated_at: horaSP
          })
          .eq("id", relatorio.id);

        if (error) {
          console.error(error);
          abrirModalErro("Erro ao atualizar relatório.");
          return;
        }
      } else {
        // 🔵 INSERT
        const { error } = await supabase
          .from("relatorio_garcom")
          .insert({
            id: uuidv4(),
            garcom_id: usuarioLogado.id,
            nome_garcom: usuarioLogado.username,
            data: hoje,
            mesas_atendidas: 1,
            total_pedidos: totalItens,
            total_faturado: totalPedido,
            created_at: horaSP,
            updated_at: horaSP
          });

        if (error) {
          console.error(error);
          abrirModalErro("Erro ao salvar relatório.");
          return;
        }
      }

      // =============================
      // 7️⃣ ATUALIZAR MESA
      // =============================
      await supabase
        .from("mesas")
        .update({
          atendida: true,
          ativo: true,
          ultimo_atendimento: horaSP // ✅ Salva horário SP correto
        })
        .eq("id", mesa.id);

      // =============================
      // 8️⃣ LIMPAR TELA
      // =============================
      document.querySelectorAll(".checkboxProduto").forEach(c => c.checked = false);
      document.querySelectorAll(".quantidadeProduto").forEach(q => {
        q.disabled = true;
        q.value = 1;
      });

      calcularTotal();

      abrirModalErro("✅ Pedido enviado com sucesso!");
      carregarRelatorioGarcom();

    } catch (erro) {
      console.error("Erro geral envio:", erro);
      abrirModalErro("Erro ao enviar pedido.");
    }

  });

});
