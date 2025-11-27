// =============================
//   CONFIGURAÇÃO DO SUPABASE
// =============================
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYWtibmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


// ===================================================
//  MAPA REAL DO MENU → ID DAS SEÇÕES
// ===================================================
const MENU_MAP = {
  "dashboard": "dashboard",
  "produtos": "produtos",
  "pedidos": "pedidos",
  "clientes": "clientes",
  "funcionários": "funcionarios",
  "funcionarios": "funcionarios"
};


// ===================================================
//  VERIFICAR LOGIN E CARREGAR USUÁRIO
// ===================================================
document.addEventListener("DOMContentLoaded", async () => {

  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuarioLogado) {
    window.location.href = "login.html";
    return;
  }

  const { data: usuario, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("username", usuarioLogado.username)
    .single();

  if (!usuario || error) {
    alert("Erro ao carregar usuário!");
    console.error("ERRO SUPABASE:", error);
    return;
  }

  aplicarPermissoes(usuario);
  ativarMenuMobile(); // inicializa função de abrir/fechar menu mobile
});


// ===============================
//   APLICAR PERMISSÕES
// ===============================
function aplicarPermissoes(usuario) {

  const permissoes = usuario.permissoes || [];

  // Mostra nome no canto superior
  const userSpan = document.querySelector("header span");
  userSpan.textContent = usuario.username;

  // Oculta todas as seções
  document.querySelectorAll(".content-section").forEach(sec => {
    sec.style.display = "none";
  });

  // ============================
  //       ACESSO TOTAL
  // ============================
  if (permissoes.includes("acesso_total")) {

    document.querySelectorAll(".content-section").forEach(sec => {
      sec.style.display = "block";
    });

    const permCells = document.querySelectorAll("td:nth-child(4)");
    permCells.forEach(c => c.textContent = "Acesso total do painel");

    ativarMenu();
    abrirDashboard(); // abre o Dashboard por padrão
    return;
  }

  // Apenas seções permitidas
  mostrarSecaoPermitida(permissoes);
  filtrarMenu(permissoes);
  ativarMenu();
  abrirDashboard(); // abre o Dashboard por padrão
}


// ======================
// ABRIR DASHBOARD POR PADRÃO
// ======================
function abrirDashboard() {
  const sections = document.querySelectorAll(".content-section");
  sections.forEach(sec => sec.style.display = "none");

  const dashboard = document.getElementById("dashboard");
  if (dashboard) dashboard.style.display = "block";

  // Destacar menu ativo
  document.querySelectorAll("aside nav label").forEach(label => label.classList.remove("active"));
  const dashLabel = Array.from(document.querySelectorAll("aside nav label"))
    .find(l => l.dataset.menu === "dashboard");
  if (dashLabel) dashLabel.classList.add("active");
}


// ======================
// MOSTRAR SEÇÕES PERMITIDAS
// ======================
function mostrarSecaoPermitida(permissoes) {
  permissoes.forEach(p => {
    const sec = document.getElementById(p);
    if (sec) sec.style.display = "block";
  });
}


// ======================
//  FILTRAR MENU
// ======================
function filtrarMenu(permissoes) {
  document.querySelectorAll("aside nav label").forEach(label => {
    const textoMenu = label.textContent.trim().toLowerCase();
    const secaoID = MENU_MAP[textoMenu];
    if (!secaoID || !permissoes.includes(secaoID)) {
      label.style.display = "none";
    }
  });
}


// ======================
//   TROCAR SEÇÕES
// ======================
function ativarMenu() {
  const labels = document.querySelectorAll("aside nav label");
  const sections = document.querySelectorAll(".content-section");

  labels.forEach(label => {
    label.addEventListener("click", () => {
      const textoMenu = label.textContent.trim().toLowerCase();
      const secaoID = MENU_MAP[textoMenu];
      if (!secaoID) return;

      sections.forEach(sec => sec.style.display = "none");
      const target = document.getElementById(secaoID);
      if (target) target.style.display = "block";

      // Atualiza menu ativo
      labels.forEach(l => l.classList.remove("active"));
      label.classList.add("active");

      // Fecha menu no mobile após clicar
      const aside = document.querySelector("aside");
      if (window.innerWidth <= 768) {
        aside.classList.remove("open");
      }
    });
  });
}


// ======================
// ATIVAR MENU MOBILE (ABRIR/FECHAR)
// ======================
function ativarMenuMobile() {
  const toggleBtn = document.querySelector('.menu-toggle');
  const aside = document.querySelector('aside');

  toggleBtn.addEventListener('click', () => {
    aside.classList.toggle('open');
  });
}


// ======================
//         LOGOUT
// ======================
document.getElementById("btn-logout").addEventListener("click", () => {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
});
