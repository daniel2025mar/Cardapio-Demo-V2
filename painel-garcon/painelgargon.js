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

// carrega relatorio do garcom
async function carregarRelatorioGarcom() {
  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuarioLogado || !usuarioLogado.username) {
    return;
  }

  const hoje = new Date().toISOString().split("T")[0]; // yyyy-mm-dd

  const { data, error } = await supabase
    .from("relatorio_garcom")
    .select("mesas_atendidas, total_pedidos, total_faturado")
    .eq("nome_garcom", usuarioLogado.username) // 🔐 só o próprio garçom
    .eq("data", hoje)
    .maybeSingle(); // evita erro se não existir

  if (!data) {
    // não tem registro para esse garçom hoje
    document.getElementById("mesasAtendidas").textContent = 0;
    document.getElementById("pedidosDia").textContent = 0;
    document.getElementById("totalFaturado").textContent = "R$ 0,00";
    return;
  }

  document.getElementById("mesasAtendidas").textContent = data.mesas_atendidas;
  document.getElementById("pedidosDia").textContent = data.total_pedidos;
  document.getElementById("totalFaturado").textContent =
    data.total_faturado.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
}

/* =====================================================
   RELATÓRIO PDF DO GARÇOM (COM LOGO E EMPRESA)
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const inputData = document.getElementById("dataRelatorio");
  const campoPdf = document.getElementById("campoPdf");
  const btnGerarPdf = document.getElementById("btnGerarPdf");

  if (!inputData || !campoPdf || !btnGerarPdf) return;

  /* =============================
     1️⃣ DATA ATUAL
  ============================== */
  const hoje = new Date();
  inputData.value = hoje.toISOString().split("T")[0];
  campoPdf.classList.remove("hidden");

  inputData.addEventListener("change", () => {
    campoPdf.classList.toggle("hidden", !inputData.value);
  });

  /* =============================
     2️⃣ GERAR PDF
  ============================== */
  btnGerarPdf.addEventListener("click", async () => {
    const dataSelecionada = inputData.value;

    if (!dataSelecionada) {
      abrirModalErro("Selecione uma data.");
      return;
    }

    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuarioLogado || !usuarioLogado.username) {
      abrirModalErro("Garçom não identificado.");
      return;
    }

    const nomeGarcom = usuarioLogado.username;

    /* =============================
       3️⃣ VERIFICA SE GARÇOM TEM
          ALGUM REGISTRO
    ============================== */
    const { data: registrosGarcom, error: erroGarcom } = await supabase
      .from("relatorio_garcom")
      .select("id")
      .eq("nome_garcom", nomeGarcom)
      .limit(1);

    if (erroGarcom) {
      console.error(erroGarcom);
      abrirModalErro("Erro ao verificar registros do garçom.");
      return;
    }

    if (!registrosGarcom || registrosGarcom.length === 0) {
      abrirModalErro(
        "Seu usuário ainda não possui nenhum registro."
      );
      return;
    }

    /* =============================
       4️⃣ BUSCAR RELATÓRIO NA DATA
    ============================== */
    const { data: relatorio, error } = await supabase
      .from("relatorio_garcom")
      .select("*")
      .eq("nome_garcom", nomeGarcom)
      .eq("data", dataSelecionada)
      .single();

    if (error || !relatorio) {
      abrirModalErro(
        "Nenhum relatório encontrado para esta data."
      );
      return;
    }

    /* =============================
       5️⃣ BUSCAR EMPRESA
    ============================== */
    const empresa = await buscarEmpresa();

    /* =============================
       6️⃣ GERAR PDF
    ============================== */
    await gerarPdfRelatorio(relatorio, empresa);
  });
});

/* =====================================================
   BUSCAR EMPRESA (NOME + LOGO)
===================================================== */
async function buscarEmpresa() {
  const { data, error } = await supabase
    .from("empresa")
    .select("nome, logotipo")
    .limit(1)
    .single();

  if (error || !data) {
    console.error("Erro ao buscar empresa:", error);
    return { nome: "Empresa", logotipo: null };
  }

  return data;
}

/* =====================================================
   CONVERTER IMAGEM URL → BASE64
===================================================== */
async function carregarImagemBase64(url) {
  if (!url) return null;

  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

/* =====================================================
   GERAR PDF
===================================================== */
async function gerarPdfRelatorio(relatorio, empresa) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const largura = doc.internal.pageSize.getWidth();
  const corPrimaria = [33, 37, 41];

  /* =============================
     LOGO
  ============================== */
  let logoBase64 = null;
  if (empresa.logotipo) {
    logoBase64 = await carregarImagemBase64(empresa.logotipo);
  }

  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 20, 15, 28, 28);
  }

  /* =============================
     CABEÇALHO
  ============================== */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...corPrimaria);
  doc.text(empresa.nome, 55, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Relatório Diário do Garçom", 55, 38);

  doc.setDrawColor(180);
  doc.line(20, 45, largura - 20, 45);

  /* =============================
     DADOS
  ============================== */
  doc.setFontSize(12);
  doc.setTextColor(0);

  doc.text("Garçom:", 20, 60);
  doc.setFont("helvetica", "bold");
  doc.text(relatorio.nome_garcom, 50, 60);

  doc.setFont("helvetica", "normal");
  doc.text("Data:", 20, 70);
  doc.setFont("helvetica", "bold");
  doc.text(formatarData(relatorio.data), 50, 70);

  /* =============================
     ESTATÍSTICAS
  ============================== */
  doc.setDrawColor(200);
  doc.roundedRect(20, 80, largura - 40, 45, 4, 4);

  doc.setFont("helvetica", "normal");
  doc.text("Mesas atendidas:", 30, 97);
  doc.text("Pedidos do dia:", 30, 107);
  doc.text("Total faturado:", 30, 117);

  doc.setFont("helvetica", "bold");
  doc.text(String(relatorio.mesas_atendidas), 120, 97);
  doc.text(String(relatorio.total_pedidos), 120, 107);
  doc.text(
    `R$ ${Number(relatorio.total_faturado).toFixed(2)}`,
    120,
    117
  );

  /* =============================
     RODAPÉ
  ============================== */
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Relatório gerado em ${new Date().toLocaleString("pt-BR")}`,
    largura / 2,
    285,
    { align: "center" }
  );

  /* =============================
     SALVAR
  ============================== */
  doc.save(
    `relatorio_${relatorio.nome_garcom}_${relatorio.data}.pdf`
  );
}

/* =====================================================
   FORMATAR DATA
===================================================== */
function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
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

// ENVIAR PEDIDO
window.enviarPedido = function () {
  const mesaSelecionada = selectMesa.value;

  if (!mesaSelecionada) {
    abrirModalErro("Selecione a mesa para iniciar o atendimento");
    return;
  }

  const itensSelecionados = document.querySelectorAll(".checkboxProduto:checked");
  if (itensSelecionados.length === 0) {
    abrirModalErro("Selecione pelo menos 1 produto!");
    return;
  }

  abrirModalErro("Pedido enviado para a cozinha 🚀");
};

