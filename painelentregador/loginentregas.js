// =============================
// CONFIGURAÇÃO DO SUPABASE
// =============================
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYWtibmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================
// ELEMENTOS
// =============================
const form = document.getElementById("login-form");
const errorEl = document.getElementById("login-error");
const toggle = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");
const usernameInput = document.getElementById("username");

// =============================
// MOSTRAR / OCULTAR SENHA
// =============================
let senhaVisivel = false;

toggle.addEventListener("click", () => {
  senhaVisivel = !senhaVisivel;
  passwordInput.type = senhaVisivel ? "text" : "password";
});

// =============================
// LOGIN
// =============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  errorEl.classList.add("hidden");
  errorEl.textContent = "";

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    mostrarErro("Informe usuário e senha.");
    return;
  }

  try {
    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    // ❌ NÃO ENCONTROU
    if (error || !usuario) {
      mostrarErro("Usuário ou senha incorretos.");
      return;
    }

    // ❌ USUÁRIO INATIVO
    if (usuario.ativo === false) {
      mostrarErro("Acesso bloqueado. Contate o administrador.");
      return;
    }

    // ❌ NÃO É ENTREGADOR
    if (usuario.cargo !== "Entregador") {
      mostrarErro("Você não tem permissão para acessar este sistema.");
      return;
    }

    // ✅ LOGIN CORRETO
    localStorage.setItem("entregadorLogado", JSON.stringify(usuario));
    window.location.href = "delivery.html";

  } catch (err) {
    console.error(err);
    mostrarErro("Erro ao tentar fazer login.");
  }
});


// =============================
// FUNÇÃO DE ERRO COM TEMPO
// =============================
function mostrarErro(mensagem) {
  errorEl.textContent = mensagem;
  errorEl.classList.remove("hidden");
  errorEl.style.color = "white";

  // Após 3 segundos, esconde a mensagem e limpa campos
  setTimeout(() => {
    errorEl.classList.add("hidden");
    errorEl.textContent = "";
    usernameInput.value = "";
    passwordInput.value = "";
  }, 3000);
}

// =============================
// TEMA NATAL AUTOMÁTICO
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const inicioNatal = new Date(2025, 11, 23, 0, 0, 0);
  const fimNatal = new Date(2025, 11, 26, 23, 5, 0);
  const agora = new Date();

  if (agora >= inicioNatal && agora <= fimNatal) {
    document.body.classList.add("tema-natal");

    document.querySelectorAll(".bg-gradient-to-br").forEach(card => {
      card.style.backgroundImage =
        "linear-gradient(135deg, #b91c1c, #dc2626, #b91c1c)";
    });

    document.querySelectorAll(".btn-gradient").forEach(btn => {
      btn.style.backgroundImage =
        "linear-gradient(135deg, #b91c1c, #dc2626, #b91c1c)";
    });

    const modalNatal = document.getElementById("modal-natal");
    const btnFechar = document.getElementById("fechar-natal");

    if (modalNatal) modalNatal.classList.remove("hidden");

    if (btnFechar) {
      btnFechar.addEventListener("click", () => {
        modalNatal.classList.add("hidden");
      });
    }
  }
});
