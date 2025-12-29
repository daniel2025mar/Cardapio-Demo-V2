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

// =============================
// CARREGAR PRODUTOS NO CARDÁPIO
// =============================
export async function carregarProdutosNoCardapio() {
  const produtos = await buscarProdutos();
  const container = document.getElementById("produtosContainer");
  container.innerHTML = "";

  if (!produtos || produtos.length === 0) {
    container.innerHTML = "<p class='text-center col-span-full'>Nenhum produto encontrado.</p>";
    return;
  }

  produtos.forEach(produto => {
    const card = document.createElement("div");
    card.className = "bg-white rounded-lg shadow p-4 flex flex-col cursor-pointer hover:shadow-lg transition";

    card.innerHTML = `
      <img src="${produto.imagem_url}" alt="${produto.descricao}" class="w-full h-40 object-cover rounded mb-2">
      <h3 class="font-bold text-lg">${produto.descricao}</h3>
      <p class="text-gray-600 text-sm mb-2">Código: ${produto.codigo}</p>
      <span class="font-bold text-red-600 mb-2">R$ ${produto.valor_sugerido.toFixed(2)}</span>
      <button class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition mt-auto">
        Adicionar
      </button>
    `;

    card.addEventListener("click", () => abrirModal(produto));
    container.appendChild(card);
  });
}

// =============================
// ABRIR MODAL DE PRODUTO
// =============================
export function abrirModal(produto) {
  const modal = document.getElementById("modalProduto");
  const conteudo = document.getElementById("modalConteudo");

  conteudo.innerHTML = `
    <img src="${produto.imagem_url}" alt="${produto.descricao}" class="w-full h-48 object-cover rounded mb-4">
    <h2 class="text-xl font-bold mb-2">${produto.descricao}</h2>
    <p class="text-gray-700 mb-2">Código: ${produto.codigo}</p>
    <p class="text-red-600 font-bold mb-4">R$ ${produto.valor_sugerido.toFixed(2)}</p>
    <p class="text-gray-600 mb-2">Estoque: ${produto.estoque}</p>
    <button class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Adicionar ao Pedido</button>
  `;

  modal.classList.remove("hidden");
  document.getElementById("fecharModal").onclick = () => modal.classList.add("hidden");
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

// Informações da empresa
async function carregarEmpresa() {
  try {
    const { data, error } = await supabase
      .from('empresa')
      .select('nome, cnpj, endereco')  // Pega nome, CNPJ e endereço
      .eq('id', 1)                      // Pegando o único registro
      .single();                         // Retorna apenas um registro

    if (error) {
      console.error('Erro ao buscar empresa:', error);
      document.getElementById('nomeEmpresa').textContent = "Erro ao carregar nome";
      document.getElementById('empresaCNPJ').textContent = "Erro ao carregar CNPJ";
      document.getElementById('enderecoEmpresa').textContent = "Erro ao carregar endereço";
      return;
    }

    // Atualiza o HTML com os dados da tabela
    document.getElementById('nomeEmpresa').textContent = data.nome;
    document.getElementById('empresaCNPJ').textContent = `${data.nome} — CNPJ: ${data.cnpj}`;
    document.getElementById('enderecoEmpresa').textContent = data.endereco;

  } catch (err) {
    console.error('Erro inesperado:', err);
    document.getElementById('nomeEmpresa').textContent = "Erro inesperado";
    document.getElementById('empresaCNPJ').textContent = "Erro inesperado";
    document.getElementById('enderecoEmpresa').textContent = "Erro inesperado";
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