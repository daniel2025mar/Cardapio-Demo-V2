// =============================
// CONFIGURAÇÃO DO SUPABASE
// =============================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYWtibmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================
// FUNÇÃO PARA CARREGAR LOGO
// =============================
async function carregarLogoEmpresa() {
  try {
    const { data: empresa, error } = await supabase
      .from("empresa")
      .select("logotipo")
      .eq("id", 1)
      .single();

    if (error) throw error;

    if (empresa && empresa.logotipo) {
      document.getElementById("logoEmpresa").src = empresa.logotipo;
    } else {
      // Se não tiver logo cadastrada, colocar uma padrão ou deixar vazio
      document.getElementById("logoEmpresa").src = "logo-padrao.png";
    }
  } catch (err) {
    console.error("Erro ao carregar logo da empresa:", err.message);
  }
}

// =============================
// ATIVAÇÃO DA MESA
// =============================
document.addEventListener("DOMContentLoaded", async () => {
  const titulo = document.querySelector("h1");
  const texto = document.querySelector("p");

  // Carrega logo da empresa primeiro
  await carregarLogoEmpresa();

  // Função para redirecionar para o cardápio
  const redirecionarParaCardapio = (numeroMesa) => {
    window.location.href = `https://cardapio-demo-v2.vercel.app/?mesa=${numeroMesa}`;
  };

  try {
    // 1️⃣ Ler número da mesa da URL
    const params = new URLSearchParams(window.location.search);
    const numeroMesa = params.get("mesa");

    if (!numeroMesa) {
      throw new Error("Número da mesa não informado.");
    }

    titulo.textContent = "Verificando mesa...";
    texto.textContent = "Aguarde um instante...";

    // 2️⃣ Buscar mesa no Supabase
    const { data: mesa, error } = await supabase
      .from("mesas")
      .select("*")
      .eq("numero", numeroMesa)
      .single();

    if (error || !mesa) {
      throw new Error("Mesa não encontrada.");
    }

    // 3️⃣ Verificar se mesa está ativa no sistema
    if (!mesa.ativo) {
      throw new Error("Esta mesa está desativada.");
    }

    // 4️⃣ Se mesa já estiver ocupada
    if (mesa.cliente_presente === true) {
      titulo.textContent = "Mesa já ativa";
      texto.textContent = "Esta mesa já está sendo utilizada. Redirecionando para o cardápio...";

      setTimeout(() => {
        redirecionarParaCardapio(numeroMesa);
      }, 1500);

      return; // ⛔ interrompe o fluxo
    }

    // 5️⃣ Atualizar mesa para cliente presente
    const { error: updateError } = await supabase
      .from("mesas")
      .update({ cliente_presente: true })
      .eq("id", mesa.id);

    if (updateError) {
      throw new Error("Erro ao ativar a mesa.");
    }

    // 6️⃣ Sucesso
    titulo.textContent = "Mesa ativada!";
    texto.textContent = "Redirecionando para o cardápio...";

    setTimeout(() => {
      redirecionarParaCardapio(numeroMesa);
    }, 1500);

  } catch (err) {
    console.error("Erro ao ativar mesa:", err);

    titulo.textContent = "Erro";
    texto.textContent = err.message || "Não foi possível ativar a mesa.";
  }
});
