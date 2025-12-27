// =============================
//   CONFIGURAÇÃO DO SUPABASE
// =============================
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYWtibmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================
//       VARIÁVEIS
// =============================
let tentativas = 0;
const MAX_TENTATIVAS = 4;
const TEMPO_BLOQUEIO = 5 * 60 * 1000; // 5 minutos

// =============================
//        LOGIN DO USUÁRIO
// =============================
document.addEventListener("DOMContentLoaded", () => {
  document.body.style.overflow = "hidden";

  const form = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const errorMsg = document.getElementById("login-error");

  verificarBloqueio();

  // Bloqueia números no usuário
  usernameInput.addEventListener("input", () => {
    usernameInput.value = usernameInput.value.replace(/[^a-zA-Z]/g, "");
  });

  usernameInput.addEventListener("paste", (e) => e.preventDefault());

  // Verificar internet
  async function temConexao() {
    if (!navigator.onLine) return false;
    try {
      await fetch("https://www.google.com/favicon.ico", { method: "GET", mode: "no-cors" });
      return true;
    } catch {
      return false;
    }
  }

  // =============================
  //       EVENTO DE LOGIN
  // =============================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (estaBloqueado()) return;

    const online = await temConexao();
    if (!online) return mostrarErro("Sem conexão com a internet!");

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (username === "" && password === "") return mostrarErro("Preencha todos os campos!");
    if (username === "") return mostrarErro("Preencha o usuário!");
    if (password === "") return mostrarErro("Preencha a senha!");

    // Buscar no Supabase
    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("username", username)
      .single();

    // Verifica usuário e senha
    if (!usuario || error || usuario.password !== password) {
      tentativas++;

      const restantes = MAX_TENTATIVAS - tentativas;

      if (tentativas >= MAX_TENTATIVAS) {
        return ativarBloqueio();
      }

      return mostrarErro(`Usuário ou senha incorretos! Tentativas restantes: ${restantes}`);
    }

    // Verifica se o usuário está bloqueado na tabela (ativo = false)
    if (usuario.ativo === false) {
      return mostrarErro("Acesso ao sistema bloqueado. Contate o suporte.");
    }

    // ================================
    // BLOQUEIO POR CARGO (ENTREGADOR)
    // ================================
    if (usuario.cargo === "Entregador") {
      return mostrarErro(
        "Acesso negado. Usuário não podem acessar este painel."
      );
    }

    tentativas = 0;
    localStorage.removeItem("loginBloqueado");

    localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
    mostrarBoasVindas(usuario.username);
  });

  // =============================
  //     FUNÇÃO DE EXIBIR ERRO
  // =============================
  function mostrarErro(msg) {
    errorMsg.classList.remove("hidden");
    errorMsg.textContent = msg;

    errorMsg.style.color = "#ffffff";

    usernameInput.value = "";
    passwordInput.value = "";
    usernameInput.focus();

    setTimeout(() => errorMsg.classList.add("hidden"), 3500);
  }

  // =============================
  //      BLOQUEIO DO LOGIN
  // =============================
  function ativarBloqueio() {
    const tempoFinal = Date.now() + TEMPO_BLOQUEIO;
    localStorage.setItem("loginBloqueado", tempoFinal);

    exibirBloqueio();
  }

  function estaBloqueado() {
    const bloqueio = localStorage.getItem("loginBloqueado");
    if (!bloqueio) return false;

    if (Date.now() > Number(bloqueio)) {
      localStorage.removeItem("loginBloqueado");
      return false;
    }
    return true;
  }

  function verificarBloqueio() {
    if (estaBloqueado()) exibirBloqueio();
  }

  function exibirBloqueio() {
    const alerta = document.createElement("div");
    alerta.textContent = "ACESSO NEGADO: Aguarde 5 minutos e tente novamente";

    alerta.className =
      "fixed top-5 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-50 font-semibold text-center";

    alerta.style.whiteSpace = "nowrap";
    alerta.style.overflow = "hidden";
    alerta.style.maxWidth = "95vw";
    alerta.style.fontSize = "clamp(14px, 2vw, 18px)";

    if (window.innerWidth <= 400) {
      alerta.style.whiteSpace = "normal";
      alerta.style.wordBreak = "break-word";
    }

    document.body.appendChild(alerta);

    usernameInput.disabled = true;
    passwordInput.disabled = true;

    setTimeout(() => {
      alerta.remove();
    }, 5000);

    const tempoRestante = Number(localStorage.getItem("loginBloqueado")) - Date.now();

    setTimeout(() => {
      usernameInput.disabled = false;
      passwordInput.disabled = false;
      tentativas = 0;
    }, tempoRestante);
  }

  // =============================
  //     MENSAGEM DE BOAS-VINDAS
  // =============================
  function mostrarBoasVindas(nomeUsuario) {
    const mensagem = document.createElement("div");
    mensagem.textContent = `Bem-vindo(a), ${nomeUsuario}!`;
    mensagem.className =
      "fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded shadow z-50";
    document.body.appendChild(mensagem);

    setTimeout(() => {
      mensagem.remove();
      window.location.href = "admin.html";
    }, 3000);
  }
});

// função de datas comemorativas
(function aplicarTemaPorDataAuto() {
  // Avisos no HTML
  const avisoNatal = document.getElementById("aviso-natal");
  const avisoAnoNovo = document.getElementById("aviso-ano-novo");
  const avisoDiaDeReis = document.getElementById("aviso-dia-de-reis");
  const avisoDiaDasMaes = document.getElementById("aviso-dia-das-maes");
  const avisoDiaDosPais = document.getElementById("aviso-dia-dos-pais");

  // Datas comemorativas
  // Natal
  const inicioNatal = new Date(2025, 11, 23, 22, 33);
  const fimNatal    = new Date(2025, 11, 26, 23, 5);

  // Ano Novo
  const inicioAnoNovo = new Date(2025, 11, 31, 0, 0); 
  const fimAnoNovo    = new Date(2026, 0, 2, 23, 59);

  // Dia de Reis
  const inicioDiaDeReis = new Date(2026, 0, 6, 0, 0); 
  const fimDiaDeReis    = new Date(2026, 0, 6, 23, 59);

  // Dia das Mães
  const inicioDiaDasMaes = new Date(2026, 4, 10, 0, 0); // 10 Maio 2026
  const fimDiaDasMaes    = new Date(2026, 4, 10, 23, 59);

  // Dia dos Pais
  const inicioDiaDosPais = new Date(2026, 7, 9, 0, 0); // 9 Agosto 2026
  const fimDiaDosPais    = new Date(2026, 7, 9, 23, 59);

  // Elemento para contagem regressiva do Ano Novo
  const contagemEl = document.getElementById("contagem-ano-novo");

  function verificarTema() {
    const agora = new Date();

    // Remove todos os temas inicialmente
    document.body.classList.remove("tema-natal", "tema-ano-novo", "tema-dia-de-reis", "tema-dia-das-maes", "tema-dia-dos-pais");
    avisoNatal?.classList.add("hidden");
    avisoAnoNovo?.classList.add("hidden");
    avisoDiaDeReis?.classList.add("hidden");
    avisoDiaDasMaes?.classList.add("hidden");
    avisoDiaDosPais?.classList.add("hidden");

    // Aplicar Natal
    if (typeof inicioNatal !== "undefined" && agora >= inicioNatal && agora < fimNatal) {
      document.body.classList.add("tema-natal");
      avisoNatal?.classList.remove("hidden");
    }

    // Aplicar Ano Novo
    if (agora >= inicioAnoNovo && agora <= fimAnoNovo) {
      document.body.classList.add("tema-ano-novo");
      avisoAnoNovo?.classList.remove("hidden");

      // Atualizar contagem regressiva
      const anoNovo = new Date(2026, 0, 1, 0, 0, 0);
      const diff = anoNovo - agora;

      if (diff <= 0) {
        contagemEl.textContent = "Feliz Ano Novo! 🎉";
      } else {
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutos = Math.floor((diff / (1000 * 60)) % 60);
        const segundos = Math.floor((diff / 1000) % 60);
        contagemEl.textContent = `${dias}d ${horas}h ${minutos}m ${segundos}s`;
      }
    }

    // Aplicar Dia de Reis
    if (agora >= inicioDiaDeReis && agora <= fimDiaDeReis) {
      document.body.classList.add("tema-dia-de-reis");
      avisoDiaDeReis?.classList.remove("hidden");
    }

    // Aplicar Dia das Mães
    if (agora >= inicioDiaDasMaes && agora <= fimDiaDasMaes) {
      document.body.classList.add("tema-dia-das-maes");
      avisoDiaDasMaes?.classList.remove("hidden");
    }

    // Aplicar Dia dos Pais
    if (agora >= inicioDiaDosPais && agora <= fimDiaDosPais) {
      document.body.classList.add("tema-dia-dos-pais");
      avisoDiaDosPais?.classList.remove("hidden");
    }
  }

  verificarTema();
  setInterval(verificarTema, 1000);
})();
