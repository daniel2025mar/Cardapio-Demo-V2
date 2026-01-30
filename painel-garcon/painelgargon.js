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

// Carrega as mesas
async function carregarMesas() {
  const { data, error } = await supabase
    .from("mesas")
    .select("id, descricao, atendida, cliente_presente")
    .eq("ativo", true)
    .eq("cliente_presente", true)
    .order("numero", { ascending: true });

  if (error) {
    console.error("Erro ao carregar mesas:", error);
    selectMesa.innerHTML = `<option value="">Erro ao carregar mesas: ${error.message}</option>`;
    return;
  }

  mesasDados = data;

  selectMesa.innerHTML = "";
  selectMesa.innerHTML += '<option value="">Selecione a mesa</option>';

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

function mesaAindaAtendida(ultimoAtendimento, minutos = 30) {
  if (!ultimoAtendimento) return false;

  const agora = new Date();
  const ultimo = new Date(ultimoAtendimento);

  const diffMin = (agora - ultimo) / 1000 / 60;

  return diffMin < minutos;
}

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

// REALTIME MESAS
supabase
  .channel("public:mesas")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "mesas" },
    () => {
      carregarMesas();
    }
  )
  .subscribe();

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

// CARREGA AS MESAS E PRODUTOS
carregarMesas();
carregarRelatorioGarcom();
carregarProdutos();

// Função para gerar UUID (se ainda não tiver)
function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

window.enviarPedido = async function () {
  const mesaSelecionada = selectMesa.value;

  if (!mesaSelecionada) {
    abrirModalErro("Selecione uma mesa para iniciar o atendimento");
    return;
  }

  // ✅ Verifica se a mesa já está atendida
  const { data: mesaAtualDb, error: erroMesa } = await supabase
    .from("mesas")
    .select("atendida, ultimo_atendimento, descricao")
    .eq("id", mesaSelecionada)
    .maybeSingle();

  if (erroMesa) {
    console.error(erroMesa);
    abrirModalErro("Erro ao verificar status da mesa.");
    return;
  }

  if (mesaAtualDb && mesaAtualDb.atendida) {
    const horaUltimoAtendimento = new Date(mesaAtualDb.ultimo_atendimento).toLocaleTimeString();
    abrirModalErro(`Não é possível fazer pedido para ${mesaAtualDb.descricao} no momento. Último atendimento: ${horaUltimoAtendimento}`);
    return;
  }

  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuarioLogado || !usuarioLogado.username || !usuarioLogado.id) {
    abrirModalErro("Garçom não identificado.");
    return;
  }

  const nomeGarcom = usuarioLogado.username;
  const garcomId = usuarioLogado.id;

  // DATA REAL DO SISTEMA
  const agora = new Date();
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
  const hoje = agora.toISOString().split("T")[0];
  const timestampAgora = agora.toISOString();

  // Pegando produtos com quantidade > 0
  const itensSelecionados = [];
  let totalPedidos = 0;
  let valorTotal = 0;

  document.querySelectorAll(".checkboxProduto:checked").forEach((checkbox) => {
    const id = checkbox.getAttribute("data-id");
    const inputQtd = document.querySelector(`.quantidadeProduto[data-id="${id}"]`);
    const qtd = Number(inputQtd.value);
    const produto = produtosDados.find(p => String(p.id) === id);

    if (qtd > 0 && produto) {
      const valorProduto = Number(produto.valor_sugerido);
      itensSelecionados.push({ id, qtd, valor: valorProduto });
      totalPedidos += 1;
      valorTotal += valorProduto * qtd;
    }
  });

  if (itensSelecionados.length === 0 || valorTotal <= 0) {
    abrirModalErro("Selecione pelo menos 1 produto para enviar o pedido!");
    return;
  }

  // Verifica registro do dia no relatório do garçom
  const { data: registroExistente, error: erroCheck } = await supabase
    .from("relatorio_garcom")
    .select("*")
    .eq("nome_garcom", nomeGarcom)
    .eq("data", hoje)
    .maybeSingle();

  if (erroCheck) {
    console.error(erroCheck);
    abrirModalErro("Erro ao verificar registro do garçom.");
    return;
  }

  if (registroExistente) {
    await supabase
      .from("relatorio_garcom")
      .update({
        mesas_atendidas: registroExistente.mesas_atendidas + 1,
        total_pedidos: registroExistente.total_pedidos + totalPedidos,
        total_faturado: Number(registroExistente.total_faturado) + valorTotal,
        updated_at: timestampAgora
      })
      .eq("id", registroExistente.id);
  } else {
    await supabase
      .from("relatorio_garcom")
      .insert([{
        id: uuidv4(),
        garcom_id: garcomId,
        nome_garcom: nomeGarcom,
        data: hoje,
        mesas_atendidas: 1,
        total_pedidos: totalPedidos,
        total_faturado: valorTotal,
        created_at: timestampAgora,
        updated_at: timestampAgora
      }]);
  }

  // Atualiza mesa como atendida e salva último atendimento
  await supabase
    .from("mesas")
    .update({ atendida: true, ultimo_atendimento: timestampAgora })
    .eq("id", mesaSelecionada);

  // Atualiza status visual
  const mesaAtual = mesasDados.find(m => String(m.id) === mesaSelecionada);
  if (mesaAtual) {
    mesaAtual.atendida = true;
    mesaAtual.ultimo_atendimento = timestampAgora;

    statusMesa.className = "status-mesa atendida";
    textoStatus.textContent = `${mesaAtual.descricao} já foi atendida.`;
  }

  abrirModalErro("Pedido enviado e registro atualizado com sucesso 🚀");

  await carregarRelatorioGarcom();

  // ⏱️ Volta a marcar como não atendida após 40 minutos
  setTimeout(async () => {
    await supabase
      .from("mesas")
      .update({ atendida: false, ultimo_atendimento: null })
      .eq("id", mesaSelecionada);

    if (mesaAtual) {
      mesaAtual.atendida = false;
      mesaAtual.ultimo_atendimento = null;

      statusMesa.className = "status-mesa nao-atendida";
      textoStatus.textContent = `${mesaAtual.descricao} ainda não foi atendida.`;
    }

    // NÃO chamar carregarMesas() para não mexer no select
  }, 40 * 60 * 1000); // 40 minutos
};
