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

  const modalAviso = document.getElementById("modalCarrinhoExistente");
  const modalPedido = document.getElementById("modalPedido");

  const btnFecharAviso = document.getElementById("btnFecharAviso");
  const btnContinuarPedido = document.getElementById("btnContinuarPedido");

  // 🔘 BOTÃO: AGORA NÃO
  if (btnFecharAviso) {
    btnFecharAviso.addEventListener("click", () => {
      modalAviso.classList.add("hidden");
    });
  }

  // 🔘 BOTÃO: CONTINUAR
  if (btnContinuarPedido) {
    btnContinuarPedido.addEventListener("click", () => {
      modalAviso.classList.add("hidden");
      modalPedido.classList.remove("hidden");
    });
  }

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
  const { data, error } = await supabase
    .from("pedidos")
    .select("id")
    .order("id", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Erro ao buscar o último pedido:", error);
    return;
  }

  const ultimoId = data[0]?.id ?? 0;
  const proximo = ultimoId + 1;
  document.getElementById("pedidoNumero").innerText =
    String(proximo).padStart(4, "0");
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

  // Toast (mensagem estilizada)
  const toast = document.getElementById("toast");
  const toastTitulo = document.getElementById("toastTitulo");
  const toastMensagem = document.getElementById("toastMensagem");

  // Nome da empresa (buscado no Supabase)
  let nomeEmpresa = "suporte"; // valor padrão caso dê erro

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

  function mostrarToast(titulo, mensagem) {
    toastTitulo.innerText = titulo;
    toastMensagem.innerText = mensagem;

    toast.classList.remove("hidden");
    toast.classList.add("show");

    // fecha automaticamente após 4 segundos
    setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.add("hidden");
    }, 4000);
  }

  // 🔢 Máscara do celular
  inputCelular.addEventListener("input", () => {
    inputCelular.value = formatarCelular(inputCelular.value);
  });

  // ===============================
  // 🛒 ABRIR MODAL (SÓ SE LOGADO)
  // ===============================
  botaoCarrinho.addEventListener("click", async () => {
    const { data, error } = await supabase.auth.getUser();
    const usuarioLogado = !error && !!data.user;

    if (!usuarioLogado) {
      abrirModalLoginNecessario();
      return;
    }

    // usuário logado → abre modal
    modal.classList.remove("hidden");
  });

  // Fecha o modal
  botaoFechar.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Fecha clicando fora
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  // ===============================
  // 📦 RETIRAR NO LOCAL
  // ===============================
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

    // 🔁 Atualiza total
    atualizarCarrinhoUI();
  });

  // ===============================
  // 🔒 VALIDAÇÃO AO FINALIZAR (COM BLOQUEIO)
  // ===============================
  
  btnFinalizar.addEventListener("click", async (e) => {
  e.preventDefault();

  // ===============================
  // 🔐 VERIFICA LOGIN GOOGLE
  // ===============================
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    abrirModalLoginNecessario();
    return;
  }

  const user = userData.user;
  if (!user.app_metadata?.provider || user.app_metadata.provider !== "google") {
    mostrarToast("Login necessário", "Faça login com sua conta Google para enviar pedidos.");
    return;
  }

  const emailLogado = user.email;

  // ===============================
  // 🔎 BUSCA CLIENTE EXISTENTE
  // ===============================
  let { data: cliente, error: errCliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("email", emailLogado)
    .single();

  if (errCliente && errCliente.code !== "PGRST116") {
    mostrarToast("Erro", "Erro ao verificar cliente.");
    return;
  }

  // ===============================
  // ⚠️ SE CLIENTE NÃO EXISTIR, ABRE MODAL PARA PEGAR NOME
  // ===============================
  if (!cliente) {
    const modalNome = document.getElementById("modalNome");
    if (!modalNome) {
      mostrarToast("Erro", "Modal de nome não encontrado.");
      return;
    }

    modalNome.classList.remove("hidden");

    const btnSalvarNome = modalNome.querySelector("#btnSalvarNome");
    const inputNome = modalNome.querySelector("#inputNome");
    const erroNome = modalNome.querySelector("#erroNome");

    if (!btnSalvarNome || !inputNome) {
      mostrarToast("Erro", "Elementos do modal não encontrados.");
      return;
    }

    // Espera o usuário digitar o nome e clicar no botão
    cliente = await new Promise((resolve) => {
      btnSalvarNome.onclick = async () => {
        const nomeCliente = inputNome.value.trim();

        // Validação básica: não vazio e sem números
        if (!nomeCliente || /\d/.test(nomeCliente)) {
          erroNome?.classList.remove("hidden");
          return;
        }
        erroNome?.classList.add("hidden");

        // ===============================
        // 🆕 CRIA CLIENTE NO SUPABASE
        // ===============================
        const { data: novoCliente, error: insertClienteError } = await supabase
          .from("clientes")
          .insert([
            {
              nome: nomeCliente,      // salva o nome do modal
              email: emailLogado,
              celular: inputCelular.value, // salva o telefone
              criado_em: new Date().toISOString(),
              status: "ativo",
              bloqueado: false,
              saldo_cashback: 0
            }
          ])
          .select()
          .single();

        if (insertClienteError) {
          mostrarToast("Erro", "Não foi possível criar cliente.");
          console.error(insertClienteError);
          return;
        }

        modalNome.classList.add("hidden");
        resolve(novoCliente); // retorna o cliente criado
      };
    });
  } else {
    // ===============================
    // 🔄 ATUALIZA CELULAR SE CLIENTE EXISTIR
    // ===============================
    if (inputCelular.value && inputCelular.value !== cliente.celular) {
      const { error: updateError } = await supabase
        .from("clientes")
        .update({ celular: inputCelular.value })
        .eq("id", cliente.id);

      if (updateError) {
        mostrarToast("Erro", "Não foi possível atualizar o celular do cliente.");
        console.error(updateError);
        return;
      }

      cliente.celular = inputCelular.value;
      console.log("Celular do cliente atualizado:", cliente.celular);
    }
  }

  // ===============================
  // 🔒 VERIFICA BLOQUEIO
  // ===============================
  if (cliente.bloqueado === true) {
    mostrarToast("Acesso bloqueado", "Seu acesso está bloqueado.");
    return;
  }

  // ===============================
  // 🛒 VERIFICA CARRINHO
  // ===============================
  if (!carrinho || carrinho.length === 0) {
    mostrarToast("Carrinho vazio", "Adicione produtos antes de enviar.");
    return;
  }

  // ===============================
  // 📞 VALIDA CAMPOS
  // ===============================
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

  // ===============================
  // 💰 CALCULA SUBTOTAL
  // ===============================
  let subtotal = carrinho.reduce((acc, item) => {
    const qtd = Number(item.quantidade) || 0;
    const valor = Number(item.valor_unitario) || 0;
    return acc + (qtd * valor);
  }, 0);
  subtotal = Number(subtotal.toFixed(2));

  // ===============================
  // 💵 PEGA TOTAL DO #totalPedido
  // ===============================
  const totalPedidoElemento = document.getElementById("totalPedido");
  if (!totalPedidoElemento) {
    mostrarToast("Erro", "Elemento totalPedido não encontrado.");
    return;
  }

  let totalTexto = totalPedidoElemento.innerText.replace("R$", "").replace(/\s/g, "").replace(",", ".");
  let total = parseFloat(totalTexto);
  if (isNaN(total)) {
    mostrarToast("Erro", "Valor total inválido.");
    return;
  }
  total = Number(total.toFixed(2));

  // ===============================
  // 🗄 INSERE PEDIDO NO SUPABASE
  // ===============================
  const { error: insertError } = await supabase.from("pedidos").insert([
    {
      numero_pedido: null,
      tipo_entrega: "delivery",
      horario_recebido: new Date().toISOString(),
      status: "Recebido",
      subtotal: subtotal,
      total: total,
      cliente: cliente.nome,
      telefone: inputCelular.value,
      endereco: checkboxRetirarLocal.checked ? null : inputEndereco.value,
      referencia: null,
      pagamento: "não informado",
      observacoes: null,
      criado_em: new Date().toISOString(),
      itens: carrinho
    }
  ]);

  if (insertError) {
    mostrarToast("Erro", insertError.message);
    console.error("ERRO SUPABASE:", insertError);
    return;
  }

  // ===============================
  // ✅ SUCESSO
  // ===============================
  mostrarToast("Pedido enviado 🎉", "Seu pedido foi recebido com sucesso!");
  limparCarrinhoStorage();
  atualizarCarrinhoUI();
  modal.classList.add("hidden");
});

  // Carrega taxa
  carregarTaxaEntrega();

  // Carrega nome da empresa
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

  // ❌ Usuário NÃO logado
  if (error || !data?.user) {
    const btnCadastro = document.getElementById("btn-cadastro");
    const userPhoto = document.getElementById("userPhoto");

    if (btnCadastro) btnCadastro.style.display = "block";
    if (userPhoto) userPhoto.classList.add("hidden");

    return;
  }

  const user = data.user;

  // ✅ Usuário logado
  const btnCadastro = document.getElementById("btn-cadastro");
  const userPhoto = document.getElementById("userPhoto");

  if (btnCadastro) btnCadastro.style.display = "none";

  if (userPhoto) {
    userPhoto.src =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      "";
    userPhoto.classList.remove("hidden");
  }

  // ⚠️ CONTROLE DO MODAL DE NOME
  // Abre **APENAS se for login via Google**
  const isGoogle = user.identities?.some(id => id.provider === "google");
  const modalJaMostrou = localStorage.getItem("modal_nome_mostrado");

  if (isGoogle && !user.user_metadata?.nome_apelido && !modalJaMostrou) {
    const modal = document.getElementById("modalNome");

    if (modal) {
      modal.classList.remove("hidden");
    }

    // 👉 carrega logo da empresa (se existir)
    await carregarLogotipoEmpresa();

    localStorage.setItem("modal_nome_mostrado", "true");
  }
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
