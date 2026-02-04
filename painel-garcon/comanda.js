import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYWtibmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

//informaçao da empresa


async function carregarInfoEmpresa() {
  // Pegando elementos do HTML
  const logo = document.getElementById("logoEmpresa");
  const nome = document.getElementById("nomeEmpresa");
  const endereco = document.getElementById("enderecoEmpresa");
  const telefone = document.getElementById("telefoneEmpresa");

  try {
    const { data, error } = await supabase
      .from("empresa")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      console.warn("Não foi possível carregar dados da empresa:", error);
      return; // mantém os valores padrão do HTML
    }

    // Se houver dados, substitui os padrões
    if (data) {
      if (data.logotipo) logo.src = data.logotipo;
      if (data.nome) nome.textContent = data.nome;
      if (data.endereco) endereco.textContent = data.endereco;
      if (data.telefone) telefone.textContent = data.telefone;
    }

  } catch (err) {
    console.error("Erro ao buscar dados da empresa:", err);
  }
}

// Função para mostrar a data de emissão automaticamente
function atualizarDataEmissao() {
  const dataElem = document.getElementById("dataEmissao");
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const ano = hoje.getFullYear();
  dataElem.textContent = `Emissão: ${dia}/${mes}/${ano}`;
}

// Carrega empresa e data quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  carregarInfoEmpresa();
  atualizarDataEmissao();
});

// Formata valor em R$
function moeda(valor){
  return Number(valor || 0).toLocaleString("pt-BR",{
    style:"currency",
    currency:"BRL"
  });
}

// Carrega produtos do Supabase e renderiza na comanda
async function carregarProdutos(){
  const blocos = document.getElementById("blocosProdutos");
  blocos.innerHTML = "Carregando produtos...";

  const { data, error } = await supabase
    .from("produtos")
    .select("id, descricao, valor_sugerido, categoria, situacao")
    .eq("situacao","ativo")
    .order("categoria",{ ascending:true })
    .order("descricao",{ ascending:true });

  if(error){
    console.error("Erro Supabase:", error);
    blocos.innerHTML = "Erro ao carregar produtos";
    return;
  }

  if(!data || data.length === 0){
    blocos.innerHTML = "Nenhum produto cadastrado.";
    return;
  }

  // Agrupar produtos por categoria
  const categorias = {};
  data.forEach(prod => {
    const cat = prod.categoria ? prod.categoria.trim() : "OUTROS";
    if(!categorias[cat]) categorias[cat] = [];
    categorias[cat].push(prod);
  });

  blocos.innerHTML = "";

  Object.keys(categorias).forEach(cat => {
    const bloco = document.createElement("div");
    bloco.className = "bloco";

    // Título da categoria
    const titulo = document.createElement("div");
    titulo.className = "bloco-titulo";
    titulo.textContent = cat;
    bloco.appendChild(titulo);

    // Lista vertical de produtos
    const lista = document.createElement("div");
    lista.className = "listaProdutos";
    lista.style.display = "flex";
    lista.style.flexDirection = "column";
    lista.style.gap = "4px";

    categorias[cat].forEach(prod => {
      const item = document.createElement("div");
      item.className = "item";

      // REMOVIDO <span> do valor, agora só aparece o nome
      item.innerHTML = `
        <label>
          <input type="checkbox" class="produtoCheck"
            data-id="${prod.id}"
            data-nome="${prod.descricao}"
            data-valor="${prod.valor_sugerido || 0}">
          ${prod.descricao}
        </label>
      `;
      lista.appendChild(item);
    });

    bloco.appendChild(lista);
    blocos.appendChild(bloco);
  });

  ativarCalculoTotal();
}

// Ativa o cálculo de total quando o usuário marca/desmarca produtos
function ativarCalculoTotal(){
  const checkboxes = document.querySelectorAll(".produtoCheck");
  checkboxes.forEach(chk => {
    chk.addEventListener("change", calcularTotal);
  });
}

// Calcula o total e atualiza a comanda
function calcularTotal(){
  let total = 0;
  document.querySelectorAll(".produtoCheck:checked").forEach(chk => {
    total += Number(chk.dataset.valor);
  });
  document.getElementById("total").innerText = "TOTAL: " + moeda(total);
}

// Inicializa a comanda ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  carregarProdutos();
});
