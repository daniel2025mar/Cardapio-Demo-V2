// =============================
//   CONFIGURAÇÃO DO SUPABASE
// =============================
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYWtibmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================
//        LOGIN DO USUÁRIO
// =============================
document.addEventListener("DOMContentLoaded", () => {

  document.body.style.overflow = "hidden";

  const form = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const errorMsg = document.getElementById("login-error");

  // 🔒 Bloquear números e caracteres especiais no usuário
  usernameInput.addEventListener("input", () => {
    usernameInput.value = usernameInput.value.replace(/[^a-zA-Z]/g, "");
  });

  usernameInput.addEventListener("paste", (e) => e.preventDefault());

  // ✔ Verificar internet
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
  //     EVENTO DE LOGIN
  // =============================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const online = await temConexao();
    if (!online) return mostrarErro("Sem conexão com a internet!");

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // 🔍 Validação dinâmica
    if (username === "" && password === "") {
      return mostrarErro("Preencha todos os campos!");
    }
    if (username === "") {
      return mostrarErro("Preencha o usuário!");
    }
    if (password === "") {
      return mostrarErro("Preencha a senha!");
    }

    // 🔎 Buscar no Supabase
    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("username", username)
      .single();

    if (!usuario || error) return mostrarErro("Usuário ou senha incorretos!");
    if (usuario.password !== password) return mostrarErro("Usuário ou senha incorretos!");

    localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
    mostrarBoasVindas(usuario.username);
  });

  // =============================
  //       FUNÇÃO DE ERRO
  // =============================
  function mostrarErro(msg) {
    errorMsg.classList.remove("hidden");
    errorMsg.textContent = msg;

    // Campo usuário vazio
    if (msg.includes("usuário")) {
      usernameInput.value = "";
      usernameInput.focus();
    }

    // Campo senha vazio
    if (msg.includes("senha")) {
      passwordInput.value = "";
      passwordInput.focus();
    }

    // Ambos vazios
    if (msg === "Preencha todos os campos!") {
      usernameInput.value = "";
      passwordInput.value = "";
      usernameInput.focus();
    }

    // Senha incorreta ou usuário incorreto
    if (msg === "Usuário ou senha incorretos!") {
      passwordInput.value = "";
      passwordInput.focus();
    }

    setTimeout(() => errorMsg.classList.add("hidden"), 3000);
  }

  // =============================
  //   MENSAGEM DE BOAS-VINDAS
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
