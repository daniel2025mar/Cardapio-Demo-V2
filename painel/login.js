// =============================
//   CONFIGURAÇÃO DO SUPABASE
// =============================
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYWtibmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================
//      LOGIN DO USUÁRIO
// =============================
document.addEventListener("DOMContentLoaded", () => {

  // Evitar scroll na tela de login
  document.body.style.overflow = "hidden";

  const form = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const errorMsg = document.getElementById("login-error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // 1️⃣ BUSCAR O USUÁRIO NA TABELA "usuarios"
    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("username", username)
      .single();

    if (!usuario || error) {
      return mostrarErro();
    }

    // 2️⃣ VALIDAR SENHA
    if (usuario.password !== password) {
      return mostrarErro();
    }

    // 3️⃣ SALVAR SESSÃO LOCAL (SEM SUPABASE AUTH)
    localStorage.setItem("usuarioLogado", JSON.stringify(usuario));

    // 4️⃣ LOGIN OK — Mostrar boas-vindas e redirecionar
    mostrarBoasVindas(usuario.username);
  });

  // 🔴 Função de erro personalizada
  function mostrarErro() {
    errorMsg.classList.remove("hidden");
    errorMsg.textContent = "Usuário ou senha incorretos!";
    usernameInput.value = "";
    passwordInput.value = "";
    usernameInput.focus();

    setTimeout(() => {
      errorMsg.classList.add("hidden");
    }, 3000);
  }

  // 🔵 Função de boas-vindas
  function mostrarBoasVindas(nomeUsuario) {
    // Cria elemento temporário para mensagem
    const mensagem = document.createElement("div");
    mensagem.textContent = `Bem-vindo(a), ${nomeUsuario}!`;
    mensagem.className = "fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded shadow z-50";
    document.body.appendChild(mensagem);

    // Remove a mensagem depois de 3 segundos e redireciona
    setTimeout(() => {
      mensagem.remove();
      window.location.href = "admin.html";
    }, 3000);
  }
});
