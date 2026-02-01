/* =============================
   CONFIGURAÇÃO DO SUPABASE
============================= */

import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYWtibmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E"; // sua key completa aqui

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


/* =============================
   LOGIN DO GARÇOM
============================= */

const form = document.getElementById("login-form");
const errorMsg = document.getElementById("login-error");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", () => {
  const password = document.getElementById("password");
  password.type = password.type === "password" ? "text" : "password";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    errorMsg.classList.remove("hidden");
    errorMsg.innerText = "Preencha todos os campos!";
    return;
  }

  // Consulta no Supabase
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .eq("cargo", "Garçom")
    .single();

  if (error || !data) {
    errorMsg.classList.remove("hidden");
    errorMsg.innerText = "Usuário ou senha inválidos!";
    return;
  }

  // ✅ Verifica se usuário está ativo
  if (!data.ativo) {
    errorMsg.classList.remove("hidden");
    errorMsg.innerText = "Acesso bloqueado!";
    return;
  }

  // Se chegou aqui, está correto
  localStorage.setItem("usuarioLogado", JSON.stringify(data));

  // Redireciona para a tela do garçom
  window.location.href = "garcon.html";
});

// Pegar elementos do HTML
const anoSpan = document.getElementById("anoAtual");
const nomeSpan = document.getElementById("nomeEmpresa");

// Atualiza o ano automaticamente
anoSpan.textContent = new Date().getFullYear();

// Função para buscar nome da empresa
async function carregarNomeEmpresa() {
  const { data, error } = await supabase
    .from("empresa")
    .select("nome")
    .limit(1)
    .single(); // pega apenas um registro

  if (error) {
    console.error("Erro ao buscar empresa:", error);
    nomeSpan.textContent = "Sua Empresa"; // fallback
    return;
  }

  nomeSpan.textContent = data.nome;
}

// Chama a função
carregarNomeEmpresa();
