// =============================
// CONFIGURAÇÃO DO SUPABASE
// =============================
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYWtibmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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


function esconderLoaderProdutos() {
  const container = document.getElementById("produtosContainer");
  container.innerHTML = "";
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
      p.categoria.trim().toLowerCase() === nomeCategoria
    );

    if (produtosCategoria.length === 0) return;

    /* ===== TÍTULO DA CATEGORIA ===== */
    const blocoCategoria = document.createElement("div");
    blocoCategoria.className = "col-span-full mb-4";

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
export function abrirModal(produto) {
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

  // Botão de adicionar ao pedido
  document.getElementById("btnAdicionarPedido").onclick = () => {
    if (produto.estoque === 0) {
      alert("Produto indisponível no momento!");
    } else {
      alert(`Produto "${produto.descricao_nfe}" adicionado ao pedido!`);
      // Aqui você pode adicionar lógica para enviar ao carrinho
    }
  };

  // Botão de escolher opções
  const btnOpcoes = document.getElementById("btnEscolherOpcoes");
  if (btnOpcoes) {
    btnOpcoes.addEventListener("click", () => {
      abrirModalOpcoes(produto);
    });
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


 // Espera o DOM carregar
  document.addEventListener("DOMContentLoaded", () => {
    const botaoCarrinho = document.getElementById("card-btn");
    const modal = document.getElementById("modalPedido");
    const botaoFechar = document.getElementById("fecharModalCarrinho");

    // Abre o modal ao clicar no botão do footer
    botaoCarrinho.addEventListener("click", () => {
      modal.classList.remove("hidden");
    });

    // Fecha o modal
    botaoFechar.addEventListener("click", () => {
      modal.classList.add("hidden");
    });

    // Fecha clicando fora do conteúdo
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  });


  
 // =============================
// CARREGAR HORÁRIO DE ATENDIMENTO
// =============================
// =============================
// FUNÇÃO PARA CARREGAR HORÁRIO E STATUS
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
      return;
    }

    const ordemDias = ["domingo","segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

    // Filtra apenas dias com horário definido e ordena
    const horariosValidos = data
      .filter(d => d.hora_inicio && d.hora_fim)
      .sort((a, b) => ordemDias.indexOf(a.dia_semana) - ordemDias.indexOf(b.dia_semana));

    if (horariosValidos.length === 0) {
      elemento.textContent = "Horário não configurado";
      return;
    }

    // Resumo do horário (primeiro e último dia)
    const primeiro = horariosValidos[0];
    const ultimo = horariosValidos[horariosValidos.length - 1];
    const textoResumo = `${primeiro.dia_semana.charAt(0).toUpperCase() + primeiro.dia_semana.slice(1)} a ${ultimo.dia_semana.charAt(0).toUpperCase() + ultimo.dia_semana.slice(1)} - ${primeiro.hora_inicio.substring(0,5)} às ${ultimo.hora_fim.substring(0,5)}`;

    // Verifica se está aberto ou fechado
    const agora = new Date();
    const diaAtual = ordemDias[agora.getDay()]; // domingo=0, segunda=1 ...
    const horarioAtual = agora.getHours() * 60 + agora.getMinutes(); // minutos desde meia-noite

    const horarioHoje = horariosValidos.find(h => h.dia_semana === diaAtual);

    let status = "Fechado";
    if (horarioHoje) {
      const inicio = parseInt(horarioHoje.hora_inicio.substring(0,2)) * 60 + parseInt(horarioHoje.hora_inicio.substring(3,5));
      const fim = parseInt(horarioHoje.hora_fim.substring(0,2)) * 60 + parseInt(horarioHoje.hora_fim.substring(3,5));
      if (horarioAtual >= inicio && horarioAtual <= fim) {
        status = "Aberto";
      }
    }

    elemento.textContent = `${textoResumo} — ${status}`;

  } catch (err) {
    console.error("Erro ao buscar horários:", err.message);
    elemento.textContent = "Erro ao carregar horários";
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

// Lista de categorias (pode vir do Supabase ou API)
const categorias = [
  { id: 1, nome: "Bebidas" },
  { id: 2, nome: "Lanches" },
  { id: 3, nome: "Sobremesas" },
  { id: 4, nome: "Promoções" },
  { id: 5, nome: "Saladas" }
];

// Função para popular categorias
function carregarCategorias() {
  const container = document.getElementById("categoriasSection");
  container.innerHTML = ""; // limpa antes de adicionar

  categorias.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat.nome;
    btn.className = "px-4 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition text-sm sm:text-base";
    btn.addEventListener("click", () => {
      console.log("Categoria selecionada:", cat.nome);
      // Aqui você pode filtrar os produtos pelo id/nome da categoria
    });
    container.appendChild(btn);
  });
}

// Chama a função para popular as categorias
carregarCategorias();

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

