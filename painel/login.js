// =============================
//   CONFIGURAÇÃO DO SUPABASE
// =============================
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================
//      LOGIN DO USUÁRIO
// =============================
document.addEventListener("DOMContentLoaded", () => {

  document.body.style.overflow = "hidden";

  const form = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  // Criar modal de erro
  const modal = document.createElement("div");
  modal.id = "modal-erro";
  modal.className = "fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 hidden";
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6 w-80 max-w-full text-center relative">
      <p id="modal-mensagem" class="text-gray-800 mb-4"></p>
      <button id="btn-fechar-modal" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">OK</button>
    </div>
  `;
  document.body.appendChild(modal);

  const modalMensagem = document.getElementById("modal-mensagem");
  const btnFecharModal = document.getElementById("btn-fechar-modal");

  btnFecharModal.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // 🔹 Verifica internet de forma confiável
  verificarInternetConfiavel();

  // 🔹 Detecta offline/online
  window.addEventListener("offline", () => {
    mostrarErro("Conexão perdida! Você precisa estar online para acessar o painel.");
  });
  window.addEventListener("online", () => {
    verificarInternetConfiavel(); // checa realmente se internet funciona
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const online = await checarConexaoReal();
    if (!online) {
      return mostrarErro("Você precisa estar conectado à internet para acessar o painel!");
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    try {
      const { data: usuario, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("username", username)
        .single();

      if (!usuario || error) {
        return mostrarErro();
      }

      if (usuario.password !== password) {
        return mostrarErro();
      }

      localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
      mostrarBoasVindas(usuario.username);

    } catch (err) {
      mostrarErro("Não foi possível conectar ao servidor. Verifique sua conexão com a internet!");
      console.error(err);
    }
  });

  // 🔴 Função para mostrar modal de erro
  function mostrarErro(msg) {
    modalMensagem.textContent = msg;
    modal.classList.remove("hidden");
    usernameInput.value = "";
    passwordInput.value = "";
    usernameInput.focus();
  }

  // 🔵 Função de boas-vindas
  function mostrarBoasVindas(nomeUsuario) {
    const mensagem = document.createElement("div");
    mensagem.textContent = `Bem-vindo(a), ${nomeUsuario}!`;
    mensagem.className = "fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded shadow z-50";
    document.body.appendChild(mensagem);

    setTimeout(() => {
      mensagem.remove();
      window.location.href = "admin.html";
    }, 3000);
  }

  // 🔹 Função para checar internet real (usando Supabase)
  async function checarConexaoReal(timeout = 3000) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?select=id&limit=1`, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY
        },
        signal: controller.signal
      });

      clearTimeout(id);
      return response.ok;
    } catch {
      return false;
    }
  }

  async function verificarInternetConfiavel() {
    const online = await checarConexaoReal();
    if (!online) {
      mostrarErro("Você não está conectado à internet. Por favor, verifique sua conexão!");
    }
  }

});
