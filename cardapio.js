// =============================
// CONFIGURAÇÃO DO SUPABASE
// =============================
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYWtibmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================
// CONFIGURAÇÕES DO CARRINHO
// =============================
const CHAVE_CARRINHO = "carrinhoPedido";
const CHAVE_DATA = "carrinhoData";
const DIAS_LIMITE = 4;

let taxaEntregaValor = 0; // guarda a taxa real vinda do Supabase
let apagandoCelular = false;
let carrinho = [];
let itensSelecionados = new Set();


// =============================
// PERSISTÊNCIA TEMPORÁRIA DO CARRINHO
// =============================

// Salva carrinho no localStorage
function salvarCarrinho() {
  localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
  localStorage.setItem(CHAVE_DATA, new Date().toISOString());
}

// Carrega carrinho (válido por 4 dias)
function carregarCarrinho() {
  const dados = localStorage.getItem(CHAVE_CARRINHO);
  const dataSalva = localStorage.getItem(CHAVE_DATA);

  if (!dados || !dataSalva) return;

  const agora = new Date();
  const dataCarrinho = new Date(dataSalva);
  const diffDias = (agora - dataCarrinho) / (1000 * 60 * 60 * 24);

  if (diffDias > DIAS_LIMITE) {
    limparCarrinhoStorage();
    return;
  }

  carrinho = JSON.parse(dados);

  atualizarCarrinhoUI();
  atualizarStatusPedido(carrinho);
}
function removerUmaUnidade(produtoId) {
  const index = carrinho.findIndex(p => p.id === produtoId);

  if (index === -1) return;

  // 🔽 diminui a quantidade
  carrinho[index].quantidade--;

  // ❌ se zerou, remove do carrinho
  if (carrinho[index].quantidade <= 0) {
    carrinho.splice(index, 1);
  }

  // 🔄 atualiza tudo
  salvarCarrinho();
  atualizarCarrinhoUI();
  atualizarStatusPedido(carrinho);
}

document.addEventListener("DOMContentLoaded", async () => {
  carregarCarrinho();
  preencherNomeUsuarioCarrinho();

  // 🔐 verifica se está logado
  const { data } = await supabase.auth.getUser();
  const usuarioLogado = !!data?.user;

  // ✅ só mostra o modal se:
  // - tiver carrinho
  // - estiver logado
  if (usuarioLogado && carrinho.length > 0) {
    document
      .getElementById("modalCarrinhoExistente")
      .classList.remove("hidden");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const btnContinuar = document.getElementById("btnContinuarPedido");
  const modalCarrinhoExistente = document.getElementById("modalCarrinhoExistente");

  if (btnContinuar) {
    btnContinuar.addEventListener("click", () => {
      // 🔹 Fecha o modal de carrinho existente
      modalCarrinhoExistente.classList.add("hidden");

      // 🔹 Abre o modal do pedido
      abrirModalPedido();
    });
  }
});

//funçao do 
let map;
let marker;
let searchBox;
let mapIniciado = false; // Para não reiniciar o mapa toda vez que abrir o modal

document.addEventListener("DOMContentLoaded", () => {
  const modalMapa = document.getElementById("modalMapa");
  const btnAbrirMaps = document.getElementById("btnAbrirMaps");
  const fecharModalMapa = document.getElementById("fecharModalMapa");

  if (!modalMapa || !btnAbrirMaps) return;

  // Criar modal de aviso
  const avisoModal = document.createElement("div");
  avisoModal.id = "modalAviso";
  avisoModal.className = `
    fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden
  `;
  avisoModal.innerHTML = `
    <div class="bg-white p-6 rounded-xl shadow-xl max-w-sm text-center">
      <p class="mb-4 text-gray-800 font-semibold">Mapa temporariamente indisponível – estamos trabalhando para deixar tudo perfeito!</p>
      <button id="btnOkAviso" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold">
        OK
      </button>
    </div>
  `;
  document.body.appendChild(avisoModal);

  const btnOkAviso = document.getElementById("btnOkAviso");

  // Botão Abrir Maps agora abre o aviso
  btnAbrirMaps.addEventListener("click", () => {
    modalMapa.classList.remove("hidden"); // mostra o modal do mapa
    avisoModal.classList.remove("hidden"); // mostra o aviso
  });

  // Botão OK fecha aviso e modal do mapa
  btnOkAviso.addEventListener("click", () => {
    avisoModal.classList.add("hidden");
    modalMapa.classList.add("hidden");
  });

  // Fechar modal normalmente
  fecharModalMapa.addEventListener("click", () => {
    modalMapa.classList.add("hidden");
  });
});

async function abrirModalPedidosSeLogado() {
  const logado = await usuarioEstaLogado();

  if (!logado) {
    alert("Faça login para acessar seus pedidos.");
    return;
  }

  const modalPedidos = document.getElementById("modalPedidos");
  if (modalPedidos) {
    modalPedidos.classList.remove("hidden");
  }
}

// expõe para onclick
window.abrirModalPedidosSeLogado = abrirModalPedidosSeLogado;

async function preencherNomeUsuarioCarrinho() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return;

  const user = data.user;

  // Nome prioritário
  const nome =
    user.user_metadata.full_name ||
    user.user_metadata.name ||
    user.email?.split("@")[0] ||
    "Olá";

  const elNome = document.getElementById("nomeUsuarioCarrinho");
  if (elNome) {
    elNome.textContent = nome;
  }
}


document.addEventListener("DOMContentLoaded", () => {
  const btnAbrirModal = document.getElementById("btnAbrirModalPedido");
  const modalPedidos = document.getElementById("modalPedidos");

  if (!btnAbrirModal || !modalPedidos) return;

  btnAbrirModal.addEventListener("click", async () => {
    modalPedidos.classList.remove("hidden");
    await carregarUltimoPedido(); // carrega o próximo número
  });
});




const cardapioEl = document.getElementById("cardapio");

if (cardapioEl) {
  const observer = new MutationObserver(() => {
    const visivel =
      !cardapioEl.classList.contains("hidden") &&
      cardapioEl.offsetParent !== null;

    if (visivel) {
      verificarCarrinhoExistente();
    }
  });

  observer.observe(cardapioEl, {
    attributes: true,
    attributeFilter: ["class", "style"]
  });
}



// Limpa storage (somente quando finalizar pedido)
function limparCarrinhoStorage() {
  localStorage.removeItem(CHAVE_CARRINHO);
  localStorage.removeItem(CHAVE_DATA);
  carrinho = [];
}

async function abrirModalAvisoCustom() {
  const { data, error } = await supabase
    .from("empresa")
    .select("logotipo")
    .limit(1)
    .single();

  if (!error) {
    document.getElementById("logoModalCustom").src = data.logotipo;
  }

  document.getElementById("modalAvisoCustom").classList.add("show");
}

function fecharModalAvisoCustom() {
  document.getElementById("modalAvisoCustom").classList.remove("show");
}

document.getElementById("fecharModalCustom").onclick = fecharModalAvisoCustom;
document.getElementById("btnOkCustom").onclick = fecharModalAvisoCustom;

window.onclick = function(event) {
  if (event.target == document.getElementById("modalAvisoCustom")) {
    fecharModalAvisoCustom();
  }
}

document.getElementById("limparCarrinho").onclick = () => {
  const modalPedido = document.getElementById("modalPedido");

  // só continua se houver produtos
  if (carrinho.length === 0) return;

  if (itensSelecionados.size === 0) {
    abrirModalAvisoCustom();
    return;
  }

  itensSelecionados.forEach(produtoId => {
    removerUmaUnidade(produtoId);
  });

  itensSelecionados.clear();
  salvarCarrinho();
  atualizarCarrinhoUI();
  atualizarStatusPedido(carrinho);
};

document.addEventListener("DOMContentLoaded", () => {
    verificarCarrinhoExistente(); // 🔥 AQUI

  carregarCarrinho();
});

window.addEventListener("DOMContentLoaded", () => {
  carregarProdutosNoCardapio();
  carregarCarrinho(); // 🔥 ESSENCIAL
});


// ultimo pedido

// ✅ FUNÇÃO PARA BUSCAR O ÚLTIMO PEDIDO
async function carregarUltimoPedido() {
  try {
    const { data, error } = await supabase
      .from("pedidos")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Erro ao buscar o último pedido:", error);
      return;
    }

    // Garante que data é array e pega o último id, senão 0
    const ultimoId = Array.isArray(data) && data.length > 0 ? data[0].id : 0;
    const proximo = ultimoId + 1;

    // Atualiza o elemento do DOM somente se existir
    const elNumeroPedido = document.getElementById("pedidoNumero");
    if (elNumeroPedido) {
      elNumeroPedido.innerText = String(proximo).padStart(4, "0");
    }
  } catch (err) {
    console.error("Erro inesperado ao carregar último pedido:", err);
  }
}


function atualizarStatusPedido(carrinho) {
  const statusEl = document.getElementById("pedidoStatus");

  if (carrinho && carrinho.length > 0) {
    statusEl.innerText = "Em Andamento";
    statusEl.classList.remove("text-blue-600");
    statusEl.classList.add("text-green-600");
  } else {
    statusEl.innerText = "Aguardando";
    statusEl.classList.remove("text-green-600");
    statusEl.classList.add("text-blue-600");
  }
}


// =============================
// BUSCAR PRODUTOS
// =============================
export async function buscarProdutos() {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('situacao', 'ativo'); // só produtos ativos

  if (error) {
    console.error("Erro ao buscar produtos:", error);
    return [];
  }

  return data;
}

function mostrarLoaderProdutos() {
  const container = document.getElementById("produtosContainer");

  container.innerHTML = `
    <div class="loader-wrapper">
      <div class="flex flex-col items-center gap-3">
        <div class="loader-produtos"></div>
        <span class="text-gray-600 font-medium text-sm tracking-wide">
          Aguarde...
        </span>
      </div>
    </div>
  `;
}


// =============================
// CARREGAR PRODUTOS NO CARDÁPIO
// =============================
export async function carregarProdutosNoCardapio() {
  const container = document.getElementById("produtosContainer");

  // =========================
  // CONFIGURA GRID (ANTES)
  // =========================
  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(auto-fill, minmax(250px, 1fr))";
  container.style.gap = "1rem";
  container.style.padding = "1rem";

  // =========================
  // MOSTRA LOADER
  // =========================
  mostrarLoaderProdutos();

  // 🔴 FORÇA O BROWSER A RENDERIZAR O LOADER
  await new Promise(resolve => requestAnimationFrame(resolve));

  /* =========================
     BUSCA PRODUTOS
  ========================= */
  const produtos = await buscarProdutos();

  // =========================
  // REMOVE LOADER
  // =========================
  container.innerHTML = "";

  if (!produtos || produtos.length === 0) {
    container.innerHTML =
      "<p class='text-center col-span-full'>Nenhum produto encontrado.</p>";
    return;
  }

  /* =========================
     BUSCA CATEGORIAS
  ========================= */
  const { data: categorias, error } = await supabase
    .from("categorias")
    .select("nome, descricao")
    .order("nome");

  if (error) {
    console.error("Erro ao buscar categorias:", error);
    return;
  }

  /* =========================
     LOOP DAS CATEGORIAS
  ========================= */
  categorias.forEach(categoria => {
    const nomeCategoria = categoria.nome?.trim().toLowerCase();

    const produtosCategoria = produtos.filter(p =>
  p.categoria &&
  p.categoria.trim().toLowerCase() === nomeCategoria &&
  p.situacao?.trim().toLowerCase() !== "inativo"
);


    if (produtosCategoria.length === 0) return;

    /* ===== TÍTULO DA CATEGORIA ===== */
    const blocoCategoria = document.createElement("div");
    blocoCategoria.className = "col-span-full mb-4";

    // ✅ ADICIONE ESTA LINHA
    blocoCategoria.dataset.categoria = nomeCategoria;
    
    blocoCategoria.innerHTML = `
      <h2 class="text-2xl font-bold mb-1">${categoria.nome}</h2>
      <p class="text-gray-600 italic">${categoria.descricao || ""}</p>
    `;

    container.appendChild(blocoCategoria);

    /* =========================
       PRODUTOS DA CATEGORIA
    ========================= */
    produtosCategoria.forEach(produto => {
      const indisponivel = produto.estoque === 0;

      const card = document.createElement("div");
      card.className =
        "group bg-white rounded-lg shadow p-4 flex flex-col cursor-pointer hover:shadow-lg transition";

        // 🔽 AQUI (IMEDIATAMENTE APÓS CRIAR O CARD)
       card.classList.add("produto-card");
       card.dataset.nome = produto.descricao.toLowerCase();
       card.dataset.categoria = nomeCategoria;
       
      const imgClasses = indisponivel
        ? "w-full h-40 object-cover rounded mb-2 grayscale"
        : "w-full h-40 object-cover rounded mb-2";

      const btnClasses = indisponivel
        ? "px-3 py-1 bg-gray-400 text-white rounded cursor-not-allowed mt-auto"
        : "px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition mt-auto";

      const seloIndisponivel = indisponivel
        ? `
          <div class="absolute inset-0 bg-black/60 flex items-center justify-center rounded">
            <span class="text-white font-bold text-lg tracking-wide">
              INDISPONÍVEL
            </span>
          </div>
        `
        : "";

      card.innerHTML = `
        <div class="relative">
          <img 
            src="${produto.imagem_url}" 
            alt="${produto.descricao}" 
            class="${imgClasses}"
          />
          ${seloIndisponivel}
        </div>

        <h3 class="font-bold text-lg">${produto.descricao}</h3>

        <p class="text-gray-600 text-sm mb-2">
          Código: ${produto.codigo}
        </p>

        <span class="font-bold ${
          indisponivel ? "text-gray-500" : "text-red-600"
        } mb-2">
          R$ ${produto.valor_sugerido.toFixed(2)}
        </span>

        <button class="${btnClasses}" ${indisponivel ? "disabled" : ""}>
          ${indisponivel ? "Indisponível" : "Adicionar"}
        </button>
      `;

      card.addEventListener("click", () => {
        if (indisponivel) {
          mostrarModalIndisponivel();
        } else {
          abrirModal(produto);
        }
      });

      container.appendChild(card);
    });
  });
}

// =============================
// ABRIR MODAL DE PRODUTO
// =============================

async function pegarLogotipoEmpresa() {
  const { data, error } = await supabase
    .from("empresa")
    .select("logotipo")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Erro ao buscar logotipo:", error);
    return null;
  }

  return data.logotipo;
}

async function abrirModalAviso() {
  const modalAviso = document.getElementById("modalAviso");

  // pegar logotipo no supabase
  const logotipo = await pegarLogotipoEmpresa();

  // colocar no modal
  const imgLogo = document.getElementById("logoAviso");
  imgLogo.src = logotipo || "";

  modalAviso.classList.remove("hidden");

  document.getElementById("btnFecharAviso").onclick = () => {
  // fecha o modal de aviso
  modalAviso.classList.add("hidden");

  // fecha o modal do produto também
  const modalProduto = document.getElementById("modalProduto");
  modalProduto.classList.add("hidden");
};

}




export function abrirModal(produto) {
   console.log("MODAL ABERTO", produto); // 👈 TESTE
  const modal = document.getElementById("modalProduto");
  const conteudo = document.getElementById("modalConteudo");

  conteudo.innerHTML = `
    <img src="${produto.imagem_url}" alt="${produto.descricao_nfe}" class="w-full h-48 object-cover rounded mb-4">
    <h2 class="text-sm font-medium mb-2">${produto.descricao_nfe}</h2>
    <p class="text-gray-700 text-sm mb-2">Código: ${produto.codigo}</p>
    <p class="text-red-600 font-bold text-sm mb-4">R$ ${produto.valor_sugerido.toFixed(2)}</p>
    <p class="text-gray-600 text-sm mb-4">Estoque: ${produto.estoque}</p>

    <div class="flex gap-2 mb-4">
      <button id="btnAdicionarPedido" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
        Adicionar ao Pedido
      </button>

      <button id="btnEscolherOpcoes" class="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 flex items-center gap-1 text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Escolher Opções
      </button>
    </div>
  `;

  // Abrir modal
  modal.classList.remove("hidden");
  document.getElementById("fecharModal").onclick = () => modal.classList.add("hidden");

  // Botão de adicionar ao pedido (agora com verificação de horário)
  
document.getElementById("btnAdicionarPedido").onclick = async () => {
  // 🔎 DEBUG – confirma clique e produto
  console.log("CLIQUE FUNCIONOU", produto);

  // =========================
  // VERIFICAÇÃO DE ESTOQUE
  // =========================
  if (!produto || produto.estoque <= 0) {
    alert("Produto indisponível no momento!");
    return;
  }

  // =========================
  // VERIFICAÇÃO DE HORÁRIO
  // =========================
  const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const agora = new Date();
  const diaSemana = dias[agora.getDay()];
  const horaAtual = agora.toTimeString().slice(0, 8); // HH:MM:SS

  const { data, error } = await supabase
    .from("horarios_semana")
    .select("hora_inicio, hora_fim")
    .eq("dia_semana", diaSemana)
    .single();

  if (error || !data) {
    console.error("Erro ao buscar horários:", error);
    alert("Erro ao verificar horário de funcionamento.");
    return;
  }

  const { hora_inicio, hora_fim } = data;

  // =========================
  // DENTRO DO HORÁRIO
  // =========================
  if (horaAtual >= hora_inicio && horaAtual <= hora_fim) {

    // ✅ ENVIA O FORMATO CORRETO PARA O CARRINHO
    adicionarProdutoDireto({
      id: produto.id,
      descricao: produto.descricao,        // 👈 nome correto
      valor: produto.valor_sugerido,        // 👈 valor correto
      quantidade: 1
    });

    modal.classList.add("hidden"); // fecha o modal do produto

  } else {
    // =========================
    // FORA DO HORÁRIO
    // =========================
    abrirModalAviso();
  }
};


  // Botão de escolher opções
  const btnOpcoes = document.getElementById("btnEscolherOpcoes");
  const categoriasBebidas = ["bebidas", "refrigerantes", "sucos", "cervejas", "vinhos", "aguas", "destilados"];
  const categoriaNormalizada = produto.categoria?.trim().toLowerCase() || "";

  if (btnOpcoes) {
    if (categoriasBebidas.includes(categoriaNormalizada)) {
      btnOpcoes.style.display = "none";
    } else {
      btnOpcoes.style.display = "flex";
      btnOpcoes.addEventListener("click", () => {
        abrirModalOpcoes(produto);
      });
    }
  }
}




// Modal de seleção de opções
function abrirModalOpcoes(produto) {
  const modal = document.getElementById("modalProduto");
  const conteudo = document.getElementById("modalConteudo");

  const opcoes = produto.opcoes || [
    "Hamburguer de Frango empanado",
    "Queijo Prato",
    "Bacon",
    "Cebola Roxa",
    "Tomate",
    "Alface",
    "Maionese"
  ];

  const valorBase = produto.valor_sugerido;

  conteudo.innerHTML = `
    <h2 class="text-lg font-bold mb-4 text-center">${produto.descricao}</h2>

    <div class="mb-4">
      ${opcoes.map((op, index) => `
        <div class="flex items-center mb-1">
          <input type="checkbox" id="opcao${index}" class="mr-2" checked>
          <label for="opcao${index}" class="text-sm">${op}</label>
        </div>
      `).join('')}
    </div>

    <p class="text-center font-bold mb-2">Total: R$ <span id="totalProduto">${valorBase.toFixed(2)}</span></p>
    <p class="text-center text-xs text-gray-500 mb-4">
      A escolha dos ingredientes será aplicada em todas as unidades deste mesmo produto adicionadas ao carrinho.
    </p>

    <div class="flex justify-end gap-2">
      <button id="fecharOpcoes" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Fechar</button>
      <button id="salvarOpcoes" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Salvar</button>
    </div>
  `;

  const checkboxes = conteudo.querySelectorAll('input[type="checkbox"]');
  const totalEl = document.getElementById('totalProduto');

  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      // Se quiser somar valores extras, coloque a lógica aqui
      totalEl.textContent = valorBase.toFixed(2);
    });
  });

  document.getElementById("fecharOpcoes").onclick = () => abrirModal(produto);

  document.getElementById("salvarOpcoes").onclick = () => {
    const selecionados = [];
    checkboxes.forEach((cb, index) => {
      if (cb.checked) selecionados.push(opcoes[index]);
    });

    console.log("Opções selecionadas:", selecionados);
    abrirModal(produto); // Volta para modal principal
  };
}




// =============================
// EXECUTA AO CARREGAR A PÁGINA
// =============================
window.addEventListener("DOMContentLoaded", carregarProdutosNoCardapio);


async function carregarTaxaEntrega() {
  try {
    const { data, error } = await supabase
      .from("taxa")
      .select("valor")
      .eq("id", 1)
      .single();

    if (error) {
      console.error("Erro ao buscar taxa:", error);
      return;
    }

    taxaEntregaValor = Number(data.valor) || 0;
    atualizarTaxaNaTela(taxaEntregaValor);

  } catch (err) {
    console.error("Erro inesperado ao carregar taxa:", err);
  }
}

function atualizarTaxaNaTela(valor) {
  const spanTaxa = document.getElementById("taxaEntrega");

  if (!spanTaxa) return;

  spanTaxa.textContent = valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function atualizarCarrinhoUI() {
  const lista = document.getElementById("listaProdutos");
  const totalEl = document.getElementById("totalPedido");

  lista.innerHTML = "";
  let total = 0;

  carrinho.forEach(produto => {
    const subtotal = produto.valor * produto.quantidade;
    total += subtotal;

    const li = document.createElement("li");
    li.className = "flex justify-between text-sm cursor-pointer";

    // 🔴 SE ESTIVER SELECIONADO, FICA VERMELHO
    if (itensSelecionados.has(produto.id)) {
      li.classList.add("text-red-600", "font-semibold");
    }

    li.innerHTML = `
      <span>${produto.descricao} (${produto.quantidade}x)</span>
      <span>R$ ${subtotal.toFixed(2)}</span>
    `;

    // 🖱️ CLIQUE → SELECIONA / DESSELECIONA
    li.addEventListener("click", () => {
      if (itensSelecionados.has(produto.id)) {
        itensSelecionados.delete(produto.id);
      } else {
        itensSelecionados.add(produto.id);
      }

      atualizarCarrinhoUI();
    });

    lista.appendChild(li);
  });

  // ✅ TAXA DE ENTREGA
  const retirarLocal = document.getElementById("retirarLocal").checked;
  const totalComTaxa = retirarLocal ? total : total + taxaEntregaValor;

  totalEl.textContent = `R$ ${totalComTaxa.toFixed(2)}`;

  atualizarContadorCarrinho();
}



function abrirModalPedido() {
  document.getElementById("modalPedido").classList.remove("hidden");

   // 🔥 Atualiza o número do pedido sempre que abrir o modal
  carregarUltimoPedido();
  // 🔥 Atualiza o status conforme o carrinho
  atualizarStatusPedido(carrinho);
}


function formatarCelular(valor) {
  // pega somente números
  let numeros = valor.replace(/\D/g, "").substring(0, 11);

  let formatado = "";

  if (numeros.length > 0) {
    formatado = "(" + numeros.substring(0, 2);
  }
  if (numeros.length >= 3) {
    formatado += ") " + numeros.substring(2, 3);
  }
  if (numeros.length >= 4) {
    formatado += " " + numeros.substring(3, 7);
  }
  if (numeros.length >= 8) {
    formatado += "-" + numeros.substring(7, 11);
  }

  return formatado;
}

function abrirModalLoginNecessario() {
  const modal = document.getElementById("modalLoginNecessario");
  if (modal) modal.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  const btnFechar = document.getElementById("btnFecharModalLogin");
  const modal = document.getElementById("modalLoginNecessario");

  if (btnFechar) {
    btnFechar.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }

  // Fecha clicando fora
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  }
});

async function abrirModalErro(texto) {
  // BUSCAR LOGO NO SUPABASE
  const { data, error } = await supabase
    .from("empresa")
    .select("logotipo")
    .limit(1)
    .single();

  if (error) {
    console.error("Erro ao buscar logo:", error);
  } else {
    const logoUrl = data.logotipo;
    document.getElementById("logoModalErro").src = logoUrl;
  }

  // EXIBIR MENSAGEM
  document.getElementById("textoErro").innerText = texto;

  // ABRIR O MODAL
  document.getElementById("modalErroCustom").classList.add("show");
}

function fecharModalErro() {
  document.getElementById("modalErroCustom").classList.remove("show");
}

document.getElementById("fecharModalErro").onclick = fecharModalErro;
document.getElementById("btnOkErro").onclick = fecharModalErro;

window.onclick = function(event) {
  if (event.target == document.getElementById("modalErroCustom")) {
    fecharModalErro();
  }
}

document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("modalSemInternet");
  const fechar = document.getElementById("fecharModalSemInternet");
  const btnOk = document.getElementById("btnOkSemInternet");

  function mostrarModalSemInternet() {
    modal.classList.remove("hidden");
    modal.classList.add("show");
  }

  function esconderModalSemInternet() {
    modal.classList.remove("show");
    modal.classList.add("hidden");
  }

  // Evento quando perde internet
  window.addEventListener("offline", () => {
    mostrarModalSemInternet();
  });

  // Evento quando volta internet
  window.addEventListener("online", () => {
    esconderModalSemInternet();
  });

  // Fechar com X
  fechar.addEventListener("click", () => {
    esconderModalSemInternet();
  });

  // Fechar com OK
  btnOk.addEventListener("click", () => {
    esconderModalSemInternet();
  });

  // Verifica se já está offline ao abrir a página
  if (!navigator.onLine) {
    mostrarModalSemInternet();
  }
});

// ===============================
// MODAL DE ERRO CUSTOMIZADO (COMPLETO)
// ===============================
async function mostrarModalErro(mensagem) {
  const modalErroCustom = document.getElementById("modalErroCustom");
  const textoErro = document.getElementById("textoErro");
  const fecharModalErro = document.getElementById("fecharModalErro");
  const btnOkErro = document.getElementById("btnOkErro");
  const logoModalErro = document.getElementById("logoModalErro");

  // Atualiza a mensagem
  textoErro.innerText = mensagem;

  // BUSCA O LOGOTIPO NO SUPABASE
  const { data, error } = await supabase
    .from("empresa")
    .select("logotipo")
    .limit(1)
    .single();

  if (!error && data?.logotipo) {
    logoModalErro.src = data.logotipo;
  }

  // Abre o modal
  modalErroCustom.classList.add("show");

  // Fecha ao clicar no X
  fecharModalErro.addEventListener("click", () => {
    modalErroCustom.classList.remove("show");
  });

  // Fecha ao clicar no OK
  btnOkErro.addEventListener("click", () => {
    modalErroCustom.classList.remove("show");
  });

  // Fecha clicando fora do modal
  window.addEventListener("click", (e) => {
    if (e.target === modalErroCustom) {
      modalErroCustom.classList.remove("show");
    }
  });
}

// ===============================
// 🔹 FUNÇÃO PARA FORMATAR DATA
// ===============================
function formatarDataHora(date) {
  const d = new Date(date);

  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0"); // Janeiro é 0
  const ano = d.getFullYear();

  const hora = String(d.getHours()).padStart(2, "0");
  const minutos = String(d.getMinutes()).padStart(2, "0");
  const segundos = String(d.getSeconds()).padStart(2, "0");

  return `${dia}/${mes}/${ano} ${hora}:${minutos}:${segundos}`;
}

function formatarDataHoraParaDB(date) {
  const d = new Date(date);

  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0"); // Janeiro é 0
  const ano = d.getFullYear();

  const hora = String(d.getHours()).padStart(2, "0");
  const minutos = String(d.getMinutes()).padStart(2, "0");
  const segundos = String(d.getSeconds()).padStart(2, "0");

  // Formato aceito pelo PostgreSQL: "YYYY-MM-DD HH:MM:SS"
  return `${ano}-${mes}-${dia} ${hora}:${minutos}:${segundos}`;
}

// aqui e a funçao de enviar pedidos
document.addEventListener("DOMContentLoaded", () => {
  const botaoCarrinho = document.getElementById("card-btn");
  const modal = document.getElementById("modalPedido");
  const botaoFechar = document.getElementById("fecharModalCarrinho");
  const checkboxRetirarLocal = document.getElementById("retirarLocal");

  const btnFinalizar = document.getElementById("finalizarPedido");
  const inputEndereco = document.getElementById("enderecoEntrega");
  const inputCelular = document.getElementById("celularContato");

  const toast = document.getElementById("toast");
  const toastTitulo = document.getElementById("toastTitulo");
  const toastMensagem = document.getElementById("toastMensagem");

  let nomeEmpresa = "suporte";

  // ===============================
  // 🔎 BUSCAR NOME EMPRESA
  // ===============================
  async function carregarNomeEmpresa() {
    const { data, error } = await supabase
      .from("empresa")
      .select("nome")
      .limit(1)
      .single();

    if (!error && data?.nome) {
      nomeEmpresa = data.nome;
    }
  }

  // ===============================
  // 🔎 BUSCAR WHATSAPP EMPRESA
  // ===============================
  async function buscarWhatsAppEmpresa() {
    const { data, error } = await supabase
      .from("empresa")
      .select("whatsapp")
      .limit(1)
      .single();

    if (error || !data?.whatsapp) {
      console.error("Erro ao buscar WhatsApp:", error);
      return null;
    }

    let numeroLimpo = data.whatsapp.replace(/\D/g, "");
    if (!numeroLimpo.startsWith("55")) {
      numeroLimpo = "55" + numeroLimpo;
    }

    return numeroLimpo;
  }

  function enviarParaWhatsApp(numero, mensagem) {
    const mensagemCodificada = encodeURIComponent(mensagem);
    const url = `https://wa.me/${numero}?text=${mensagemCodificada}`;
    window.open(url, "_blank");
  }

  function mostrarToast(titulo, mensagem) {
    toastTitulo.innerText = titulo;
    toastMensagem.innerText = mensagem;

    toast.classList.remove("hidden");
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.add("hidden");
    }, 4000);
  }

  inputCelular.addEventListener("input", () => {
    inputCelular.value = formatarCelular(inputCelular.value);
  });

  botaoCarrinho.addEventListener("click", async () => {
  const { data, error } = await supabase.auth.getUser();
  const usuarioLogado = !error && !!data.user;

  if (!usuarioLogado) {
    abrirModalLoginNecessario();
    return;
  }

  // 🔹 Buscar cliente pelo email logado
  const emailLogado = data.user.email;

  let { data: cliente, error: errCliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("email", emailLogado)
    .maybeSingle();

  if (errCliente) {
    mostrarToast("Erro", "Erro ao verificar cliente.");
    return;
  }

  // 🔹 Pré-preencher endereço se existir cliente e não for retirar no local
  if (cliente && !checkboxRetirarLocal.checked) {
    const rua = cliente.endereco || "";
    const numero = cliente.numero || "";
    const bairro = cliente.bairro || "";
    const cidade = cliente.cidade || "";
    const uf = cliente.uf || "";
    inputEndereco.value = `R. ${rua}, ${numero} - ${bairro}, ${cidade} - ${uf}`;
  }

  // Abrir modal
  modal.classList.remove("hidden");
});

  botaoFechar.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  checkboxRetirarLocal.addEventListener("change", () => {
    if (checkboxRetirarLocal.checked) {
      atualizarTaxaNaTela(0);
      inputEndereco.value = "";
      inputEndereco.disabled = true;
      inputEndereco.classList.add("bg-gray-100");
    } else {
      atualizarTaxaNaTela(taxaEntregaValor);
      inputEndereco.disabled = false;
      inputEndereco.classList.remove("bg-gray-100");
    }
    atualizarCarrinhoUI();
  });

  // ===============================
  // FINALIZAR PEDIDO
  // ===============================
  btnFinalizar.addEventListener("click", async (e) => {
  e.preventDefault();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    abrirModalLoginNecessario();
    return;
  }

  const user = userData.user;
  const emailLogado = user.email;

  if (!user.app_metadata?.provider || user.app_metadata.provider !== "google") {
    mostrarToast("Login necessário", "Faça login com sua conta Google para enviar pedidos.");
    return;
  }

  // Verifica se existe cliente com mesmo email
  let { data: cliente, error: errCliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("email", emailLogado)
    .maybeSingle();

  if (errCliente) {
    mostrarToast("Erro", "Erro ao verificar cliente.");
    return;
  }

  if (!cliente || !cliente.nome) {
    const modalNome = document.getElementById("modalNome");
    modalNome.classList.remove("hidden");

    const btnSalvarNome = document.getElementById("btnSalvarNome");
    const inputNome = document.getElementById("inputNome");

    btnSalvarNome.onclick = async () => {
      const nomeDigitado = inputNome.value.trim();
      const celularDigitado = inputCelular.value.trim();

      if (!nomeDigitado) {
        mostrarToast("Erro", "Digite seu nome completo.");
        return;
      }

      // Inserir ou atualizar cliente
      let { data: novoCliente, error: erroInsert } = await supabase
        .from("clientes")
        .upsert([
          {
            email: emailLogado,
            nome: nomeDigitado,
            celular: celularDigitado,
            bloqueado: false,
            criado_em: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (erroInsert) {
        mostrarToast("Erro", "Erro ao salvar nome e celular.");
        console.error("Erro supabase:", erroInsert);
        return;
      }

      cliente = novoCliente;
      modalNome.classList.add("hidden");

      btnFinalizar.click();
    };

    return;
  }

  // Atualiza celular se necessário
  const celularDigitado = inputCelular.value.trim();
  if (cliente.celular !== celularDigitado) {
    await supabase
      .from("clientes")
      .update({ celular: celularDigitado })
      .eq("email", emailLogado);
    cliente.celular = celularDigitado;
  }

  if (cliente.bloqueado === true) {
    mostrarToast("Acesso bloqueado", "Seu acesso está bloqueado.");
    return;
  }

  if (!carrinho || carrinho.length === 0) {
    mostrarToast("Carrinho vazio", "Adicione produtos antes de enviar.");
    return;
  }

  let erro = false;
  inputCelular.classList.remove("border-red-500");
  inputEndereco.classList.remove("border-red-500");

  if (inputCelular.value.trim().length < 16) {
    erro = true;
    inputCelular.classList.add("border-red-500");
  }

  if (!checkboxRetirarLocal.checked && inputEndereco.value.trim() === "") {
    erro = true;
    inputEndereco.classList.add("border-red-500");
  }

  if (erro) {
    mostrarToast("Erro", "Preencha corretamente os dados.");
    return;
  }

  // Gerar numero_pedido
  let numeroPedido = "0001";
  try {
    const { data: ultimosPedidos } = await supabase
      .from("pedidos")
      .select("numero_pedido")
      .order("id", { ascending: false })
      .limit(1);

    if (ultimosPedidos && ultimosPedidos.length > 0) {
      const ultimo = ultimosPedidos[0].numero_pedido || "0000";
      numeroPedido = (parseInt(ultimo, 10) + 1).toString().padStart(4, "0");
    }
  } catch (err) {
    console.error("Erro ao gerar numero_pedido:", err);
  }

  // Preparar itens e valores e atualizar estoque
  const itensComValores = [];

  for (const item of carrinho) {
    // Buscar valor do produto
    const { data: produto, error: errProduto } = await supabase
      .from("produtos")
      .select("valor_sugerido")
      .eq("descricao", item.descricao)
      .single();

    if (errProduto || !produto) {
      mostrarToast("Erro", `Produto não encontrado: ${item.descricao}`);
      return;
    }

    const valorUnitario = Number(produto.valor_sugerido);

    itensComValores.push({
      descricao: item.descricao,
      quantidade: item.quantidade,
      subtotal: valorUnitario,
      total: valorUnitario * item.quantidade
    });

    // 🔹 Atualizar estoque
    const { data: produtoAtual, error: errEstoque } = await supabase
      .from("produtos")
      .select("estoque")
      .eq("descricao", item.descricao)
      .single();

    if (errEstoque || !produtoAtual) {
      mostrarToast("Erro", `Erro ao buscar estoque do produto: ${item.descricao}`);
      return;
    }

    const novoEstoque = (produtoAtual.estoque || 0) - item.quantidade;

    const { error: updateError } = await supabase
      .from("produtos")
      .update({ estoque: novoEstoque })
      .eq("descricao", item.descricao);

    if (updateError) {
      mostrarToast("Erro", `Erro ao atualizar estoque do produto: ${item.descricao}`);
      return;
    }
  }

  const subtotal = itensComValores.reduce((acc, i) => acc + i.subtotal, 0);
  const total = itensComValores.reduce((acc, i) => acc + i.total, 0);

  // Inserir pedido
  const { error: insertError } = await supabase.from("pedidos").insert([
    {
      numero_pedido: numeroPedido,
      tipo_entrega: checkboxRetirarLocal.checked ? "retirada" : "delivery",
      horario_recebido: new Date().toISOString(),
      status: "Recebido",
      subtotal,
      total,
      cliente: cliente.nome,
      email: emailLogado,
      telefone: inputCelular.value,
      endereco: checkboxRetirarLocal.checked ? null : inputEndereco.value,
      referencia: null,
      pagamento: "não informado",
      observacoes: null,
      criado_em: new Date().toISOString(),
      itens: itensComValores
    }
  ]);

  if (insertError) {
    mostrarToast("Erro", insertError.message);
    console.error("ERRO SUPABASE:", insertError);
    return;
  }

  // Enviar WhatsApp
  const whatsappEmpresa = await buscarWhatsAppEmpresa();
  if (whatsappEmpresa) {
    let mensagem = `📦 *Novo Pedido Recebido*\n----------------------------\n`;
    mensagem += `🧾 *Pedido Nº:* ${numeroPedido}\n`;
    mensagem += `👤 *Cliente:* ${cliente.nome}\n`;
    mensagem += `📞 *Telefone:* ${inputCelular.value}\n`;
    mensagem += `🚚 *Entrega:* ${checkboxRetirarLocal.checked ? "Retirada no local" : "Delivery"}\n`;

    if (!checkboxRetirarLocal.checked) {
      mensagem += `📍 *Endereço:* ${inputEndereco.value}\n`;
    }

    mensagem += `----------------------------\n🛒 *Itens do Pedido:*\n`;
    itensComValores.forEach(item => {
      mensagem += `• ${item.descricao} x${item.quantidade} = R$ ${item.total.toFixed(2)}\n`;
    });
    mensagem += `----------------------------\n💰 *Total:* R$ ${total.toFixed(2)}\n`;

    enviarParaWhatsApp(whatsappEmpresa, mensagem);
  }

  mostrarToast("Pedido enviado 🎉", "Seu pedido foi recebido com sucesso!");
  limparCarrinhoStorage();
  atualizarCarrinhoUI();
  modal.classList.add("hidden");
});

  carregarTaxaEntrega();
  carregarNomeEmpresa();
});

 // =============================
// CARREGAR HORÁRIO DE ATENDIMENTO
// =============================

async function carregarHorarioResumo() {
  const elemento = document.getElementById("horarioAtendimento");
  if (!elemento) return;

  try {
    const { data, error } = await supabase
      .from('horarios_semana')
      .select('dia_semana, hora_inicio, hora_fim');

    if (error) throw error;
    if (!data || data.length === 0) {
      elemento.textContent = "Horário não configurado";
      elemento.className = "text-gray-500 font-semibold text-[10px] sm:text-xs text-center";
      return;
    }

    const ordemDias = ["domingo","segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

    const horariosValidos = data
      .filter(d => d.hora_inicio && d.hora_fim)
      .sort((a, b) => ordemDias.indexOf(a.dia_semana) - ordemDias.indexOf(b.dia_semana));

    if (horariosValidos.length === 0) {
      elemento.textContent = "Horário não configurado";
      elemento.className = "text-gray-500 font-semibold text-[10px] sm:text-xs text-center";
      return;
    }

    const primeiro = horariosValidos[0];
    const ultimo = horariosValidos[horariosValidos.length - 1];
    const textoResumo = `${primeiro.dia_semana.charAt(0).toUpperCase() + primeiro.dia_semana.slice(1)} a ${ultimo.dia_semana.charAt(0).toUpperCase() + ultimo.dia_semana.slice(1)} - ${primeiro.hora_inicio.substring(0,5)} às ${ultimo.hora_fim.substring(0,5)}`;

    const agora = new Date();
    const diaAtual = ordemDias[agora.getDay()];
    const horarioAtual = agora.getHours() * 60 + agora.getMinutes();

    const horarioHoje = horariosValidos.find(h => h.dia_semana === diaAtual);

    let status = "Fechado";
    let corStatus = "!text-red-600";  // <- aqui

    if (horarioHoje) {
      const inicio = parseInt(horarioHoje.hora_inicio.substring(0,2)) * 60 + parseInt(horarioHoje.hora_inicio.substring(3,5));
      const fim = parseInt(horarioHoje.hora_fim.substring(0,2)) * 60 + parseInt(horarioHoje.hora_fim.substring(3,5));

      if (horarioAtual >= inicio && horarioAtual <= fim) {
        status = "Aberto";
        corStatus = "!text-black"; // <- aqui
      }
    }

    elemento.textContent = `${textoResumo} — ${status}`;

    elemento.classList.remove("text-red-600", "text-green-600", "text-gray-700", "text-gray-500");
    elemento.classList.add("font-semibold", "text-[10px]", "sm:text-xs", "text-center", corStatus);

  } catch (err) {
    console.error("Erro ao buscar horários:", err.message);
    elemento.textContent = "Erro ao carregar horários";
    elemento.className = "text-gray-500 font-semibold text-[10px] sm:text-xs text-center";
  }
}


// =============================
// FUNÇÃO PARA ESPERAR ELEMENTO EXISTIR
// =============================
function esperarElemento(id, callback) {
  const el = document.getElementById(id);
  if (el) {
    callback();
    return;
  }
  const observer = new MutationObserver(() => {
    const el = document.getElementById(id);
    if (el) {
      callback();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// =============================
// INICIALIZAÇÃO
// =============================
esperarElemento("horarioAtendimento", () => {
  // Carrega inicialmente
  carregarHorarioResumo();

  // Atualiza a cada minuto
  setInterval(carregarHorarioResumo, 60000);

  // Atualiza automaticamente se houver mudanças na tabela (Realtime Supabase)
  supabase
    .channel('public:horarios_semana')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'horarios_semana' }, () => {
      carregarHorarioResumo();
    })
    .subscribe();
});

/* =============================
   CARREGAR CATEGORIAS COM PRODUTOS (POR NOME)
============================= */
async function carregarCategorias() {
  const container = document.getElementById("categoriasSection");
  container.innerHTML = "";

  // 🔹 Adiciona o card "Todos" manualmente
  const buttonTodos = document.createElement("button");
  buttonTodos.className = `
    flex flex-col items-center justify-center gap-2
    px-5 py-4
    bg-white rounded-xl shadow-md
    text-gray-700 font-semibold
    hover:shadow-xl hover:text-red-600 transition
    duration-300 ease-in-out
    border-2 border-red-600
  `;
  buttonTodos.innerHTML = `
    <div class="w-12 h-12 flex items-center justify-center bg-red-50 rounded-full">
      <svg class="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.561-.955L10 0l2.949 5.955 6.561.955-4.755 4.635 1.123 6.545z"/>
      </svg>
    </div>
    <span class="text-sm sm:text-base mt-1">Todos</span>
  `;
  buttonTodos.addEventListener("click", () => {
    document.querySelectorAll("#categoriasSection button").forEach(b => {
      b.classList.remove("border-red-600", "text-red-600");
    });
    buttonTodos.classList.add("border-red-600", "text-red-600");

    console.log("Categoria selecionada: Todos");

    // 👉 carregar todos os produtos
    // carregarProdutosPorCategoria(""); // ou criar função que carrega todos
  });
  container.appendChild(buttonTodos);

  const { data: categorias, error } = await supabase
    .from("categorias")
    .select("id, nome, icone")
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao carregar categorias:", error);
    return;
  }

  for (const cat of categorias) {
    const { data: produtos, error: erroProdutos } = await supabase
      .from("produtos")
      .select("id")
      .eq("categoria", cat.nome)
      .limit(1);

    if (erroProdutos) {
      console.error("Erro ao verificar produtos:", erroProdutos);
      continue;
    }

    if (!produtos || produtos.length === 0) {
      continue;
    }

    const button = document.createElement("button");
    button.className = `
      flex flex-col items-center justify-center gap-2
      px-5 py-4
      bg-white rounded-xl shadow-md
      text-gray-700 font-semibold
      hover:shadow-xl hover:text-red-600 transition
      duration-300 ease-in-out
      border-2 border-transparent
    `;
    button.innerHTML = `
      <div class="w-12 h-12 flex items-center justify-center bg-red-50 rounded-full">
        <img
          src="${cat.icone}"
          alt="${cat.nome}"
          class="w-6 h-6 object-contain"
        />
      </div>
      <span class="text-sm sm:text-base mt-1">${cat.nome}</span>
    `;

    button.addEventListener("click", () => {
      document.querySelectorAll("#categoriasSection button").forEach(b => {
        b.classList.remove("border-red-600", "text-red-600");
      });
      button.classList.add("border-red-600", "text-red-600");

      console.log("Categoria selecionada:", cat.nome);

      //carregarProdutosPorCategoria(cat.nome);
    });

    container.appendChild(button);
  }
}

// iniciar
document.addEventListener("DOMContentLoaded", carregarCategorias);


// Informações da 
async function carregarEmpresa() {
  try {
    const { data, error } = await supabase
      .from('empresa')
      .select('nome, cnpj, endereco')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Erro ao buscar empresa:', error);
      document.getElementById('nomeEmpresa').textContent = "Erro ao carregar nome";
      document.getElementById('empresaCNPJ').textContent = "Erro ao carregar CNPJ";
      document.getElementById('enderecoEmpresa').textContent = "Erro ao carregar endereço";

      // ❌ Título de erro
      document.title = "Erro ao carregar empresa";
      return;
    }

    /* ================= HTML ================= */
    document.getElementById('nomeEmpresa').textContent = data.nome;
    document.getElementById('empresaCNPJ').textContent =
      `${data.nome} — CNPJ: ${data.cnpj}`;
    document.getElementById('enderecoEmpresa').textContent = data.endereco;

    /* ================= TITLE ================= */
    document.title = `Cardápio • ${data.nome}`;

  } catch (err) {
    console.error('Erro inesperado:', err);

    document.getElementById('nomeEmpresa').textContent = "Erro inesperado";
    document.getElementById('empresaCNPJ').textContent = "Erro inesperado";
    document.getElementById('enderecoEmpresa').textContent = "Erro inesperado";

    document.title = "Erro inesperado";
  }
}

// Chamar a função
carregarEmpresa();


// cardapio.js
export async function atualizarFundoCardapio() {
  try {
    // 1️⃣ Buscar a empresa no Supabase
    const { data: empresa, error } = await supabase
      .from("empresa")
      .select("fundo_cardapio")
      .eq("id", 1) // pegando a primeira empresa
      .single();

    if (error) {
      console.error("Erro ao buscar fundo do cardápio:", error);
      return;
    }

    if (!empresa || !empresa.fundo_cardapio) {
      console.log("Nenhuma imagem de fundo cadastrada");
      return;
    }

    // 2️⃣ Seleciona o <img> do fundo
    const fundoTopo = document.getElementById("fundoTopoCardapio");
    if (!fundoTopo) {
      console.error("Elemento do fundo não encontrado");
      return;
    }

    // 3️⃣ Atualiza o src da imagem
    fundoTopo.src = empresa.fundo_cardapio;

  } catch (err) {
    console.error("Erro ao atualizar fundo do cardápio:", err);
  }
}

// 4️⃣ Chamar ao carregar o DOM
document.addEventListener("DOMContentLoaded", () => {
  atualizarFundoCardapio();
});


document.addEventListener("DOMContentLoaded", async () => {
  const logoCardapio = document.getElementById("logoCardapio");

  // Buscar a empresa
  const { data: empresa, error } = await supabase
    .from("empresa")
    .select("logotipo")
    .limit(1)
    .single();

  if (error) {
    console.error("Erro ao buscar logotipo:", error);
    return;
  }

  // Atualiza a imagem do cardápio se existir
  if (empresa && empresa.logotipo) {
    logoCardapio.src = empresa.logotipo;
  }
});

// Pega o ano atual e coloca no span
  document.getElementById('anoAtual').textContent = new Date().getFullYear();

// Impede zoom via Ctrl + roda do mouse e gestos de pinça
document.addEventListener('wheel', function(e) {
  if (e.ctrlKey) e.preventDefault();
}, { passive: false });

document.addEventListener('gesturestart', function(e) {
  e.preventDefault();
});

  // animaçao do slide ofertas
  const dots = document.querySelectorAll(".dot-indicador");
  let dotAtual = 0;

  function animarDots() {
    dots.forEach(dot => dot.classList.remove("ativo"));
    dots[dotAtual].classList.add("ativo");

    dotAtual = (dotAtual + 1) % dots.length;
  }

  // inicia
  animarDots();

  // troca a cada 4 segundos
  setInterval(animarDots, 4000);

  // animaçao do subtitulo de ofertas
  function atualizarSubtituloOfertas() {
    const el = document.getElementById("subtituloOfertas");
    if (!el) return;

    const hora = new Date().getHours();
    let texto = "";

    if (hora >= 6 && hora < 12) {
      texto = "Comece o dia aproveitando ofertas selecionadas para você";
    } else if (hora >= 12 && hora < 18) {
      texto = "Selecionamos ofertas exclusivas para você hoje";
    } else {
      texto = "Aproveite agora — ofertas especiais por tempo limitado";
    }

    // efeito suave
    el.style.opacity = "0";
    setTimeout(() => {
      el.textContent = texto;
      el.style.opacity = "1";
    }, 300);
  }

  // Executa ao carregar
  atualizarSubtituloOfertas();

  // Atualiza a cada 10 minutos (opcional)
  setInterval(atualizarSubtituloOfertas, 600000);

  async function carregarProdutosCategoriaSecundaria(nomeCategoria) {
  const container = document.getElementById("produtosContainerSecundario");
  if (!container) return;

  container.innerHTML = `
    <div class="loader-wrapper">
      <div class="loader-produtos"></div>
    </div>
  `;

  const produtos = await buscarProdutos();
  container.innerHTML = "";

  const categoriaNormalizada = nomeCategoria.trim().toLowerCase();

  const produtosFiltrados = produtos.filter(p =>
    p.categoria &&
    p.categoria.trim().toLowerCase() === categoriaNormalizada
  );

  if (produtosFiltrados.length === 0) {
    container.innerHTML = `
      <p class="col-span-full text-center text-gray-500">
        Nenhum produto encontrado nesta categoria.
      </p>
    `;
    return;
  }

  produtosFiltrados.forEach(produto => {
    const indisponivel = produto.estoque === 0;

    const card = document.createElement("div");
    card.className =
      "group bg-white rounded-lg shadow p-4 flex flex-col cursor-pointer hover:shadow-lg transition";

    const imgClasses = indisponivel
      ? "w-full h-40 object-cover rounded mb-2 grayscale"
      : "w-full h-40 object-cover rounded mb-2";

    const btnClasses = indisponivel
      ? "px-3 py-1 bg-gray-400 text-white rounded cursor-not-allowed mt-auto"
      : "px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition mt-auto";

    const seloIndisponivel = indisponivel
      ? `
        <div class="absolute inset-0 bg-black/60 flex items-center justify-center rounded">
          <span class="text-white font-bold text-lg">INDISPONÍVEL</span>
        </div>
      `
      : "";

    card.innerHTML = `
      <div class="relative">
        <img src="${produto.imagem_url}" alt="${produto.descricao}" class="${imgClasses}">
        ${seloIndisponivel}
      </div>

      <h3 class="font-bold text-lg">${produto.descricao}</h3>

      <p class="text-gray-600 text-sm mb-2">
        Código: ${produto.codigo}
      </p>

      <span class="font-bold ${indisponivel ? "text-gray-500" : "text-red-600"} mb-2">
        R$ ${produto.valor_sugerido.toFixed(2)}
      </span>

      <button class="${btnClasses}" ${indisponivel ? "disabled" : ""}>
        ${indisponivel ? "Indisponível" : "Adicionar"}
      </button>
    `;

    card.addEventListener("click", () => {
      if (indisponivel) {
        mostrarModalIndisponivel();
        return;
      }

      // SE FOR BEBIDA, adiciona direto ao carrinho sem modal
      if (categoriaNormalizada === "bebidas") {
        adicionarProdutoDireto(produto); // função que adiciona direto
      } else {
        abrirModal(produto); // apenas alimentos abrem modal de opções
      }
    });

    container.appendChild(card);
  });
}

// Função para adicionar direto ao carrinho
function adicionarProdutoDireto(produto) {
  const existente = carrinho.find(p => p.id === produto.id);

  if (existente) {
    existente.quantidade += 1;
  } else {
    carrinho.push(produto);
  }

  salvarCarrinho();                 // 🔥 FALTAVA ISSO
  atualizarCarrinhoUI();
  atualizarContadorCarrinho();
  atualizarStatusPedido(carrinho);  // 🔥 mantém status correto
  abrirModalPedido();
}



function atualizarContadorCarrinho() {
  const cardCount = document.getElementById("card-count");
  if (!cardCount) return;

  // conta quantos produtos diferentes existem no carrinho
  const totalProdutosDiferentes = carrinho.length;

  cardCount.textContent = totalProdutosDiferentes;
}



// ===============================
// ELEMENTOS
// ===============================
const inputPesquisa = document.getElementById('pesquisaProduto')
const produtosContainer = document.getElementById('produtosContainer')

// ===============================
// BUSCA REAL NO CARDÁPIO
// ===============================

function filtrarProdutos(texto) {
  const termo = texto.trim().toLowerCase();
  const categorias = produtosContainer.querySelectorAll("[data-categoria]");
  const cards = produtosContainer.querySelectorAll(".produto-card");

  // 🔁 RESET TOTAL
  if (!termo) {
    categorias.forEach(cat => cat.classList.remove("hidden"));
    cards.forEach(card => card.classList.remove("hidden"));
    return;
  }

  // Esconde tudo
  categorias.forEach(cat => cat.classList.add("hidden"));
  cards.forEach(card => card.classList.add("hidden"));

  // Mostra apenas os produtos que batem
  cards.forEach(card => {
    if (card.dataset.nome.includes(termo)) {
      card.classList.remove("hidden");

      // Mostra a categoria correspondente
      const categoria = produtosContainer.querySelector(
        `[data-categoria="${card.dataset.categoria}"]`
      );
      if (categoria) categoria.classList.remove("hidden");
    }
  });
}


// ===============================
// EVENTO
// ===============================
inputPesquisa.addEventListener("input", e => {
  filtrarProdutos(e.target.value);
});

//cadastro login
const btnCadastro = document.getElementById("btn-cadastro");

btnCadastro.addEventListener("click", async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      alert("Erro ao tentar logar com Google: " + error.message);
      return;
    }

    // se deu certo, ele redireciona automaticamente
    console.log("Login Google iniciado", data);
  } catch (error) {
    console.error(error);
    alert("Erro ao tentar logar com Google!");
  }
});

// ===============================
// VERIFICA LOGIN DO USUÁRIO
// ===============================
async function verificarLogin() {
  const { data, error } = await supabase.auth.getUser();

  const btnCadastro = document.getElementById("btn-cadastro");
  const userPhoto = document.getElementById("userPhoto");

  // ❌ NÃO LOGADO
  if (error || !data?.user) {
    if (btnCadastro) btnCadastro.style.display = "block";
    if (userPhoto) userPhoto.classList.add("hidden");
    return;
  }

  const user = data.user;

  // ✅ LOGADO
  if (btnCadastro) btnCadastro.style.display = "none";

  if (userPhoto) {
    userPhoto.src =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      "";
    userPhoto.classList.remove("hidden");
  }

  // ============================================
  // 🔎 VERIFICAR SE JÁ EXISTE CADASTRO
  // ============================================

  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .select("id")
    .eq("email", user.email)
    .maybeSingle(); // 👈 melhor que single()

  if (clienteError) {
    console.error("Erro ao verificar cliente:", clienteError);
    return;
  }

  // ❗ SE NÃO EXISTE → ABRE MODAL
  if (!cliente) {
    const modalCadastro = document.getElementById("modalCadastroCliente");

    if (modalCadastro) {
      modalCadastro.classList.remove("hidden");
    }

    // 👉 opcional: bloquear botão de pedido
    bloquearPedidos();
  } else {
    liberarPedidos();
  }
}

function bloquearPedidos() {
  const botoesPedido = document.querySelectorAll(".btn-fazer-pedido");

  botoesPedido.forEach(btn => {
    btn.disabled = true;
    btn.classList.add("opacity-50", "cursor-not-allowed");
  });
}

function liberarPedidos() {
  const botoesPedido = document.querySelectorAll(".btn-fazer-pedido");

  botoesPedido.forEach(btn => {
    btn.disabled = false;
    btn.classList.remove("opacity-50", "cursor-not-allowed");
  });
}

// ===============================
// CARREGA LOGO DA EMPRESA
// ===============================
async function carregarLogotipoEmpresa() {
  const img = document.getElementById("logoEmpresa");
  if (!img) return;

  const { data, error } = await supabase
    .from("empresa")
    .select("logotipo")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data?.logotipo) {
    console.warn("Empresa sem logotipo válido");
    return;
  }

  img.src = data.logotipo;
  img.classList.remove("hidden");
}

// ===============================
// CONFIGURAÇÃO DO MODAL DE NOME
// ===============================
const btnSalvarNome = document.getElementById("btnSalvarNome");
const inputNome = document.getElementById("inputNome");
const erroNome = document.getElementById("erroNome");
const modalNome = document.getElementById("modalNome");

// ESCONDE ERRO AO DIGITAR
inputNome.addEventListener("input", () => {
  erroNome.classList.add("hidden");
});

// BOTÃO DE CONFIRMAÇÃO DO NOME
btnSalvarNome.addEventListener("click", () => {
  const nome = inputNome.value.trim();

  // Regex: permite letras (maiúsculas/minúsculas), acentos e espaços
  const regexValido = /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/;

  // valida campo vazio ou caracteres inválidos
  if (!nome || !regexValido.test(nome)) {

    // se estiver vazio
    if (!nome) {
      erroNome.textContent = "Por favor, informe seu nome completo.";
    } else {
      // se tiver número ou caracteres inválidos
      erroNome.textContent = "O nome deve conter apenas letras.";
      inputNome.value = ""; // limpa o campo
    }

    erroNome.classList.remove("hidden");
    inputNome.focus();
    return;
  }

  // Nome válido
  erroNome.classList.add("hidden");

  // futuramente esse nome será salvo no banco
  console.log("Nome digitado (não salvo ainda):", nome);

  modalNome.classList.add("hidden");
});

// ===============================
// INICIALIZAÇÃO
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  verificarLogin();
});



  const userPhoto = document.getElementById("userPhoto");
  const modalConta = document.getElementById("modalContaCliente");

  // Abrir / fechar ao clicar na foto
  userPhoto.addEventListener("click", (e) => {
    e.stopPropagation();

    modalConta.classList.toggle("hidden");
    posicionarModalConta();
  });

  // Fecha ao clicar fora
  modalConta.addEventListener("click", (e) => {
    if (e.target === modalConta) {
      fecharModalConta();
    }
  });

  function fecharModalConta() {
    modalConta.classList.add("hidden");
  }

  function posicionarModalConta() {
    const modalBox = modalConta.querySelector("div");

    // Remove centralização padrão
    modalConta.classList.remove("items-center", "justify-center");
    modalConta.classList.add("items-start", "justify-end");

    // Estilo tipo dropdown
    modalBox.classList.add(
      "mt-16",
      "mr-4"
    );
  }

  // ===============================
// LOGOUT DO CLIENTE + MODAL SUCESSO
// ===============================

async function logoutCliente() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Erro ao sair da conta:", error);
      return;
    }

    // Fecha modal da conta
    fecharModalConta();

    // Atualiza interface (volta para estado deslogado)
    const btnCadastro = document.getElementById("btn-cadastro");
    const userPhoto = document.getElementById("userPhoto");

    if (btnCadastro) btnCadastro.style.display = "block";
    if (userPhoto) userPhoto.classList.add("hidden");

    // Abre modal de sucesso
    abrirModalLogout();

  } catch (err) {
    console.error("Erro inesperado no logout:", err);
  }
}

// Modal Logout Sucesso
function abrirModalLogout() {
  const modal = document.getElementById("modalLogoutSucesso");
  if (modal) modal.classList.remove("hidden");
}

function fecharModalLogout() {
  const modal = document.getElementById("modalLogoutSucesso");
  if (modal) modal.classList.add("hidden");
}

// ===============================
// EXPÕE FUNÇÕES PARA onclick
// ===============================
window.logoutCliente = logoutCliente;
window.fecharModalLogout = fecharModalLogout;


// Função para mostrar/ocultar o modal
function atualizarModal(bloqueado) {
  const modal = document.getElementById("modalManutencao");

  if (bloqueado) {
    modal.classList.remove("hidden");
  } else {
    modal.classList.add("hidden");
  }
}


// Função para verificar o estado do cardápio
async function verificarEstadoCardapio() {
  const { data } = await supabase
    .from("config_cardapio")
    .select("cardapio_bloqueado")
    .eq("id", 1)
    .single();

  atualizarModal(data.cardapio_bloqueado);

  if (!data.cardapio_bloqueado) {
    carregarCardapio();
  }
}

// Ao carregar a página
document.addEventListener("DOMContentLoaded", async () => {
  await verificarEstadoCardapio();

  // Realtime: fica ouvindo mudanças na tabela
  supabase
    .channel("cardapio-status")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "config_cardapio", filter: "id=eq.1" },
      (payload) => {
        // Quando o Admin mudar o status no painel, o cardápio atualiza imediatamente
        verificarEstadoCardapio();
      }
    )
    .subscribe();
});

document.addEventListener("DOMContentLoaded", () => {
  const modalErro = document.getElementById("modal-erro");
  const btnFechar = document.getElementById("fechar-modal-erro");
  const mensagemErro = document.getElementById("mensagem-erro");

  function abrirModalErro(msg) {
    mensagemErro.textContent = msg;
    modalErro.classList.remove("hidden");
    modalErro.classList.add("flex");
  }

  btnFechar.addEventListener("click", () => {
    modalErro.classList.add("hidden");
    modalErro.classList.remove("flex");
  });

  modalErro.addEventListener("click", (e) => {
    if (e.target === modalErro) {
      modalErro.classList.add("hidden");
      modalErro.classList.remove("flex");
    }
  });

  // Exemplo de uso:
  // abrirModalErro("Ocorreu um erro!");
});

// ===============================
// ELEMENTOS CADASTRO DO USUARIO
// ===============================
const btnInformacoesCadastro = document.getElementById("btnInformacoesCadastro");
const modalCadastroCliente = document.getElementById("modalCadastroCliente");
const modalContaCliente = document.getElementById("modalContaCliente"); // modal da conta
const formCadastroCliente = document.getElementById("formCadastroCliente");
const btnCadastrar = formCadastroCliente?.querySelector('button[type="submit"]');


// ===============================
// VARIÁVEL PARA GUARDAR OS VALORES ORIGINAIS
// ===============================
let valoresOriginais = {};


// ===============================
async function abrirInformacoesCadastro() {
  if (!modalCadastroCliente) return;

  // Abre o modal
  modalCadastroCliente.classList.remove("hidden");

  // Fecha modal da conta se estiver aberto
  if (modalContaCliente && !modalContaCliente.classList.contains("hidden")) {
    modalContaCliente.classList.add("hidden");
  }

  try {
    // ===============================
    // Funções auxiliares
    // ===============================
    function validarCPF(cpf) {
      cpf = cpf.replace(/\D/g, "");
      if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

      let soma = 0;
      for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
      let resto = (soma * 10) % 11;
      if (resto === 10) resto = 0;
      if (resto !== parseInt(cpf[9])) return false;

      soma = 0;
      for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
      resto = (soma * 10) % 11;
      if (resto === 10) resto = 0;
      if (resto !== parseInt(cpf[10])) return false;

      return true;
    }

    function formatarCPF(cpf) {
      cpf = cpf.replace(/\D/g, "");
      return cpf
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    // ===============================
    // Busca usuário logado
    // ===============================
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return;
    const userEmail = userData.user.email;

    // Busca cliente pelo email
    const { data: cliente, error: clienteError } = await supabase
      .from("clientes")
      .select("*")
      .eq("email", userEmail)
      .maybeSingle();
    if (clienteError) {
      console.error("Erro ao buscar cliente:", clienteError);
      return;
    }

    // ===============================
    // Preenche os campos
    // ===============================
    if (cliente) {
      document.getElementById("nomeCliente").value = cliente.nome || "";
      document.getElementById("cpfCliente").value = cliente.cpf || "";
      document.getElementById("telefoneCliente").value = cliente.telefone || cliente.celular || "";
      document.getElementById("ruaCliente").value = cliente.endereco || "";
      document.getElementById("numeroCliente").value = cliente.numero || "";
      document.getElementById("bairroCliente").value = cliente.bairro || "";
      document.getElementById("cidadeCliente").value = cliente.cidade || "";
      document.getElementById("ufCliente").value = cliente.uf || "";

      valoresOriginais = {
        nome: cliente.nome || "",
        cpf: cliente.cpf || "",
        telefone: cliente.telefone || cliente.celular || "",
        endereco: cliente.endereco || "",
        numero: cliente.numero || "",
        bairro: cliente.bairro || "",
        cidade: cliente.cidade || "",
        uf: cliente.uf || ""
      };
    } else {
      formCadastroCliente.reset();
      valoresOriginais = {};
    }

    // ===============================
    // Desabilita botão caso CPF inválido
    // ===============================
    if (btnCadastrar) {
      btnCadastrar.disabled = true;
      btnCadastrar.classList.add("bg-gray-400", "cursor-not-allowed");
      btnCadastrar.classList.remove("bg-red-600", "hover:bg-red-700");
    }

    // ===============================
    // Máscara CPF e validação em tempo real
    // ===============================
    const cpfInput = document.getElementById("cpfCliente");
    const mensagemErroCPF = document.getElementById("mensagem-erro-cpf");

    if (cpfInput) {
      cpfInput.addEventListener("input", () => {
        let valor = cpfInput.value.replace(/\D/g, "");
        if (valor.length > 11) valor = valor.slice(0, 11);

        if (valor.length > 3) valor = valor.replace(/^(\d{3})(\d)/, "$1.$2");
        if (valor.length > 6) valor = valor.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
        if (valor.length > 9) valor = valor.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");

        cpfInput.value = valor;

        const cpfNumeros = valor.replace(/\D/g, "");
        if (cpfNumeros.length === 11 && validarCPF(valor)) {
          btnCadastrar.disabled = false;
          btnCadastrar.classList.remove("bg-gray-400", "cursor-not-allowed");
          btnCadastrar.classList.add("bg-red-600", "hover:bg-red-700");
          if (mensagemErroCPF) mensagemErroCPF.textContent = "";
        } else {
          btnCadastrar.disabled = true;
          btnCadastrar.classList.add("bg-gray-400", "cursor-not-allowed");
          btnCadastrar.classList.remove("bg-red-600", "hover:bg-red-700");
          if (mensagemErroCPF) mensagemErroCPF.textContent = "CPF inválido ou incompleto";
        }
      });

      cpfInput.addEventListener("blur", () => {
        const cpfNumeros = cpfInput.value.replace(/\D/g, "");
        if (cpfNumeros.length < 11 || !validarCPF(cpfInput.value)) {
          if (mensagemErroCPF) mensagemErroCPF.textContent = "CPF inválido! Verifique o número digitado.";
        } else {
          if (mensagemErroCPF) mensagemErroCPF.textContent = "";
        }
      });
    }

  } catch (err) {
    console.error("Erro ao carregar dados do cliente:", err);
  }
}

// ===============================
// FUNÇÃO PARA CHECAR SE HOUVE ALTERAÇÃO
// ===============================
function verificarAlteracoes() {
  if (!btnCadastrar) return;

  const atual = {
    nome: document.getElementById("nomeCliente").value.trim(),
    cpf: document.getElementById("cpfCliente").value.trim(),
    telefone: document.getElementById("telefoneCliente").value.trim(),
    endereco: document.getElementById("ruaCliente").value.trim(),
    numero: document.getElementById("numeroCliente").value.trim(),
    bairro: document.getElementById("bairroCliente").value.trim(),
    cidade: document.getElementById("cidadeCliente").value.trim(),
    uf: document.getElementById("ufCliente").value.trim()
  };

  const mudou = Object.keys(atual).some(key => atual[key] !== (valoresOriginais[key] || ""));

  btnCadastrar.disabled = !mudou;

  // Atualiza a cor do botão
  if (mudou) {
    btnCadastrar.classList.remove("bg-gray-400", "cursor-not-allowed");
    btnCadastrar.classList.add("bg-red-600", "hover:bg-red-700", "cursor-pointer");
  } else {
    btnCadastrar.classList.add("bg-gray-400", "cursor-not-allowed");
    btnCadastrar.classList.remove("bg-red-600", "hover:bg-red-700", "cursor-pointer");
  }
}

// ===============================
// FUNÇÃO PARA FECHAR O MODAL DE CADASTRO
// ===============================
function fecharModalCadastro() {
  if (modalCadastroCliente) {
    modalCadastroCliente.classList.add("hidden");
  }
}

  // ===============================
   // FUNÇÃO PARA SALVAR/ATUALIZAR CADASTRO DO CLIENTE
  // ===============================
if (formCadastroCliente) {
  formCadastroCliente.addEventListener("submit", async (e) => {
    e.preventDefault();

    // ===============================
    // Captura os valores dos inputs
    // ===============================
    const nome = document.getElementById("nomeCliente").value.trim();
    let cpf = document.getElementById("cpfCliente").value.trim();
    const telefone = document.getElementById("telefoneCliente").value.trim();
    const endereco = document.getElementById("ruaCliente").value.trim();
    const numero = document.getElementById("numeroCliente").value.trim();
    const bairro = document.getElementById("bairroCliente").value.trim();
    const cidade = document.getElementById("cidadeCliente").value.trim();
    const uf = document.getElementById("ufCliente").value.trim();

    // ===============================
    // Funções auxiliares
    // ===============================
    function validarCPF(cpf) {
      cpf = cpf.replace(/\D/g, "");
      if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

      let soma = 0;
      for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
      let resto = (soma * 10) % 11;
      if (resto === 10) resto = 0;
      if (resto !== parseInt(cpf[9])) return false;

      soma = 0;
      for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
      resto = (soma * 10) % 11;
      if (resto === 10) resto = 0;
      if (resto !== parseInt(cpf[10])) return false;

      return true;
    }

    function formatarCPF(cpf) {
      cpf = cpf.replace(/\D/g, "");
      return cpf
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    // ===============================
    // Validação do CPF
    // ===============================
    if (!validarCPF(cpf)) {
      alert("CPF inválido! Verifique o número digitado.");
      return;
    }

    // Formata o CPF antes de salvar
    cpf = formatarCPF(cpf);

    try {
      // ===============================
      // Pega usuário logado
      // ===============================
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        alert("Você precisa estar logado para cadastrar os dados.");
        return;
      }
      const userEmail = userData.user.email;

      // ===============================
      // Verifica se já existe cliente
      // ===============================
      const { data: existingCliente } = await supabase
        .from("clientes")
        .select("id")
        .eq("email", userEmail)
        .maybeSingle();

      if (existingCliente) {
        // Atualiza dados existentes (não insere duplicado)
        const { error: updateError } = await supabase
          .from("clientes")
          .update({ nome, cpf, telefone, endereco, numero, bairro, cidade, uf })
          .eq("email", userEmail);

        if (updateError) throw updateError;
        alert("Cadastro atualizado com sucesso!");
      } else {
        // Insere novo registro
        const { error: insertError } = await supabase
          .from("clientes")
          .insert([{ nome, cpf, telefone, endereco, numero, bairro, cidade, uf, email: userEmail, status: "ativo" }]);

        if (insertError) throw insertError;
        alert("Cadastro realizado com sucesso!");
      }

      // Fecha o modal
      fecharModalCadastro();

    } catch (err) {
      console.error("Erro ao salvar cadastro:", err);
      alert("Ocorreu um erro ao salvar seus dados. Tente novamente.");
    }
  });

  // ===============================
  // Monitora alterações para habilitar/desabilitar botão
  // ===============================
  const inputs = formCadastroCliente.querySelectorAll("input");
  inputs.forEach(input => input.addEventListener("input", verificarAlteracoes));
}

// ===============================
// EVENTOS
// ===============================
if (btnInformacoesCadastro) {
  btnInformacoesCadastro.addEventListener("click", abrirInformacoesCadastro);
}

if (modalCadastroCliente) {
  modalCadastroCliente.addEventListener("click", (e) => {
    if (e.target === modalCadastroCliente) {
      fecharModalCadastro();
    }
  });
}

window.fecharModalCadastro = fecharModalCadastro;
// ===============================
// ELEMENTOS
// ===============================
const btnHistoricoPedidos = document.getElementById("btnHistoricoPedidos");
const modalHistoricoPedidos = document.getElementById("modalHistoricoPedidos");
const containerPedidos = document.getElementById("historicoPedidosBody");

// Botão fechar histórico
const btnFecharHistorico = modalHistoricoPedidos?.querySelector("button");

// Elementos do modalProdutos (drawer lateral)
const modalProdutos = document.getElementById("modalProdutos");
const modalProdutosContent = document.getElementById("modalProdutosContent");
const btnFecharProdutos = document.getElementById("fecharModalProdutos");
const modalListaProdutos = document.getElementById("modalListaProdutos");
const modalProdutosDataHora = document.getElementById("modalProdutosDataHora");

// ===============================
// FUNÇÕES DE CONTROLE DO DRAWER
// ===============================

function abrirModalProdutos() {
  if (!modalProdutos) return;

  modalProdutos.classList.remove("hidden");

  // animação lateral
  setTimeout(() => {
    modalProdutosContent?.classList.remove("translate-x-full");
  }, 10);
}

function fecharModalProdutos() {
  if (!modalProdutos) return;

  modalProdutosContent?.classList.add("translate-x-full");

  setTimeout(() => {
    modalProdutos.classList.add("hidden");
  }, 300);
}

// ===============================
// FUNÇÃO PARA FECHAR HISTÓRICO
// ===============================
function fecharHistoricoPedidos() {
  if (!modalHistoricoPedidos) return;

  modalHistoricoPedidos.classList.add("hidden");
  console.log("[DEBUG] modalHistoricoPedidos fechado");
}

// ===============================
// EVENTOS FECHAR
// ===============================

// Botão fechar produtos
btnFecharProdutos?.addEventListener("click", fecharModalProdutos);

// Botão fechar histórico
btnFecharHistorico?.addEventListener("click", fecharHistoricoPedidos);

// fechar clicando no overlay escuro
modalProdutos?.addEventListener("click", (e) => {
  if (e.target === modalProdutos) fecharModalProdutos();
});

modalHistoricoPedidos?.addEventListener("click", (e) => {
  if (e.target === modalHistoricoPedidos) fecharHistoricoPedidos();
});

// ===============================
// FUNÇÃO PARA ABRIR HISTÓRICO
// ===============================
async function abrirHistoricoPedidos() {
  if (!modalHistoricoPedidos) return;

  // Fecha modalContaCliente se estiver aberto
  if (typeof modalContaCliente !== "undefined" && modalContaCliente && !modalContaCliente.classList.contains("hidden")) {
    modalContaCliente.classList.add("hidden");
  }

  modalHistoricoPedidos.classList.remove("hidden");

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      alert("Você precisa estar logado para ver o histórico.");
      return;
    }

    const userEmail = userData.user.email;

    const { data: pedidos, error: pedidosError } = await supabase
      .from("pedidos")
      .select("numero_pedido, horario_recebido, status")
      .eq("email", userEmail)
      .eq("status", "Finalizado")
      .order("horario_recebido", { ascending: false });

    if (pedidosError) throw pedidosError;

    containerPedidos.innerHTML = "";

    if (!pedidos || pedidos.length === 0) {
      containerPedidos.innerHTML = `
        <tr>
          <td colspan="3" class="text-center text-gray-500 py-4">
            Nenhum pedido finalizado encontrado.
          </td>
        </tr>`;
      return;
    }

    pedidos.forEach((pedido) => {
      const dataObj = new Date(pedido.horario_recebido);
      const data = dataObj.toLocaleDateString("pt-BR");
      const hora = dataObj.toLocaleTimeString("pt-BR");

      const tr = document.createElement("tr");
      tr.className = "border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition";
      tr.innerHTML = `
        <td class="py-2 px-4 text-gray-800 font-semibold">${pedido.numero_pedido}</td>
        <td class="py-2 px-4 text-gray-700">${data}</td>
        <td class="py-2 px-4 text-gray-700">${hora}</td>
      `;

      tr.addEventListener("click", async () => {
        const { data: pedidoCompleto } = await supabase
          .from("pedidos")
          .select("*")
          .eq("numero_pedido", pedido.numero_pedido)
          .single();

        if (!pedidoCompleto) return;

        // Data e hora
        if (pedidoCompleto.horario_recebido) {
          const d = new Date(pedidoCompleto.horario_recebido);
          modalProdutosDataHora.textContent = d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR");
        } else {
          modalProdutosDataHora.textContent = "—";
        }

        // Itens
        modalListaProdutos.innerHTML = "";
        let itens = [];
        try {
          if (typeof pedidoCompleto.itens === "string") itens = JSON.parse(pedidoCompleto.itens);
          else if (Array.isArray(pedidoCompleto.itens)) itens = pedidoCompleto.itens;
          else if (pedidoCompleto.itens) itens = [pedidoCompleto.itens];
        } catch (e) {
          console.error("Erro ao interpretar itens:", e);
        }

        itens.forEach((item) => {
          const li = document.createElement("li");
          li.className = "bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center";
          li.innerHTML = `
            <div>
              <p class="font-semibold text-gray-800">${item.descricao || "Produto"}</p>
              <p class="text-xs text-gray-500">Quantidade: ${item.quantidade || 1}</p>
            </div>
            <span class="font-bold text-gray-900">
              R$ ${item.total ? parseFloat(item.total).toFixed(2) : "0.00"}
            </span>
          `;
          modalListaProdutos.appendChild(li);
        });

        fecharHistoricoPedidos();
        abrirModalProdutos();
      });

      containerPedidos.appendChild(tr);
    });

  } catch (err) {
    console.error("[ERRO] Erro ao carregar histórico:", err);
    containerPedidos.innerHTML = `
      <tr>
        <td colspan="3" class="text-center text-red-500 py-4">
          Erro ao carregar pedidos.
        </td>
      </tr>`;
  }
}

// ===============================
// EVENTO ABRIR HISTÓRICO
// ===============================
btnHistoricoPedidos?.addEventListener("click", abrirHistoricoPedidos);