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


 //🎄 TEMA AUTOMÁTICO (INALTERADO)
(function aplicarTemaPorDataAuto() {

      const inicio = new Date(2025, 11, 23, 22, 33);
      const fim    = new Date(2025, 11, 28, 20, 0);

      const avisoNatal = document.getElementById("aviso-natal");

      function verificarTema() {
        const agora = new Date();

        if (agora >= inicio && agora < fim) {
          document.body.classList.add("tema-natal");
          avisoNatal?.classList.remove("hidden");
        } else {
          document.body.classList.remove("tema-natal");
          avisoNatal?.classList.add("hidden");
        }
      }

      verificarTema();
      setInterval(verificarTema, 1000);

    })();