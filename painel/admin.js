 
 // =============================
//   CONFIGURAÇÃO DO SUPABASE
// =============================
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYWtibmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);



  // Bloqueia Ctrl + + / Ctrl + - / Ctrl + 0
  window.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && 
        (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
      e.preventDefault();
    }
  });

  // Bloqueia zoom com scroll + Ctrl
  window.addEventListener('wheel', function(e) {
    if (e.ctrlKey) e.preventDefault();
  }, { passive: false });

document.addEventListener("DOMContentLoaded", async () => {

  const spanEmpresa = document.getElementById("nomeEmpresa");
  const modal = document.getElementById("modalEmpresa");
  const fechar = document.getElementById("fecharModal");
  const form = document.getElementById("formEmpresa");

  const inputNome = document.getElementById("inputNome");
  const inputEndereco = document.getElementById("inputEndereco");
  const inputTelefone = document.getElementById("inputTelefone");
  const inputWhatsApp = document.getElementById("inputWhatsApp");
  const inputCNPJ = document.getElementById("inputCNPJ");
  const inputCriadoEm = document.getElementById("inputCriadoEm");

  const inputFundo = document.getElementById("inputFundo");
  const previewFundo = document.getElementById("previewFundo");

  const inputLogo = document.getElementById("inputLogo");
  const previewLogo = document.getElementById("previewLogo");

  let novoFundo = null;
  let novoLogo = null;

  // garante estado inicial
  modal.classList.add("hidden");

  /* ================= MODAL AVISO ================= */
  const modalAviso = document.getElementById("modalAviso2");
  const modalAvisoTexto = document.getElementById("modalAvisoTexto");
  const btnFecharAviso = document.getElementById("btnFecharAviso");

  function mostrarModalAviso(mensagem) {
    modalAvisoTexto.textContent = mensagem;
    modalAviso.classList.remove("hidden");
  }

  btnFecharAviso.addEventListener("click", () => {
    modalAviso.classList.add("hidden");
  });

  modalAviso.addEventListener("click", (e) => {
    if (e.target === modalAviso) {
      modalAviso.classList.add("hidden");
    }
  });

  /* ================= EMPRESA ================= */
  async function carregarEmpresa() {
    const { data, error } = await supabase
      .from("empresa")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      console.error(error);
      spanEmpresa.textContent = "Erro ao carregar";
      return null;
    }
    return data;
  }

  function recuperarUsuarioLogado() {
    const usuarioJSON = localStorage.getItem("usuarioLogado");
    if (!usuarioJSON) return null;

    try {
      const usuario = JSON.parse(usuarioJSON);
      if (!Array.isArray(usuario.permissoes)) {
        usuario.permissoes = JSON.parse(usuario.permissoes || "[]");
      }
      return usuario;
    } catch {
      return null;
    }
  }

  const empresa = await carregarEmpresa();
  if (!empresa) return;

  spanEmpresa.textContent = empresa.nome;

  const usuario = recuperarUsuarioLogado();
  if (!usuario) return;

  const podeEditar = usuario.permissoes.includes("Acesso Total");

  /* ================= ABRIR MODAL ================= */
  spanEmpresa.addEventListener("click", () => {

    if (!podeEditar) {
      mostrarModalAviso("Você não tem permissão para editar informações da empresa!");
      return;
    }

    inputNome.value = empresa.nome || "";
    inputEndereco.value = empresa.endereco || "";
    inputTelefone.value = empresa.telefone || "";
    inputWhatsApp.value = empresa.whatsapp || "";
    inputCNPJ.value = empresa.cnpj || "";
    inputCriadoEm.value = empresa.criado_em
      ? new Date(empresa.criado_em).toLocaleString()
      : "";

    // Fundo
    if (empresa.fundo_cardapio) {
      previewFundo.src = empresa.fundo_cardapio;
      previewFundo.classList.remove("hidden");
      novoFundo = null;
    } else {
      previewFundo.src = "";
      previewFundo.classList.add("hidden");
    }

    // Logo
    if (empresa.logotipo) {
      previewLogo.src = empresa.logotipo;
      previewLogo.classList.remove("hidden");
      novoLogo = null;
    } else {
      previewLogo.src = "";
      previewLogo.classList.add("hidden");
    }

    modal.classList.remove("hidden");
  });

  /* ================= FECHAR MODAL ================= */
  fechar.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  /* ================= PREVIEW FUNDO ================= */
  previewFundo.addEventListener("click", () => inputFundo.click());
  inputFundo.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      previewFundo.src = event.target.result;
      previewFundo.classList.remove("hidden");
      novoFundo = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  /* ================= PREVIEW LOGO ================= */
  previewLogo.addEventListener("click", () => inputLogo.click());
  inputLogo.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      previewLogo.src = event.target.result;
      previewLogo.classList.remove("hidden");
      novoLogo = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  /* ================= SALVAR ================= */
  const btnSalvarEmpresa = document.getElementById("btnSalvarEmpresa");

btnSalvarEmpresa.addEventListener("click", async (e) => {
  e.preventDefault();
  e.stopPropagation(); // 🔥 AGORA SIM

  if (!podeEditar) {
    mostrarModalAviso("Você não tem permissão para salvar alterações!");
    return;
  }

  const updateData = {
    nome: inputNome.value,
    endereco: inputEndereco.value,
    telefone: inputTelefone.value,
    whatsapp: inputWhatsApp.value,
    cnpj: inputCNPJ.value,
  };

  if (novoFundo) updateData.fundo_cardapio = novoFundo;
  if (novoLogo) updateData.logotipo = novoLogo;

  const { data, error } = await supabase
    .from("empresa")
    .update(updateData)
    .eq("id", empresa.id)
    .single();

  if (error) {
    console.error(error);
    mostrarModalAviso("Erro ao salvar alterações!");
    return;
  }

  // ✅ ATUALIZA O NOME
  spanEmpresa.textContent = data.nome;

  // ✅ FECHA O MODAL
  modal.classList.add("hidden");
  modal.classList.remove("flex");

  // ✅ MOSTRA A MENSAGEM
  mostrarModalAviso("Alterações salvas com sucesso!");
});

});



let timerBloqueio = null;
let canalBloqueio = null;
let timerTemporario = null;

async function verificarBloqueioPainel(usuario) {
  const painel = document.getElementById("painel-bloqueado");
  const painelTemporario = document.getElementById("painel-temporario");
  const contadorEl = document.getElementById("contador-temporario");
  const barraEl = document.getElementById("barra-temporario");

  if (!painel || !painelTemporario || !contadorEl || !barraEl) {
    console.warn("⚠ Elementos de painel não encontrados no HTML");
    return;
  }

  function aplicarBloqueio(ativo, delay = 0) {
    clearTimeout(timerBloqueio);

    timerBloqueio = setTimeout(() => {
      // 🔥 BLOQUEADO
      if (ativo === false) {
        painel.classList.remove("hidden");
        painel.classList.add("flex");
        document.body.style.overflow = "hidden";
        console.log("⛔ Painel BLOQUEADO");

        fecharPainelTemporario();
        return;
      }

      // 🔥 LIBERADO
      painel.classList.add("hidden");
      painel.classList.remove("flex");
      document.body.style.overflow = "auto";
      console.log("✅ Painel LIBERADO");

      // Se o usuário estava bloqueado e agora desbloqueado
      if (usuario.ativo === false) {
        usuario.ativo = true;
        mostrarPainelTemporario(60); // 60 segundos
      }
    }, delay);
  }

  function mostrarPainelTemporario(duration = 60) {
    let segundos = duration;
    contadorEl.textContent = segundos;
    barraEl.style.width = "0%";

    painelTemporario.classList.remove("hidden");
    painelTemporario.classList.add("flex");
    document.body.style.overflow = "hidden";

    clearInterval(timerTemporario);
    timerTemporario = setInterval(() => {
      segundos--;
      contadorEl.textContent = segundos;

      let porcentagem = ((duration - segundos) / duration) * 100;
      barraEl.style.width = porcentagem + "%";

      if (segundos <= 0) {
        fecharPainelTemporario();
      }
    }, 1000);
  }

  function fecharPainelTemporario() {
    clearInterval(timerTemporario);
    painelTemporario.classList.add("hidden");
    painelTemporario.classList.remove("flex");
    document.body.style.overflow = "auto";
    barraEl.style.width = "0%";
  }

  // Rodar na primeira vez ao carregar o painel
  aplicarBloqueio(usuario.ativo);

  // Remove canal anterior
  if (canalBloqueio) {
    await supabase.removeChannel(canalBloqueio);
  }

  // Listener realtime
  canalBloqueio = supabase
    .channel(`usuario-bloqueio-${usuario.id}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "usuarios",
        filter: `id=eq.${usuario.id}`,
      },
      (payload) => {
        if (usuario.ativo === false && payload.new.ativo === true) {
          usuario.ativo = false;
          aplicarBloqueio(payload.new.ativo, 0);
        } else {
          usuario.ativo = payload.new.ativo;
          aplicarBloqueio(payload.new.ativo, 0);
        }
      }
    )
    .subscribe((status) => {
      console.log("📡 Listener realtime conectado:", status);
    });

  // Reconnect automático
  setInterval(async () => {
    if (!canalBloqueio || canalBloqueio.state !== "joined") {
      if (canalBloqueio) await supabase.removeChannel(canalBloqueio);
      canalBloqueio = supabase
        .channel(`usuario-bloqueio-${usuario.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "usuarios",
            filter: `id=eq.${usuario.id}`,
          },
          (payload) => {
            if (usuario.ativo === false && payload.new.ativo === true) {
              usuario.ativo = false;
              aplicarBloqueio(payload.new.ativo, 0);
            } else {
              usuario.ativo = payload.new.ativo;
              aplicarBloqueio(payload.new.ativo, 0);
            }
          }
        )
        .subscribe();
    }
  }, 5000);
}


// ===================================================
//  MAPA REAL DO MENU → ID DAS SEÇÕES
// ===================================================
const MENU_MAP = {
  dashboard: "dashboard",
  pedidos: "pedidos",
  clientes: "clientes",
  "funcionários": "funcionarios",
  funcionarios: "funcionarios",

  // SUBMENUS DE PRODUTOS
  "cadastro de produtos": "produtos",
  "lista de produtos": "lista-produtos"
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

  // ================================
  // MODAL DE ERRO AO CARREGAR USUÁRIO
  // ================================
  const modalErroUsuario = document.getElementById('modalErroUsuario');
  const textoModalErroUsuario = document.getElementById('modalMensagemErroUsuario');
  const btnFecharErroUsuario = document.getElementById('btnFecharErroUsuario');

  function mostrarModalErroUsuario(mensagem) {
    if (modalErroUsuario && textoModalErroUsuario) {
      textoModalErroUsuario.textContent = mensagem;
      modalErroUsuario.classList.remove('hidden');
    }
  }

  if (btnFecharErroUsuario && modalErroUsuario) {
    btnFecharErroUsuario.addEventListener('click', () => {
      modalErroUsuario.classList.add('hidden');
    });
  }

  // ================================
  // BUSCA USUÁRIO LOGADO
  // ================================
  const { data: usuario, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("username", usuarioLogado.username)
    .single();

  if (!usuario || error) {
    mostrarModalErroUsuario("Erro ao carregar usuário!");
    console.error("ERRO SUPABASE:", error);
    return;
  }

  
  // ================================
  // VERIFICAR SE USUÁRIO ESTÁ BLOQUEADO
  // ================================
  verificarBloqueioPainel(usuario); // <-- chamada aqui

  // ================================
  // SALVA PERMISSÕES DETALHADAS
  // ================================
  permissoesDetalhadas = usuario.permissoes_detalhadas || {};
  aplicarPermissoes(usuario);
  ativarMenuMobile();

  // ================================
  // ATUALIZA TOTAL DE PEDIDOS FINALIZADOS
  // ================================
  async function atualizarTotalFinalizados() {
    const { data: pedidosFinalizados, error } = await supabase
      .from("pedidos")
      .select("id")
      .eq("status", "Finalizado");

    if (error) {
      console.error("Erro ao contar pedidos finalizados:", error);
      return;
    }

    const contador = document.getElementById("total-finalizados");
    if (contador) contador.textContent = pedidosFinalizados?.length || 0;
  }

  
  // ================================
  // CARREGA FILA DE PEDIDOS (APENAS STATUS "RECEBIDO")
  // ================================
  async function carregarFilaPedidos() {
    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("status", "Recebido")
      .order("id", { ascending: true });

    if (error) {
      console.error("Erro ao carregar pedidos:", error);
      return;
    }

    const listaPedidos = document.querySelector(".fila-pedidos-list");
    if (!listaPedidos) return;
    listaPedidos.innerHTML = "";

    // Atualiza contador de pedidos recebidos
    const contador = document.getElementById("contador-pedidos");
    if (contador) contador.textContent = pedidos.length;

    pedidos.forEach(pedido => {
      const item = document.createElement("div");
      item.classList.add(
        "order-list-item",
        "bg-gray-50",
        "p-3",
        "rounded-lg",
        "border-l-4",
        "border-yellow-400",
        "cursor-pointer",
        "hover:bg-gray-100"
      );
      item.dataset.id = pedido.id;

      // Formata horário corretamente (HH:MM)
      let horario = "";
      if (pedido.horario_recebido) {
        try {
          const date = new Date(pedido.horario_recebido);
          if (!isNaN(date.getTime())) {
            const h = date.getHours().toString().padStart(2, "0");
            const m = date.getMinutes().toString().padStart(2, "0");
            horario = `${h}:${m}`;
          }
        } catch (e) {
          console.warn("Erro ao formatar horário:", e);
          horario = "";
        }
      }

      item.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
            <p class="font-semibold">#${pedido.id} — ${pedido.cliente}</p>
            <p class="text-sm text-gray-500">${pedido.endereco || "Endereço não informado"} • ${pedido.pagamento || "Pagar na entrega"}</p>
            <p class="text-xs text-gray-400 mt-1">${pedido.observacoes || ""}</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-500">${horario}</p>
          </div>
        </div>
      `;

      // Evento para abrir detalhes do pedido
      item.addEventListener("click", () => abrirDetalhesPedido(pedido.id));

      listaPedidos.appendChild(item);
    });
  }

  // ================================
  // FUNÇÃO PARA FINALIZAR PEDIDO
  // ================================
  const btnFinalizar = document.getElementById("btn-finalizar-pedido");

  if (btnFinalizar) {
    btnFinalizar.addEventListener("click", async () => {
      const numeroPedidoEl = document.getElementById("pedido-numero");
      if (!numeroPedidoEl) return;
      const numeroPedido = numeroPedidoEl.textContent;

      if (!numeroPedido || numeroPedido === "0000") {
        mostrarToast("Nenhum pedido selecionado.", "bg-red-600");
        return;
      }

      try {
        const { data: pedidoAtual, error } = await supabase
          .from("pedidos")
          .select("status")
          .eq("id", numeroPedido)
          .single();

        if (error || !pedidoAtual) {
          console.error("Erro ao buscar pedido:", error);
          mostrarToast("Erro ao verificar status do pedido.", "bg-red-600");
          return;
        }

        if (pedidoAtual.status === "Finalizado") {
          mostrarToast("Este pedido já está finalizado!", "bg-red-600");
          return;
        }

        const { error: updateError } = await supabase
          .from("pedidos")
          .update({ status: "Finalizado" })
          .eq("id", numeroPedido);

        if (updateError) {
          console.error("Erro ao finalizar pedido:", updateError);
          mostrarToast("Erro ao finalizar pedido.", "bg-red-600");
          return;
        }

        // Atualiza contador e recarrega fila
        await atualizarTotalFinalizados();
        await carregarFilaPedidos();

        // Limpa campos do card de pedido
        const camposCard = [
          "pedido-numero","pedido-hora","pedido-tipo","pedido-status","total-pedido",
          "cliente-nome","cliente-telefone","cliente-endereco","cliente-referencia","tipo-pagamento",
          "lista-itens","subtotal-pedido","pedido-observacoes","pedido-timeline"
        ];

        camposCard.forEach(id => {
          const el = document.getElementById(id);
          if (!el) return;
          if(el.tagName === "DIV" || el.tagName === "UL") el.innerHTML = "";
          else el.textContent = id.includes("total") || id.includes("subtotal") ? "R$ 0,00" : "";
        });

        mostrarToast("Pedido finalizado e removido da fila!", "bg-indigo-600");

      } catch (err) {
        console.error("Erro ao finalizar pedido:", err);
        mostrarToast("Erro ao finalizar pedido.", "bg-red-600");
      }
    });
  }

  // ================================
  // CHAMA FUNÇÕES INICIAIS
  // ================================
  await atualizarTotalFinalizados();
  await carregarFilaPedidos();

});



// ===============================
//   APLICAR PERMISSÕES
// ===============================
let permissoesDetalhadas = {};

function aplicarPermissoes(usuario) {

  const permissoes = usuario.permissoes || [];

  // ✅ Carrega permissões detalhadas vindas do banco
  window.permissoesDetalhadas = { ...(usuario.permissoes_detalhadas || {}) };

  const nomeUsuario = usuario.nome || usuario.username || "Usuário";

  // ===============================
  // ATUALIZA NOME DO USUÁRIO
  // ===============================
  const userSpanDesktop = document.getElementById("usuario-logado");
  if (userSpanDesktop) {
    userSpanDesktop.innerHTML = `
      Bem-vindo ao painel administrativo, ${nomeUsuario}.
      <strong style="color:#2563eb;">GestioMax</strong>
    `;
  }

  const userSpanMobile = document.getElementById("usuario-logado-mobile");
  if (userSpanMobile) {
    userSpanMobile.innerHTML = `
      <strong style="color:#2563eb;">GestioMax</strong>
      <span class="ml-1">· ${nomeUsuario}</span>
    `;
  }

  // ===============================
  // ESCONDE TUDO
  // ===============================
  document.querySelectorAll(".content-section").forEach(sec => {
    sec.style.display = "none";
  });

  document.querySelectorAll("aside nav label").forEach(label => {
    label.style.display = "none";
  });

  // ===============================
  // ACESSO TOTAL
  // ===============================
  if (permissoes.includes("Acesso Total")) {

    document.querySelectorAll(".content-section").forEach(sec => {
      sec.style.display = "block";
    });

    document.querySelectorAll("aside nav label").forEach(label => {
      label.style.display = "flex";
    });

    abrirDashboard();
    ativarMenu();
    ativarMenuConfiguracoes();

    return;
  }

  // ===============================
  // MAPA DE PERMISSÕES
  // ===============================
  const PERMISSAO_MAP = {
    acesso_dashboard: "dashboard",
    acesso_clientes: "clientes",
    acesso_pedidos: "pedidos",
    acesso_produtos: "produtos",
    acesso_funcionarios: "funcionarios",
    acesso_relatorios: "relatorios",
    acesso_configuracoes: "configuracoes",
    acesso_mesas: "mesas"
  };

  // ===============================
  // APLICA PERMISSÕES
  // ===============================
  permissoes.forEach(p => {

    const secaoID = PERMISSAO_MAP[p];
    if (!secaoID) return;

    // Libera seção principal
    const secao = document.getElementById(secaoID);
    if (secao) secao.style.display = "block";

    // Libera menu principal
    const menuItem = Array.from(
      document.querySelectorAll("aside nav label")
    ).find(label => label.dataset.menu === secaoID);

    if (menuItem) menuItem.style.display = "flex";

    // ===============================
    // ✅ REGRA ESPECÍFICA MESAS
    // ===============================
    if (secaoID === "mesas") {

      // Mostra submenu geral (se existir)
      const submenuMesas = document.getElementById("submenu-mesas");
      if (submenuMesas) submenuMesas.style.display = "block";

      // ✅ LIBERA SOMENTE LISTA DE MESAS
      document
        .querySelectorAll('[data-menu="lista-mesas"]')
        .forEach(sub => sub.style.display = "flex");
    }

  });

  // ===============================
  // MOSTRA PRIMEIRA SEÇÃO
  // ===============================
  const primeiraSecao = document.querySelector(
    ".content-section[style*='display: block']"
  );

  if (primeiraSecao) {
    document.querySelectorAll(".content-section").forEach(sec => {
      sec.style.display = "none";
    });

    primeiraSecao.style.display = "block";
  }

  ativarMenu();
  ativarMenuConfiguracoes();
}







// ======================
// ABRIR DASHBOARD POR PADRÃO
// ======================
function abrirDashboard() {
  document.querySelectorAll(".content-section").forEach(sec => sec.style.display = "none");
  const dashboard = document.getElementById("dashboard");
  if (dashboard) dashboard.style.display = "block";

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
//   TROCAR SEÇÕES + FECHAR MENU MOBILE
// ======================
function ativarMenu() {
  const labels = document.querySelectorAll("aside nav label");
  const sections = document.querySelectorAll(".content-section");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  labels.forEach(label => {
    label.addEventListener("click", () => {
  const textoMenu = label.textContent.trim().toLowerCase();

  // ⛔ Produtos agora é apenas menu pai (tem submenu)
  if (textoMenu === "produtos") return;

  const secaoID = MENU_MAP[textoMenu];
  if (!secaoID) return;

  // Esconde todas as seções
  sections.forEach(sec => sec.style.display = "none");

  // Mostra a seção correta
  const target = document.getElementById(secaoID);
  if (target) target.style.display = "block";

  // Controle de item ativo
  labels.forEach(l => l.classList.remove("active"));
  label.classList.add("active");

  // Fecha sidebar no mobile
  if (window.innerWidth <= 768) {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  }
});

  });
}

// ======================
// ATIVAR MENU MOBILE
// ======================
function ativarMenuMobile() {
  const btnMenu = document.getElementById("btn-menu");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  if (!btnMenu) return;

  btnMenu.addEventListener("click", () => {
    sidebar.classList.add("open");
    overlay.classList.add("show");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  });
}

// ======================
//         LOGOUT
// ======================
document.getElementById("btn-logout").addEventListener("click", () => {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
});

// =============================
//   CARREGAR PEDIDOS DO SUPABASE
// =============================
async function carregarPedidos() {
  const lista = document.querySelector(".orders-grid .col-span-1 .space-y-3");
  if (!lista) return;

  lista.innerHTML = "<p class='text-gray-400'>Carregando pedidos...</p>";

  const { data: pedidos, error } = await supabase
    .from("pedidos")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("Erro ao carregar pedidos:", error);
    lista.innerHTML = "<p class='text-red-500'>Erro ao carregar pedidos.</p>";
    return;
  }

  lista.innerHTML = "";
  pedidos.forEach(pedido => {
    // ⏰ Usar horario_recebido e pegar apenas HH:MM
    let horario = "—";
    if (pedido.horario_recebido) {
      const [hora, minuto] = pedido.horario_recebido.split(":");
      horario = `${hora}:${minuto}`;
    }

    const item = document.createElement("div");
    item.className = "order-list-item bg-white p-3 rounded-lg border border-gray-200 cursor-pointer";
    item.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <p class="font-semibold">#${pedido.id} — ${pedido.cliente}</p>
          <p class="text-sm text-gray-500">${pedido.endereco} • ${pedido.pagamento}</p>
          <p class="text-xs text-gray-400 mt-1">${pedido.observacoes || ''}</p>
        </div>
        <div class="text-right">
          <p class="font-semibold">R$ ${Number(pedido.total).toFixed(2)}</p>
          <p class="text-sm text-gray-500">${horario}</p>
        </div>
      </div>
    `;

    item.addEventListener("click", () => abrirDetalhesPedido(pedido.id));
    lista.appendChild(item);
  });
}

// =============================
//   ABRIR DETALHES DO PEDIDO
// =============================
async function abrirDetalhesPedido(idPedido) {
  console.log("Abrindo pedido", idPedido);

  const { data: pedido, error } = await supabase
    .from("pedidos")
    .select("*")
    .eq("id", idPedido)
    .single();

  if (error || !pedido) {
    console.error("Erro ao abrir pedido:", error);
    return;
  }

  // 🔍 DEBUG — ver o formato real dos itens
  console.log("ITENS NO BANCO (bruto):", pedido.itens);

  // ===========================================================
  //   CORREÇÃO DA LÓGICA — aceitar JSON string OU array/objeto
  // ===========================================================
  let itens = [];

  try {
    if (typeof pedido.itens === "string") {
      console.log("Itens vieram como STRING JSON 😎");
      itens = JSON.parse(pedido.itens);
    } else if (Array.isArray(pedido.itens)) {
      console.log("Itens vieram como ARRAY 😎");
      itens = pedido.itens;
    } else if (typeof pedido.itens === "object" && pedido.itens !== null) {
      console.log("Itens vieram como OBJETO ÚNICO 😮");
      itens = [pedido.itens];
    }
  } catch (e) {
    console.error("Erro ao interpretar itens:", e);
  }

  console.log("ITENS INTERPRETADOS (prontos para exibir):", itens);

  // ======================================
  //   MOSTRAR ITENS NO CARD
  // ======================================
  mostrarItensPedido(itens);

  // ======================================
  //   CAMPOS DO TOPO
  // ======================================
  document.getElementById("pedido-numero").textContent = pedido.id;

  // ⏰ MOSTRAR HORÁRIO CORRETO DO PEDIDO
  if (pedido.horario_recebido) {
    const [hora, minuto] = pedido.horario_recebido.split(":");
    document.getElementById("pedido-hora").textContent = `${hora}:${minuto}`;
  } else {
    document.getElementById("pedido-hora").textContent = "—";
  }

  document.getElementById("pedido-status").textContent =
    pedido.status || "Recebido";

  document.getElementById("total-pedido").textContent =
    `R$ ${Number(pedido.total).toFixed(2)}`;

  // ======================================
  //   DADOS DO CLIENTE
  // ======================================
  document.getElementById("cliente-nome").textContent = pedido.cliente || "—";
  document.getElementById("cliente-telefone").textContent = pedido.telefone || "—";
  document.getElementById("cliente-endereco").textContent = pedido.endereco || "—";
  document.getElementById("cliente-referencia").textContent = pedido.referencia || "—";
  document.getElementById("tipo-pagamento").textContent = pedido.pagamento || "—";

  // ======================================
  //   SUBTOTAL
  // ======================================
  document.getElementById("subtotal-pedido").textContent =
    `R$ ${Number(pedido.total).toFixed(2)}`;

  // ======================================
  //   OBS
  // ======================================
  document.getElementById("obs-pedido").textContent =
    pedido.observacoes || "Nenhuma observação.";
}


function mostrarItensPedido(itens) {
  const lista = document.getElementById("lista-itens");
  lista.innerHTML = ""; // LIMPAR

  itens.forEach(item => {
    const nome = item.name || item.nome || "Item";
    const qtd = item.quantity || item.qtd || 1;
    const preco = Number(item.price || item.preco || 0);

    const totalItem = item.total
      ? parseFloat(item.total)
      : preco * qtd;

    const li = document.createElement("li");
    li.classList.add(
      "flex", "justify-between", "items-start",
      "bg-gray-50", "p-3", "rounded-lg", "border"
    );

    li.innerHTML = `
      <div>
        <p class="font-medium text-gray-800">${nome}</p>
        <p class="text-xs text-gray-500">Quantidade: ${qtd}</p>
      </div>

      <span class="font-semibold text-gray-700">
        R$ ${totalItem.toFixed(2)}
      </span>
    `;

    lista.appendChild(li);
  });
}

// =============================
// LIMPA DETALHES DO PEDIDO
// =============================
function limparDetalhesPedido() {
  try {
    document.getElementById("pedido-numero").textContent = "0000";
    document.getElementById("pedido-numero").dataset.pedidoId = "";
    document.getElementById("pedido-hora").textContent = "--:--";
    document.getElementById("pedido-status").textContent = "—";
    document.getElementById("total-pedido").textContent = "R$ 0,00";

    document.getElementById("cliente-nome").textContent = "—";
    document.getElementById("cliente-telefone").textContent = "—";
    document.getElementById("cliente-endereco").textContent = "—";
    document.getElementById("cliente-referencia").textContent = "—";
    document.getElementById("tipo-pagamento").textContent = "—";

    document.getElementById("subtotal-pedido").textContent = "R$ 0,00";
    document.getElementById("pedido-observacoes").textContent = "Nenhuma observação.";

    document.getElementById("lista-itens").innerHTML = "";
    document.getElementById("pedido-timeline").innerHTML = "";

    console.log("✅ Detalhes do pedido limpos com sucesso.");
  } catch (err) {
    console.error("❌ Erro ao limpar detalhes do pedido:", err);
  }
}

// =============================
// MODAL DE ERRO
// =============================
function mostrarModalErro(mensagem) {
  try {
    const modal = document.getElementById("modal-erro");
    const mensagemEl = document.getElementById("modal-erro-mensagem");
    if (!modal || !mensagemEl) return;

    mensagemEl.textContent = mensagem;
    modal.classList.remove("hidden");

    const btnFechar = document.getElementById("modal-erro-fechar");
    if (btnFechar) {
      btnFechar.onclick = () => modal.classList.add("hidden");
    }

    console.warn("⚠️", mensagem);
  } catch (err) {
    console.error("❌ Erro ao mostrar modal de erro:", err);
  }
}

// =============================
// CONTADOR DE ENTREGAS
// =============================
async function carregarTotalEntrega() {
  const contador = document.getElementById("total-entrega");
  if (!contador) return;

  try {
    const { count, error } = await supabase
      .from("entregas")
      .select("*", { count: "exact", head: true })
      .ilike("status", "%aguardando%");

    if (error) throw error;

    contador.textContent = count ?? 0;
  } catch (err) {
    mostrarModalErro("Erro ao carregar total de entregas: " + err.message);
    contador.textContent = "0";
  }
}

let pedidoSelecionado = null;

// =============================
// LISTA DE PEDIDOS (NÃO BLOQUEIA POR CLIENTE)
// =============================
async function atualizarPedidos() {
  try {
    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("criado_em", { ascending: true });

    if (error) throw error;

    const { data: entregas } = await supabase
      .from("entregas")
      .select("numero_pedido");

    const pedidosEnviados = new Set(
      (entregas || []).map(e => String(e.numero_pedido))
    );

    const container = document.getElementById("lista-pedidos");
    if (!container) return;

    container.innerHTML = "";

    pedidos.forEach(pedido => {
      const card = document.createElement("div");
      card.className = "order-list-item border p-4 mb-2";
      card.style.borderLeft = "6px solid";

      const jaEnviado = pedidosEnviados.has(String(pedido.numero_pedido));

      card.style.borderLeftColor = jaEnviado ? "green" : "#facc15";

      card.innerHTML = `
        <p><strong>Pedido:</strong> ${pedido.numero_pedido}</p>
        <p><strong>Cliente:</strong> ${pedido.cliente}</p>
        <p><strong>Status:</strong> ${pedido.status}</p>
        ${jaEnviado ? `<p class="text-green-600 font-bold mt-2">Enviado para entrega ✅</p>` : ""}
      `;

      if (!jaEnviado) {
        card.style.cursor = "pointer";

        card.onclick = () => {
          // 🔐 ESTADO REAL DO PEDIDO (fonte da verdade)
          pedidoSelecionado = {
            id: pedido.id,
            numero_pedido: pedido.numero_pedido
          };

          // 🔹 Atualiza apenas a interface
          const pedidoNumeroEl = document.getElementById("pedido-numero");
          pedidoNumeroEl.textContent = pedido.numero_pedido;
          pedidoNumeroEl.dataset.pedidoId = pedido.id;

          document.getElementById("cliente-nome").textContent =
            pedido.cliente || "—";
          document.getElementById("cliente-endereco").textContent =
            pedido.endereco || "—";
          document.getElementById("pedido-status").textContent =
            pedido.status || "—";
        };
      } else {
        card.style.cursor = "not-allowed";
      }

      container.appendChild(card);
    });
  } catch (err) {
    mostrarModalErro("Erro ao atualizar pedidos: " + err.message);
  }
}

// =============================
// BOTÃO "EM ENTREGA" (REGRA CORRETA)
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const btnEntrega = document.getElementById("btn-em-entrega");
  const pedidoNumeroEl = document.getElementById("pedido-numero");

  if (!btnEntrega || !pedidoNumeroEl) return;

  atualizarPedidos();
  carregarTotalEntrega();

  btnEntrega.addEventListener("click", async () => {
    try {
      const idPedido = Number(pedidoNumeroEl.dataset.pedidoId);
      const numeroPedido = pedidoNumeroEl.textContent.trim();

    

console.error("Debug pedido selecionado:", {
    idPedido: idPedido,
    numeroPedido: numeroPedido,
    dataset: pedidoNumeroEl.dataset
});

if (!idPedido || numeroPedido === "0000") {
    mostrarModalErro("Nenhum pedido selecionado.");
    return;
}


      const { data: pedido, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("id", idPedido)
        .single();

      if (error || !pedido) {
        mostrarModalErro("Pedido não encontrado.");
        return;
      }

      const itens = Array.isArray(pedido.itens)
        ? pedido.itens
        : JSON.parse(pedido.itens || "[]");

      const payload = {
        numero_pedido: pedido.numero_pedido,
        status: "Aguardando",
        itens,
        nome_cliente: pedido.cliente,
        endereco: pedido.endereco,
        entregador_nome: null,
        horario_entrega: null,
        foto_entrega: null
      };

      const { error: insertError } = await supabase
        .from("entregas")
        .insert([payload]);

      if (insertError) {
        if (insertError.code === "23505") {
          mostrarModalErro(
            "Este pedido já consta como enviado para entrega e não pode ser processado novamente."
          );
        } else {
          mostrarModalErro("Erro ao enviar pedido para entrega: " + insertError.message);
        }
        limparDetalhesPedido();
        return;
      }

      console.log("✅ Pedido enviado para entrega:", numeroPedido);

      limparDetalhesPedido();
      await atualizarPedidos();
      carregarTotalEntrega();
    } catch (err) {
      mostrarModalErro("Erro inesperado: " + err.message);
    }
  });
});



let clienteIdParaExcluir = null;

async function excluirCliente(id) {
  if (!id) {
    console.error("ID inválido para exclusão");
    return;
  }

  try {
    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id);

    if (error) throw error;

    mostrarToast("Cliente excluído com sucesso!", "bg-green-600");
    carregarClientes();

  } catch (err) {
    console.error("Erro ao excluir cliente:", err);
    mostrarToast("Erro ao excluir cliente.", "bg-red-600");
  }
}

function abrirModalExcluirCliente(id, nome) {
  clienteIdParaExcluir = id; // 🔥 GUARDA O ID CORRETAMENTE

  const modal = document.getElementById("modalExcluirCliente");
  const mensagem = document.getElementById("mensagemExcluir");

  mensagem.textContent = `Deseja realmente excluir ${nome || "este cliente"}?`;

  modal.classList.remove("is-hidden");
}

document.addEventListener("click", async (e) => {

  // CANCELAR
  const btnCancelar = e.target.closest("#btnCancelarExcluir");
  if (btnCancelar) {
    document
      .getElementById("modalExcluirCliente")
      .classList.add("is-hidden");

    clienteIdParaExcluir = null;
    return;
  }

  // 🔥 CONFIRMAR EXCLUSÃO (AGORA FUNCIONA)
  const btnConfirmar = e.target.closest("#btnConfirmarExcluir");
  if (btnConfirmar) {

    if (!clienteIdParaExcluir) {
      console.error("ID do cliente não definido");
      return;
    }

    await excluirCliente(clienteIdParaExcluir);

    document
      .getElementById("modalExcluirCliente")
      .classList.add("is-hidden");

    clienteIdParaExcluir = null;
  }
});

// =============================
//   CACHE DE CLIENTES
// =============================
let clientesCache = [];

// 🔹 Mapa de siglas para UP
const mapaUP = {
  1: "MG", 2: "AC", 3: "AL", 4: "AP", 5: "AM", 6: "BA", 7: "CE",
  8: "DF", 9: "ES", 10: "GO", 11: "MA", 12: "MT", 13: "MS", 14: "PA",
  15: "PB", 16: "PR", 17: "PE", 18: "PI", 19: "RJ", 20: "RN", 21: "RS",
  22: "RO", 23: "RR", 24: "SC", 25: "SP", 26: "SE", 27: "TO",
  "1": "MG", "2": "AC", "3": "AL", "4": "AP", "5": "AM", "6": "BA", "7": "CE",
  "8": "DF", "9": "ES", "10": "GO", "11": "MA", "12": "MT", "13": "MS", "14": "PA",
  "15": "PB", "16": "PR", "17": "PE", "18": "PI", "19": "RJ", "20": "RN", "21": "RS",
  "22": "RO", "23": "RR", "24": "SC", "25": "SP", "26": "SE", "27": "TO"
};

// =============================
//   CARREGAR CLIENTES DO SUPABASE
// =============================
async function carregarClientes() {
  const lista = document.getElementById("lista-clientes");
  if (!lista) return;

  lista.innerHTML = `<tr><td colspan="6" class="text-gray-400 text-center py-4">Carregando clientes...</td></tr>`;

  try {
    const { data: clientes, error } = await supabase
      .from("clientes")
      .select("id, nome, telefone, cidade, up, bloqueado")
      .order("nome", { ascending: true });

    if (error) throw error;

    clientesCache = clientes || [];
    renderizarClientes(clientesCache);

  } catch (err) {
    console.error("Erro ao carregar clientes:", err);
    lista.innerHTML = `<tr><td colspan="6" class="text-red-500 text-center py-4">Erro ao carregar clientes.</td></tr>`;
  }
}

// =============================
//   FILTRAR CLIENTES
// =============================
function filtrarClientesSupabase(texto) {
  const termo = texto.toLowerCase().trim();

  if (!termo) {
    renderizarClientes(clientesCache);
    return;
  }

  const filtrados = clientesCache.filter(cliente =>
    (cliente.nome || "").toLowerCase().includes(termo) ||
    (cliente.telefone || "").toLowerCase().includes(termo) ||
    (cliente.cidade || "").toLowerCase().includes(termo) ||
    String(cliente.up || "").includes(termo)
  );

  renderizarClientes(filtrados);
}

// =============================
//   RENDERIZAR CLIENTES
// =============================
function renderizarClientes(clientes) {
  const lista = document.getElementById("lista-clientes");
  if (!lista) return;

  lista.innerHTML = "";

  if (!clientes || clientes.length === 0) {
    lista.innerHTML = `<tr><td colspan="6" class="text-gray-400 text-center py-4">Nenhum cliente encontrado.</td></tr>`;
    return;
  }

  const permissoesCliente = window.permissoesDetalhadas?.["acesso_clientes"];
  const isAcessoClienteExclusivo = permissoesCliente && Object.keys(window.permissoesDetalhadas).length === 1;

  clientes.forEach((cliente, index) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-50";
    if (cliente.bloqueado) tr.classList.add("bg-red-50");

    const upFormatado = mapaUP[cliente.up] || "—";

    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${index + 1}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        ${cliente.nome || "—"}
        ${cliente.bloqueado ? '<span class="ml-2 px-2 py-0.5 bg-red-200 text-red-800 text-xs rounded-full">Bloqueado</span>' : ''}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${cliente.telefone || "—"}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${cliente.cidade || "—"}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${upFormatado}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center space-x-2">
        <button class="btn-editar px-2 py-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded text-xs font-semibold">Editar</button>
        <button class="btn-excluir px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold">Excluir</button>
        <button class="btn-bloquear px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-semibold">
          ${cliente.bloqueado ? "Desbloquear" : "Bloquear"}
        </button>
      </td>
    `;

    const btnEditar = tr.querySelector(".btn-editar");
    const btnExcluir = tr.querySelector(".btn-excluir");
    const btnBloquear = tr.querySelector(".btn-bloquear");

    btnEditar.addEventListener("click", () => {
      if (!isAcessoClienteExclusivo || permissoesCliente.editar) {
        editarCliente(cliente.id);
      } else {
        mostrarToast("Você não tem permissão para editar.", "bg-red-600");
      }
    });

    btnExcluir.addEventListener("click", (e) => {
      if (isAcessoClienteExclusivo) {
        e.preventDefault();
        const modalMensagem = document.getElementById("modalMensagemPermissao");
        modalMensagem.textContent = "Você não tem permissão para excluir.";
        const modalPermissao = document.getElementById("modalPermissao");
        modalPermissao.classList.remove("hidden");
        document.getElementById("btnFecharModalPermissao").onclick = () => {
          modalPermissao.classList.add("hidden");
        };
      } else {
        abrirModalExcluirCliente(cliente.id, cliente.nome);
      }
    });

    btnBloquear.addEventListener("click", (e) => {
      if (isAcessoClienteExclusivo) {
        e.preventDefault();
        const modalMensagem = document.getElementById("modalMensagemPermissao");
        modalMensagem.textContent = "Ação não permitida. Seu perfil de usuário não possui autorização para realizar esta operação.";
        const modalPermissao = document.getElementById("modalPermissao");
        modalPermissao.classList.remove("hidden");
        document.getElementById("btnFecharModalPermissao").onclick = () => {
          modalPermissao.classList.add("hidden");
        };
      } else {
        bloquearCliente(cliente.id, cliente.bloqueado);
      }
    });

    lista.appendChild(tr);
  });
}

// =============================
//   EVENTOS
// =============================
document.addEventListener("DOMContentLoaded", () => {
  carregarClientes();

  const pesquisaInput = document.getElementById("pesquisaClientes");
  if (pesquisaInput) {
    pesquisaInput.addEventListener("input", (e) => {
      filtrarClientesSupabase(e.target.value);
    });
  }
});

// cadastro de clientes
document.addEventListener("DOMContentLoaded", () => {
  carregarClientes?.();

  const btnCadastrar = document.getElementById("btn-cadastrar-cliente");
  const modalCadastro = document.getElementById("modalCadastroCliente");
  const btnCancelar = document.getElementById("cancelar-cadastro");
  const btnFechar = document.getElementById("fechar-modal-cadastro");
  const inputNome = document.getElementById("cad-nome");
  const inputTelefone = document.getElementById("cad-telefone");
  const formCadastro = document.getElementById("form-cadastro-cliente");

  const inputFoto = document.getElementById("fotoCliente");
  const previewFoto = document.getElementById("previewFoto");

  const FOTO_PADRAO = "../dist/Imagem/fotopadrao.jpg";

  if (
    !btnCadastrar ||
    !modalCadastro ||
    !inputNome ||
    !inputTelefone ||
    !formCadastro ||
    !inputFoto ||
    !previewFoto
  ) return;

  /* =========================
     FOTO PADRÃO
  ========================== */
  previewFoto.src = FOTO_PADRAO;
  previewFoto.onerror = () => {
    previewFoto.onerror = null;
    previewFoto.src = FOTO_PADRAO;
  };

  /* =========================
     ABRIR MODAL
  ========================== */
  btnCadastrar.addEventListener("click", () => {
    modalCadastro.classList.remove("hidden", "modal-fechar");
    modalCadastro.classList.add("modal-animar");
    inputNome.focus();
  });

  /* =========================
     FECHAR MODAL
  ========================== */
  const fecharModal = () => {
    modalCadastro.classList.remove("modal-animar");
    modalCadastro.classList.add("modal-fechar");

    setTimeout(() => {
      modalCadastro.classList.add("hidden");
      modalCadastro.classList.remove("modal-fechar");
      formCadastro.reset();
      previewFoto.src = FOTO_PADRAO;
      inputFoto.value = "";
    }, 250);
  };

  btnCancelar.addEventListener("click", fecharModal);
  btnFechar.addEventListener("click", fecharModal);

  modalCadastro.addEventListener("click", (e) => {
    if (e.target === modalCadastro) fecharModal();
  });

  /* =========================
     VALIDAR NOME
  ========================== */
  inputNome.addEventListener("input", () => {
    inputNome.value = inputNome.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, "");
  });

  /* =========================
     TELEFONE BR
  ========================== */
  inputTelefone.addEventListener("input", (e) => {
    let numeros = e.target.value.replace(/\D/g, "").slice(0, 11);

    if (numeros.length <= 2) {
      e.target.value = numeros ? `(${numeros}` : "";
    } else if (numeros.length <= 6) {
      e.target.value = `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    } else if (numeros.length <= 10) {
      e.target.value = `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    } else {
      e.target.value = `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }
  });

  /* =========================
     FUNÇÃO: NOME COMPLETO
  ========================== */
  function nomeValido(nome) {
    nome = nome.trim();
    const partes = nome.split(/\s+/);

    if (partes.length < 2) return false;
    for (let parte of partes) {
      if (parte.length < 2) return false;
    }

    if (!/[aeiouáéíóúãõàèìòùâêîôû]/i.test(nome)) return false;
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(nome)) return false;

    return true;
  }

  /* =========================
     MODAL SUCESSO
  ========================== */
  function mostrarModalSucesso() {
    const modal = document.getElementById("modalSucessoCadastro");
    const btn = document.getElementById("btnFecharSucesso");

    modal.classList.remove("hidden");

    btn.onclick = () => {
      modal.classList.add("hidden");
      fecharModal();
      carregarClientes?.();
    };
  }

  /* =========================
     SUBMIT
  ========================== */
  formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = inputNome.value.trim();
    const telefone = inputTelefone.value.trim();

    if (!nome) {
      alert("Digite o nome do cliente.");
      return;
    }

    if (!nomeValido(nome)) {
      document.getElementById("mensagemAlerta").textContent =
        "Nome inválido! Digite o nome completo do cliente.";

      const modalAlerta = document.getElementById("modalAlerta");
      modalAlerta.classList.remove("hidden");

      document.getElementById("btnFecharAlerta").onclick = () => {
        modalAlerta.classList.add("hidden");
        inputNome.value = "";
        inputNome.focus();
      };
      return;
    }

    /* =====================================================
       🔍 VERIFICAR SE CLIENTE JÁ EXISTE (SUPABASE)
    ===================================================== */
    const { data: clienteExistente, error: erroConsulta } = await supabase
      .from("clientes")
      .select("id")
      .ilike("nome", nome)
      .maybeSingle();

    if (erroConsulta) {
      console.error("Erro ao verificar cliente:", erroConsulta);
      alert("Erro ao verificar cliente.");
      return;
    }

    if (clienteExistente) {
      document.getElementById("mensagemAlerta").textContent =
        "Este cliente já está cadastrado.";

      document.getElementById("modalAlerta").classList.remove("hidden");

      document.getElementById("btnFecharAlerta").onclick = () => {
        document.getElementById("modalAlerta").classList.add("hidden");
        inputNome.focus();
      };
      return;
    }

    /* =====================================================
       🚀 AQUI COMEÇA A FUNÇÃO QUE INSERE NA TABELA CLIENTES
    ===================================================== */
    const { error: erroInsert } = await supabase
      .from("clientes")
      .insert([
        {
          nome: nome,
          telefone: telefone
        }
      ]);

    if (erroInsert) {
      console.error("Erro ao cadastrar cliente:", erroInsert);
      alert("Erro ao cadastrar cliente.");
      return;
    }
    /* =====================================================
       ✅ FIM DA INSERÇÃO
    ===================================================== */

    mostrarModalSucesso();
  });
});

// fim do cadastro do ciente

// Função de modal moderno
function mostrarConfirmacao(novoStatus) {
  return new Promise((resolve) => {
    const modal = document.getElementById("modal-confirm");
    const textoModal = document.getElementById("modal-text");
    const btnOk = document.getElementById("modal-ok");
    const btnCancelar = document.getElementById("modal-cancel");

    textoModal.textContent = novoStatus
      ? "Deseja bloquear este cliente?"
      : "Deseja desbloquear este cliente?";

    modal.classList.remove("hidden");

    function limparEventos() {
      btnOk.removeEventListener("click", okHandler);
      btnCancelar.removeEventListener("click", cancelHandler);
    }

    function okHandler() {
      limparEventos();
      modal.classList.add("hidden");
      resolve(true);
    }

    function cancelHandler() {
      limparEventos();
      modal.classList.add("hidden");
      resolve(false);
    }

    btnOk.addEventListener("click", okHandler);
    btnCancelar.addEventListener("click", cancelHandler);
  });
}
// Função atualizada para bloquear/desbloquear cliente
async function bloquearCliente(idCliente, statusAtual) {
  const novoStatus = !statusAtual; // inverte status

  const confirmado = await mostrarConfirmacao(novoStatus);
  if (!confirmado) return;

  const { error } = await supabase
    .from("clientes")
    .update({ bloqueado: novoStatus })
    .eq("id", idCliente);

  if (error) {
    console.error("Erro ao atualizar bloqueio:", error);
    showToast("Erro ao atualizar o status do cliente.", "bg-red-600");
    return;
  }

  // Atualiza a lista de clientes instantaneamente
  carregarClientes();

  // Mensagem moderna de sucesso
  showToast(
    novoStatus
      ? "Cliente bloqueado com sucesso!"
      : "Cliente desbloqueado com sucesso!",
    "bg-green-600"
  );
}


  // =============================
  //     ABRIR MODAL EDITAR
  // =============================
  async function editarCliente(id) {
    console.log("Abrindo edição para cliente:", id);

    const { data: cliente, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !cliente) {
      console.error("Erro ao carregar cliente:", error);
      alert("Erro ao carregar dados do cliente.");
      return;
    }

    const inputId = document.getElementById("edit-id");
    const inputNome = document.getElementById("edit-nome");
    const inputTelefone = document.getElementById("edit-telefone");
    const selectUP = document.getElementById("edit-up");
    const selectCidade = document.getElementById("edit-cidade");
    const btnSalvar = document.getElementById("btn-salvar-edicao");

    inputId.value = cliente.id;
    inputNome.value = cliente.nome || "";
    inputTelefone.value = cliente.telefone || "";

    // Carregar estados (sua função existente)
    await carregarEstadosEditar();

    let estadoId = null;
    if (cliente.up && /^\d+$/.test(String(cliente.up))) {
      estadoId = Number(cliente.up);
    } else if (cliente.up && isNaN(cliente.up)) {
      estadoId = await buscarEstadoIdPorSigla(cliente.up);
    }

    if (estadoId) {
      selectUP.value = estadoId;
      await carregarCidadesPorEstadoEditar(estadoId);
      if (cliente.cidade) selectCidade.value = cliente.cidade;
    } else {
      selectUP.value = "";
      selectCidade.value = "";
      document.getElementById("lista-cidades").innerHTML = '';
    }

    // =============================
    //     BLOQUEAR BOTÃO SALVAR ATÉ ALTERAÇÃO
    // =============================
    const valoresOriginais = {
      nome: inputNome.value,
      telefone: inputTelefone.value,
      up: selectUP.value,
      cidade: selectCidade.value
    };

    function verificarAlteracoes() {
      const alterado =
        inputNome.value !== valoresOriginais.nome ||
        inputTelefone.value !== valoresOriginais.telefone ||
        selectUP.value !== valoresOriginais.up ||
        selectCidade.value !== valoresOriginais.cidade;

      btnSalvar.disabled = !alterado;
      if (alterado) {
        btnSalvar.classList.remove("opacity-50", "pointer-events-none");
      } else {
        btnSalvar.classList.add("opacity-50", "pointer-events-none");
      }
    }

    [inputNome, inputTelefone, selectUP, selectCidade].forEach(el => {
      el.addEventListener("input", verificarAlteracoes);
      el.addEventListener("change", verificarAlteracoes);
    });

    // Abrir modal
    const modal = document.getElementById("modal-editar-cliente");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  // =============================
  //     FECHAR MODAL EDITAR
  // =============================
  function fecharModalEditar() {
    const modal = document.getElementById("modal-editar-cliente");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }

  document.getElementById("fechar-modal-editar").addEventListener("click", fecharModalEditar);
  document.getElementById("cancelar-edicao").addEventListener("click", fecharModalEditar);

// =============================
//     SALVAR ALTERAÇÕES
// =============================
document.getElementById("form-editar-cliente").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("edit-id").value;

  const telefoneFormatado = aplicarMascaraTelefone(
    document.getElementById("edit-telefone").value
  );

  const dadosAtualizados = {
    nome: document.getElementById("edit-nome").value.trim(),
    telefone: telefoneFormatado,
    cidade: document.getElementById("edit-cidade").value.trim(),
    up: document.getElementById("edit-up").value.trim(), // sempre ID
  };

  console.log("Salvando alterações do cliente:", dadosAtualizados);

  const { error } = await supabase
    .from("clientes")
    .update(dadosAtualizados)
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar cliente:", error);
    mostrarToast("Erro ao salvar alterações!", "bg-red-600");
    return;
  }

  fecharModalEditar();
  carregarClientes();
  mostrarToast("Cliente atualizado com sucesso!", "bg-green-600");
});

// =============================
//     🔥 CARREGAR ESTADOS
// =============================
async function carregarEstadosEditar() {
  const { data, error } = await supabase
    .from("estados")
    .select("*")
    .order("sigla", { ascending: true });

  if (error) {
    console.error("Erro ao carregar estados:", error);
    return [];
  }

  const selectEstado = document.getElementById("edit-up");
  selectEstado.innerHTML = '<option value="">Selecione</option>';

  data.forEach(est => {
    const opt = document.createElement("option");
    opt.value = est.id;
    opt.textContent = est.sigla;
    opt.dataset.sigla = est.sigla;
    selectEstado.appendChild(opt);
  });

  return data;
}

// =============================
//     🔥 CARREGAR CIDADES NO MODAL
// =============================
const inputCidade = document.getElementById('edit-cidade');
const modalCidades = document.getElementById('modal-cidades');
const fecharModalCidades = document.getElementById('fechar-modal-cidades');
const listaCidades = document.getElementById('lista-cidades');
const buscaCidade = document.getElementById('busca-cidade');

// Abrir modal ao clicar no input
inputCidade.addEventListener('click', () => {
  if (inputCidade.dataset.estado) {
    modalCidades.classList.remove('hidden');
  } else {
    alert("Selecione um estado primeiro.");
  }
});

// Fechar modal
fecharModalCidades.addEventListener('click', () => {
  modalCidades.classList.add('hidden');
  buscaCidade.value = '';
  filtrarCidades('');
});

// Buscar cidades dinamicamente ao digitar
buscaCidade.addEventListener('input', (e) => {
  filtrarCidades(e.target.value);
});

// Carrega cidades do estado no modal
async function carregarCidadesPorEstadoEditar(estadoId) {
  if (!estadoId) return;

  const { data, error } = await supabase
    .from("cidades")
    .select("*")
    .eq("estado_id", estadoId)
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao carregar cidades:", error);
    return;
  }

  // Salva estado no input para checagem ao abrir modal
  inputCidade.dataset.estado = estadoId;

  listaCidades.innerHTML = '';

  data.forEach(cidade => {
    const li = document.createElement('li');
    li.textContent = cidade.nome;
    li.className = 'px-4 py-2 cursor-pointer hover:bg-gray-100 rounded-lg';
    li.addEventListener('click', () => {
      inputCidade.value = cidade.nome;
      modalCidades.classList.add('hidden');
      buscaCidade.value = '';
    });
    listaCidades.appendChild(li);
  });
}

// Filtrar cidades no modal
function filtrarCidades(termo) {
  Array.from(listaCidades.children).forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(termo.toLowerCase()) ? 'block' : 'none';
  });
}

// =============================
//  🔍 Buscar ID por Sigla (MG → 1)
// =============================
async function buscarEstadoIdPorSigla(sigla) {
  const { data, error } = await supabase
    .from("estados")
    .select("id")
    .eq("sigla", sigla)
    .single();

  return error ? null : data.id;
}

// =============================
//   Evento ao mudar estado
// =============================
document.getElementById("edit-up").addEventListener("change", async (e) => {
  await carregarCidadesPorEstadoEditar(e.target.value);
});


function mostrarToast(mensagem, cor = "bg-green-600") {
  const toast = document.getElementById("toast");

  // Muda o texto da mensagem
  toast.textContent = mensagem;

  // Remove qualquer cor antiga e aplica a nova
  toast.classList.remove("bg-green-600", "bg-red-600", "bg-yellow-600", "bg-blue-600");
  toast.classList.add(cor);

  // Mostra o toast
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("opacity-100"), 10);

  // Oculta após 3 segundos
  setTimeout(() => {
    toast.classList.remove("opacity-100");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, 3000);
}


// =============================
//   MÁSCARA PARA TELEFONE
// =============================
function aplicarMascaraTelefone(valor) {
  valor = valor.replace(/\D/g, ""); // remove tudo que não é número

  if (valor.length <= 10) {
    // Formato fixo
    return valor.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  } else {
    // Formato celular
    return valor.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
  }
}

// ===============================
//   MÁSCARA DO TELEFONE NO MODAL
// ===============================
document.getElementById("edit-telefone").addEventListener("input", function (e) {
  let valor = e.target.value.replace(/\D/g, ""); // remove tudo que não é número

  if (valor.length > 11) valor = valor.slice(0, 11); // limita a 11 dígitos

  if (valor.length <= 10) {
    // formato (11) 3456-7890
    valor = valor.replace(/^(\d{2})(\d)/, "($1) $2");
    valor = valor.replace(/(\d{4})(\d)/, "$1-$2");
  } else {
    // formato (11) 98765-4321
    valor = valor.replace(/^(\d{2})(\d)/, "($1) $2");
    valor = valor.replace(/(\d{5})(\d)/, "$1-$2");
  }

  e.target.value = valor;
});

// ==============================
// FUNÇÃO PARA EXIBIR NOTIFICAÇÃO
// ==============================
function mostrarNotificacao(mensagem, tipo = "sucesso") {
  const modal = document.getElementById("modal-notificacao");
  const texto = document.getElementById("modal-notificacao-texto");

  texto.textContent = mensagem;

  modal.classList.remove("bg-green-500", "bg-red-500", "bg-yellow-500");
  if (tipo === "sucesso") modal.classList.add("bg-green-500");
  else if (tipo === "erro") modal.classList.add("bg-red-500");
  else if (tipo === "alerta") modal.classList.add("bg-yellow-500");

  modal.classList.remove("hidden");
  modal.classList.add("scale-100");

  setTimeout(() => {
    modal.classList.add("scale-95");
    setTimeout(() => modal.classList.add("hidden"), 300);
  }, 3000);
}

// ==============================
// Modal de confirmação
// ==============================
function abrirModalConfirmacao(acao, funcionario, callbackConfirmar) {
  const modal = document.getElementById("modal-confirmacao");
  const texto = document.getElementById("modal-texto");
  const btnConfirmar = document.getElementById("btn-confirmar");
  const btnCancelar = document.getElementById("btn-cancelar");

  texto.textContent = `Deseja realmente ${acao} o funcionário ${funcionario.nome_completo}?`;

  modal.classList.remove("hidden");

  // Remove eventos antigos
  btnConfirmar.replaceWith(btnConfirmar.cloneNode(true));
  btnCancelar.replaceWith(btnCancelar.cloneNode(true));

  const novoConfirm = document.getElementById("btn-confirmar");
  const novoCancelar = document.getElementById("btn-cancelar");

  novoConfirm.addEventListener("click", () => {
    modal.classList.add("hidden");
    callbackConfirmar();
  });

  novoCancelar.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
}

// ==============================
// LISTAR FUNCIONÁRIOS COM BOTÕES
// ==============================
async function listarFuncionarios() {
  try {
    const { data: funcionarios, error } = await supabase
      .from("funcionarios")
      .select(`
        id,
        nome_completo,
        usuario_id:usuarios!usuarios_funcionario_id_fkey (
          id,
          username,
          email,
          cargo,
          permissoes,
          ativo
        )
      `)
      .order('nome_completo', { ascending: true });

    if (error) {
      console.error("Erro ao listar funcionários:", error);
      return;
    }

    const lista = document.getElementById("lista-funcionarios");
    lista.innerHTML = "";

    funcionarios.forEach(f => {
      const div = document.createElement("div");
      div.classList.add(
        "flex", "items-center", "justify-between", "p-4", "mb-2",
        "border", "rounded-lg", "bg-gray-50", "shadow-sm"
      );

      // Nome + permissões
      const nomeDiv = document.createElement("div");
      nomeDiv.classList.add("flex", "flex-col");

      const nome = document.createElement("span");
      nome.classList.add("font-semibold", "text-gray-800");
      nome.textContent = f.nome_completo || "—";

      // ✅ Garante que não quebre se usuario_id estiver vazio
      const usuario = f.usuario_id?.[0] || {};
      let permissoesLiberadas = [];

      if (Array.isArray(usuario.permissoes)) {
        permissoesLiberadas = usuario.permissoes;
      } else if (typeof usuario.permissoes === "string") {
        try { permissoesLiberadas = JSON.parse(usuario.permissoes); } catch(e){ permissoesLiberadas = []; }
      }

      let permText = usuario.username?.toLowerCase() === "admin"
        ? "Acesso Total"
        : (permissoesLiberadas.length ? permissoesLiberadas.join(", ") : "-");

      const perm = document.createElement("span");
      perm.classList.add("text-sm", "text-gray-600");
      perm.textContent = permText;

      nomeDiv.appendChild(nome);
      nomeDiv.appendChild(perm);
      div.appendChild(nomeDiv);

      // Botões (não mostrar para admin)
      if (usuario.username?.toLowerCase() !== "admin") {
        const botoesDiv = document.createElement("div");
        botoesDiv.classList.add("flex", "gap-2");

        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.classList.add("px-3", "py-1", "bg-blue-500", "hover:bg-blue-600", "text-white", "rounded", "text-sm");
        btnEditar.addEventListener("click", () => abrirModalEdicao(f));

        const btnBloquear = document.createElement("button");
        btnBloquear.textContent = usuario.ativo === false ? "Desbloquear" : "Bloquear";
        btnBloquear.classList.add("px-3", "py-1", "bg-gray-400", "hover:bg-gray-500", "text-white", "rounded", "text-sm");
        btnBloquear.addEventListener("click", () => {
          const acao = usuario.ativo === false ? "desbloquear" : "bloquear";
          abrirModalConfirmacao(acao, f, async () => {
            try {
              const { error } = await supabase
                .from("usuarios")
                .update({ ativo: usuario.ativo === false ? true : false })
                .eq("id", usuario.id);

              if (error) throw error;

              let mensagem = acao === "bloquear" ? "Funcionário bloqueado com sucesso!" : "Funcionário desbloqueado com sucesso!";
              mostrarNotificacao(mensagem, "sucesso");

              listarFuncionarios();
            } catch (err) {
              console.error(`Erro ao ${acao} funcionário:`, err);
              mostrarNotificacao(`Erro ao ${acao} funcionário!`, "erro");
            }
          });
        });

        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.classList.add("px-3", "py-1", "bg-red-700", "hover:bg-red-800", "text-white", "rounded", "text-sm");
        btnExcluir.addEventListener("click", () => {
          abrirModalConfirmacao("excluir", f, async () => {
            try {
              if (usuario?.id) {
                const { error: errorUsuario } = await supabase
                  .from("usuarios")
                  .delete()
                  .eq("id", usuario.id);
                if (errorUsuario) throw errorUsuario;
              }

              const { error: errorFuncionario } = await supabase
                .from("funcionarios")
                .delete()
                .eq("id", f.id);
              if (errorFuncionario) throw errorFuncionario;

              mostrarNotificacao("Funcionário excluído com sucesso!", "sucesso");
              listarFuncionarios();
            } catch (err) {
              console.error("Erro ao excluir funcionário:", err);
              mostrarNotificacao("Erro ao excluir funcionário!", "erro");
            }
          });
        });

        botoesDiv.appendChild(btnEditar);
        botoesDiv.appendChild(btnBloquear);
        botoesDiv.appendChild(btnExcluir);
        div.appendChild(botoesDiv);
      }

      lista.appendChild(div);
    });
  } catch (err) {
    console.error("Erro ao listar funcionários:", err);
  }
}

// Chamada inicial ao carregar o painel
listarFuncionarios();

// ==============================
// CARREGAR CARGOS DO SUPABASE NO SELECT
// ==============================

async function carregarCargos() {
  const selectCargo = document.getElementById("cargoFuncionario");

  if (!selectCargo) {
    console.warn("⚠️ Select cargoFuncionario não encontrado");
    return;
  }

  try {
    const { data: cargos, error } = await supabase
      .from("cargos")
      .select("nome")
      .order("nome", { ascending: true });

    if (error) {
      console.error("❌ Erro ao carregar cargos:", error);
      selectCargo.innerHTML = `<option value="">Erro ao carregar cargos</option>`;
      return;
    }

    // limpa e recria opções
    selectCargo.innerHTML = `<option value="">Selecione um cargo</option>`;

    cargos.forEach(cargo => {
      const option = document.createElement("option");
      option.value = cargo.nome;      // ✅ TEXTO
      option.textContent = cargo.nome;
      selectCargo.appendChild(option);
    });

    console.log("✅ Cargos carregados com sucesso");

  } catch (err) {
    console.error("❌ Erro inesperado:", err);
    selectCargo.innerHTML = `<option value="">Erro inesperado</option>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  carregarCargos();
});

// ==============================
// CADASTRAR / ATUALIZAR FUNCIONÁRIO (formulário principal)
// ==============================

const formFuncionario = document.getElementById("form-cadastro-funcionario");

formFuncionario.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("=== 📌 INICIANDO PROCESSO DE SALVAR FUNCIONÁRIO ===");

  const nome = document.getElementById("nomeFuncionario").value.trim();
  const usuario = document.getElementById("usuarioFuncionario").value.trim();
  const senha = document.getElementById("senhaFuncionario").value.trim();
  const email = document.getElementById("emailFuncionario").value.trim();
  const cargo = document.getElementById("cargoFuncionario").value;

  if (!cargo) {
    alert("Selecione um cargo");
    return;
  }

  try {

    let funcionarioId;
    let usuarioId;

    // =============================
    // 🔥 CAPTURAR PERMISSÕES
    // =============================
    const permissoes = [];

    const checkboxes = [
      { id: "permAcessoTotal", valor: "Acesso Total" },
      { id: "permClientes", valor: "acesso_clientes" },
      { id: "permPedidos", valor: "acesso_pedidos" },
      { id: "permProdutos", valor: "acesso_produtos" },
      { id: "permFuncionarios", valor: "acesso_funcionarios" },
      { id: "permRelatorios", valor: "acesso_relatorios" },
      { id: "permMesas", valor: "acesso_mesas" } // ✅ NOVO
    ];

    checkboxes.forEach(item => {
      const chk = document.getElementById(item.id);
      if (chk && chk.checked) {
        permissoes.push(item.valor);
      }
    });

    console.log("📌 Permissões:", permissoes);

    // =============================
    // ✏️ ATUALIZAR FUNCIONÁRIO
    // =============================
    if (formFuncionario.dataset.editingId) {

      const idUsuario = formFuncionario.dataset.editingId;

      const { data: usuarioAtualizado, error: errorUsuario } = await supabase
        .from("usuarios")
        .update({
          username: usuario,
          password: senha,
          email: email || null,
          cargo: cargo,
          permissoes: permissoes
        })
        .eq("id", idUsuario)
        .select();

      if (errorUsuario) throw errorUsuario;

      usuarioId = usuarioAtualizado[0].id;
      funcionarioId = usuarioAtualizado[0].funcionario_id;

      const { error: errorFuncUpdate } = await supabase
        .from("funcionarios")
        .update({ nome_completo: nome })
        .eq("id", funcionarioId);

      if (errorFuncUpdate) throw errorFuncUpdate;

    }

    // =============================
    // ➕ NOVO FUNCIONÁRIO
    // =============================
    else {

      const { data: funcionarioData, error: errorFuncionario } = await supabase
        .from("funcionarios")
        .insert([{ nome_completo: nome }])
        .select();

      if (errorFuncionario) throw errorFuncionario;

      funcionarioId = funcionarioData[0].id;

      const { data: usuarioData, error: errorUsuario } = await supabase
        .from("usuarios")
        .insert([{
          id: crypto.randomUUID(),
          username: usuario,
          password: senha,
          email: email || null,
          cargo: cargo,
          funcionario_id: funcionarioId,
          permissoes: permissoes
        }])
        .select();

      if (errorUsuario) throw errorUsuario;

      usuarioId = usuarioData[0].id;
    }

    // =============================
    // ✅ FINALIZAÇÃO
    // =============================
    alert(
      formFuncionario.dataset.editingId
        ? "Funcionário atualizado com sucesso!"
        : "Funcionário cadastrado com sucesso!"
    );

    formFuncionario.reset();
    delete formFuncionario.dataset.editingId;

    listarFuncionarios();

  } catch (err) {
    console.error("❌ ERRO AO SALVAR FUNCIONÁRIO:", err);
    alert("Erro ao salvar funcionário.");
  }
});



// ==============================
// FUNÇÃO PARA CARREGAR FUNCIONÁRIO COM USUÁRIO
// ==============================
async function carregarFuncionario(idFuncionario) {
  const { data, error } = await supabase
    .from('funcionarios')
    .select(`
      id,
      nome_completo,
      usuarios (
        id,
        username,
        email,
        password,
        permissoes
      )
    `)
    .eq('id', idFuncionario)
    .single(); // pega apenas 1 registro

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

// ==============================
// ABRIR MODAL DE EDIÇÃO COM FUNCIONÁRIO + USUÁRIO
// ==============================
async function abrirModalEdicao(f) {

  const modal = document.getElementById("modal-editar-funcionario");
  if (!modal) return console.error("Modal não encontrado!");

  modal.classList.remove("hidden");

  // Helpers
  const setValue = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
  };

  const setChecked = (id, condition) => {
    const el = document.getElementById(id);
    if (el) el.checked = !!condition;
  };

  // =========================
  // CAMPOS FUNCIONÁRIO
  // =========================
  setValue("editarIdFuncionario", f.id);
  setValue("editarNomeFuncionario", f.nome_completo);

  // =========================
  // BUSCAR USUÁRIO
  // =========================
  let usuario = f.usuarios?.[0];

  if (!usuario) {

    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('funcionario_id', f.id);

    if (error) {
      console.error("Erro ao buscar usuário:", error);
    }

    usuario = usuarios?.[0] || null;
  }

  // =========================
  // PREENCHER DADOS USUÁRIO
  // =========================
  if (usuario) {

    setValue("editarUsuarioFuncionario", usuario.username);
    setValue("editarSenhaFuncionario", usuario.password);
    setValue("editarEmailFuncionario", usuario.email);

    const permissoes = usuario.permissoes || [];

    setChecked("editarPermAcessoTotal", permissoes.includes("Acesso Total"));
    setChecked("editarPermClientes", permissoes.includes("acesso_clientes"));
    setChecked("editarPermPedidos", permissoes.includes("acesso_pedidos"));
    setChecked("editarPermProdutos", permissoes.includes("acesso_produtos"));
    setChecked("editarPermRelatorios", permissoes.includes("acesso_relatorios"));

    // =========================
    // ✅ PERMISSÕES DETALHADAS
    // =========================
    let permissoesDetalhadas = null;

    const { data, error: erroPerm } = await supabase
      .from("permissoes_detalhadas")
      .select("*")
      .eq("usuario_id", usuario.id)
      .maybeSingle(); // ← evita erro se não existir registro

    if (erroPerm) {
      console.error("Erro ao buscar permissões detalhadas:", erroPerm);
    }

    permissoesDetalhadas = data;

    // =========================
    // ✅ MENU MESAS
    // =========================
    setChecked(
      "editarPermMesas",
      permissoesDetalhadas?.acesso_mesas?.visualizar === true
    );

  }

  // =========================
  // VISUALIZAR SENHA
  // =========================
  const toggleSenha = document.getElementById("toggleSenha");
  const inputSenha = document.getElementById("editarSenhaFuncionario");
  const iconOlho = document.getElementById("iconOlho");

  if (toggleSenha && inputSenha && iconOlho) {

    toggleSenha.replaceWith(toggleSenha.cloneNode(true));
    const novoToggle = document.getElementById("toggleSenha");

    novoToggle.addEventListener("click", () => {

      if (inputSenha.type === "password") {

        inputSenha.type = "text";

        iconOlho.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.056 10.056 0 012.135-3.314M6.293 6.293l11.414 11.414"/>
        `;

      } else {

        inputSenha.type = "password";

        iconOlho.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        `;
      }

    });
  }

}



// ==============================
// FECHAR MODAL
// ==============================
document.getElementById("btnFecharModal").addEventListener("click", () => {
  document.getElementById("modal-editar-funcionario").classList.add("hidden");
});


document.getElementById("form-editar-funcionario").addEventListener("submit", async (e) => {
  e.preventDefault();

  const idFuncionario = document.getElementById("editarIdFuncionario").value;
  const nome = document.getElementById("editarNomeFuncionario").value.trim();
  const username = document.getElementById("editarUsuarioFuncionario").value.trim();
  const password = document.getElementById("editarSenhaFuncionario").value.trim();
  const email = document.getElementById("editarEmailFuncionario").value.trim();

  // ✅ Captura checkbox mesas
  const permMesas = document.getElementById("editarPermMesas")?.checked || false;

  // =============================
  // MONTA ARRAY PERMISSÕES
  // =============================
  const permissoes = [];

  if (document.getElementById("editarPermAcessoTotal")?.checked) {
    permissoes.push("Acesso Total");
  }

  if (document.getElementById("editarPermClientes")?.checked)
    permissoes.push("acesso_clientes");

  if (document.getElementById("editarPermPedidos")?.checked)
    permissoes.push("acesso_pedidos");

  if (document.getElementById("editarPermProdutos")?.checked)
    permissoes.push("acesso_produtos");

  if (document.getElementById("editarPermFuncionarios")?.checked)
    permissoes.push("acesso_funcionarios");

  if (document.getElementById("editarPermRelatorios")?.checked)
    permissoes.push("acesso_relatorios");

  if (permMesas)
    permissoes.push("acesso_mesas");

  try {

    // =============================
    // 1️⃣ Atualiza funcionário
    // =============================
    const { error: errorFuncionario } = await supabase
      .from("funcionarios")
      .update({ nome_completo: nome })
      .eq("id", idFuncionario);

    if (errorFuncionario) throw errorFuncionario;

    // =============================
    // 2️⃣ Busca usuário associado
    // =============================
    const { data: usuarios, error: errorUsuarioFetch } = await supabase
      .from("usuarios")
      .select("*")
      .eq("funcionario_id", idFuncionario);

    if (errorUsuarioFetch) throw errorUsuarioFetch;

    const usuario = usuarios?.[0];
    if (!usuario) throw new Error("Usuário associado não encontrado");

    // =============================
    // 3️⃣ Atualiza usuário
    // =============================
    const { error: errorUsuario } = await supabase
      .from("usuarios")
      .update({
        username,
        password,
        email,
        permissoes
      })
      .eq("id", usuario.id);

    if (errorUsuario) throw errorUsuario;

    // =============================
    // 4️⃣ SALVA PERMISSÕES DETALHADAS
    // =============================
    await supabase
      .from("permissoes_detalhadas")
      .upsert({
        usuario_id: usuario.id,
        acesso_mesas: {
          visualizar: permMesas,
          editar: false,
          excluir: false,
          bloquear: false
        }
      });

    // =============================
    // SUCESSO
    // =============================
    alert("Funcionário e permissões atualizados com sucesso!");

    document.getElementById("modal-editar-funcionario").classList.add("hidden");

    listarFuncionarios();

  } catch (err) {
    console.error("Erro ao atualizar funcionário:", err);
    alert("Erro ao atualizar funcionário. Veja o console.");
  }
});



// ==============================
// CHAMA LISTAR FUNCIONÁRIOS AO CARREGAR
// ==============================
listarFuncionarios();



// =============================
//   REALTIME — Atualizações ao vivo
// =============================
supabase
  .channel("pedidos-listener")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "pedidos" },
    payload => {
      console.log("NOVO PEDIDO:", payload.new);
      carregarPedidos();
    }
  )
  .subscribe();

  // ======================
//  ABRIR CONFIGURAÇÕES
// ======================
function ativarMenuConfiguracoes() {
  const configBtn = document.querySelector('label[data-menu="configuracoes"]');
  const sections = document.querySelectorAll(".content-section");

  if (!configBtn) {
    console.error("Botão de Configurações não encontrado!");
    return;
  }

  configBtn.addEventListener("click", () => {
    // Esconde todas as seções
    sections.forEach(sec => sec.style.display = "none");

    // Mostra a seção de Configurações
    const secaoConfig = document.getElementById("configuracoes");
    if (secaoConfig) secaoConfig.style.display = "block";

    // Marca o menu como ativo
    document.querySelectorAll("aside nav label").forEach(l => l.classList.remove("active"));
    configBtn.classList.add("active");

    // Fecha menu mobile (se estiver aberto)
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    if (window.innerWidth <= 768) {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    }
  });
}

// ===============================
// CARREGAR HORÁRIOS DO SUPABASE
// ===============================
async function carregarHorariosSemana() {
  const diasMap = {
    "segunda": "seg",
    "terca": "ter",
    "quarta": "qua",
    "quinta": "qui",
    "sexta": "sex",
    "sabado": "sab",
    "domingo": "dom"
  };

  const { data, error } = await supabase.from("horarios_semana").select("*");
  if (error) { console.error("Erro ao buscar horários:", error); return; }

  data.forEach(item => {
    const id = diasMap[item.dia_semana.toLowerCase()];
    if (!id) return;

    const checkbox = document.getElementById(id);
    const inicio = document.getElementById(`${id}_inicio`);
    const fim = document.getElementById(`${id}_fim`);
    const filete = document.querySelector(`#${id}_card .filete`);

    checkbox.checked = !!item.hora_inicio && !!item.hora_fim;
    inicio.value = item.hora_inicio ? item.hora_inicio.slice(0,5) : "";
    fim.value = item.hora_fim ? item.hora_fim.slice(0,5) : "";

    if (checkbox.checked) {
      filete.classList.remove("bg-red-500");
      filete.classList.add("bg-blue-500");
    } else {
      filete.classList.remove("bg-blue-500");
      filete.classList.add("bg-red-500");
    }
  });
}

// =======================================
// MARCAR/DESMARCAR → trocando a cor
// =======================================
function configurarFiletes() {
  const dias = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

  dias.forEach(id => {
    const checkbox = document.getElementById(id);
    if (!checkbox) return;

    checkbox.addEventListener("change", () => {
      const filete = document.querySelector(`#${id}_card .filete`);
      if (!filete) return;

      if (checkbox.checked) {
        filete.classList.remove("bg-red-500");
        filete.classList.add("bg-blue-500");
      } else {
        filete.classList.remove("bg-blue-500");
        filete.classList.add("bg-red-500");
        document.getElementById(`${id}_inicio`).value = "";
        document.getElementById(`${id}_fim`).value = "";
      }
    });
  });
}

// =======================================
// SALVAR CONFIGURAÇÕES NO SUPABASE
// =======================================
async function salvarHorariosSemana() {
  const dias = [
    { nome: "segunda", id: "seg" },
    { nome: "terca", id: "ter" },
    { nome: "quarta", id: "qua" },
    { nome: "quinta", id: "qui" },
    { nome: "sexta", id: "sex" },
    { nome: "sabado", id: "sab" },
    { nome: "domingo", id: "dom" }
  ];

  for (const dia of dias) {
    const checkbox = document.getElementById(dia.id);
    const hora_inicio_input = document.getElementById(`${dia.id}_inicio`).value;
    const hora_fim_input = document.getElementById(`${dia.id}_fim`).value;

    const hora_inicio = hora_inicio_input ? `${hora_inicio_input}:00` : null;
    const hora_fim = hora_fim_input ? `${hora_fim_input}:00` : null;

    if (checkbox.checked) {
      // Upsert usando dia_semana como chave única
      const { error } = await supabase
        .from("horarios_semana")
        .upsert({
          dia_semana: dia.nome,
          hora_inicio,
          hora_fim
        }, { onConflict: ["dia_semana"] });

      if (error) console.error(`Erro ao salvar ${dia.nome}:`, error);

    } else {
      // Desmarcado → deixar NULL
      const { error } = await supabase
        .from("horarios_semana")
        .update({
          hora_inicio: null,
          hora_fim: null
        })
        .eq("dia_semana", dia.nome);

      if (error) console.error(`Erro ao desativar ${dia.nome}:`, error);
    }
  }

  
}


// =======================================
// EXECUTAR AO CARREGAR A PÁGINA
// =======================================
document.addEventListener("DOMContentLoaded", () => {
  carregarHorariosSemana();
  configurarFiletes();

  const botaoSalvar = document.getElementById("btnSalvarHorarios");
  if (!botaoSalvar) return;

  botaoSalvar.addEventListener("click", async () => {
    try {
      await salvarHorariosSemana();
      alert("Horários salvos com sucesso!");
    } catch (e) {
      console.error("Erro ao salvar horários:", e);
      alert("Erro ao salvar horários. Veja o console.");
    }
  });
});


// ===============================
// INICIAR SISTEMA
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  carregarHorariosSemana();
  configurarFiletes();

  const btnSalvar = document.querySelector("button.bg-blue-600");
  if (btnSalvar) btnSalvar.addEventListener("click", salvarHorariosSemana);
});

async function salvarUsuario() {
  console.log("=== 📌 INICIANDO PROCESSO DE SALVAR FUNCIONÁRIO ===");

  try {
    // 1️⃣ Pegar dados do formulário
    const username = document.getElementById("inputUsername").value.trim();
    const email = document.getElementById("inputEmail").value.trim() || null;
    const password = document.getElementById("inputSenha").value.trim();
    const cargo = document.getElementById("inputCargo").value.trim() || null;

    console.log("➡️ Dados capturados do formulário:", { username, email, password, cargo });

    // 2️⃣ Capturar permissões como ARRAY
    const permissoes = [];
    const checkboxes = [
      { id: "permAcessoTotal", valor: "Acesso Total" },
      { id: "permClientes", valor: "acesso_clientes" },
      { id: "permPedidos", valor: "acesso_pedidos" },
      { id: "permProdutos", valor: "acesso_produtos" },
      { id: "permFuncionarios", valor: "acesso_funcionarios" },
      { id: "permRelatorios", valor: "acesso_relatorios" },
      { id: "permMesas", valor: "acesso_mesas" }
    ];

    checkboxes.forEach(item => {
      const chk = document.getElementById(item.id);
      if (chk && chk.checked) {
        permissoes.push(item.valor);
      }
    });

    console.log("📌 Permissões selecionadas (ARRAY):", permissoes);

    // 3️⃣ Salvar no Supabase
    const { data, error } = await supabase
      .from("usuarios")
      .insert([
        {
          id: crypto.randomUUID(),       // gera UUID
          username: username,
          password: password,
          cargo: cargo,
          email: email,
          funcionario_id: null,         // sempre null por padrão
          permissoes: permissoes        // array de strings
        }
      ]);

    if (error) {
      console.error("❌ Erro Supabase:", error);
      throw error;
    }

    alert("Funcionário cadastrado com sucesso!");
    document.getElementById("formFuncionario").reset();

    listarFuncionarios();

  } catch (err) {
    console.error("Erro ao cadastrar usuário:", err);
    alert("Erro ao cadastrar usuário. Veja o console.");
  }
}



// ===============================
// EVENTO PARA O FORMULÁRIO
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formFuncionario");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault(); // Evita envio tradicional
      await salvarUsuario();
    });
  }
});



document.addEventListener('DOMContentLoaded', async () => {
  const btnNotificacoes = document.getElementById('btn-notificacoes');
  const balao = document.getElementById('balao-notificacoes');
  const contador = document.getElementById('contador-notificacoes');
  const listaNotificacoes = document.getElementById('lista-notificacoes');
  const btnLimpar = document.getElementById('btnLimpar');

  // Recupera notificações e último ID do localStorage
  let notificacoes = JSON.parse(localStorage.getItem('notificacoes')) || [];
  let ultimoIdNotificado = parseInt(localStorage.getItem('ultimoIdNotificado')) || 0;

  // Som de notificação
  const somNotificacao = new Audio('https://www.soundjay.com/buttons/sounds/button-3.mp3');

  function atualizarContador() {
    if (!contador) return;
    contador.textContent = notificacoes.length;
    contador.classList.toggle('hidden', notificacoes.length === 0);
  }

  function atualizarListaNotificacoes() {
    if (!listaNotificacoes) return;
    listaNotificacoes.innerHTML = '';
    listaNotificacoes.style.maxHeight = '300px';
    listaNotificacoes.style.overflowY = 'auto';

    const frag = document.createDocumentFragment();
    notificacoes.forEach(pedido => {
      const li = document.createElement('li');
      li.textContent = `Pedido - ${pedido.cliente} - R$ ${pedido.total.toFixed(2).replace('.', ',')}`;
      li.className = 'px-4 py-2 hover:bg-blue-600 cursor-pointer';
      frag.appendChild(li);
    });
    listaNotificacoes.appendChild(frag);
  }

  function salvarEstado() {
    localStorage.setItem('notificacoes', JSON.stringify(notificacoes));
    localStorage.setItem('ultimoIdNotificado', ultimoIdNotificado);
  }

  if (btnLimpar) {
    btnLimpar.addEventListener('click', (e) => {
      e.stopPropagation();
      notificacoes = [];
      ultimoIdNotificado = 0;
      salvarEstado();
      atualizarListaNotificacoes();
      atualizarContador();
    });
  }

  if (btnNotificacoes && balao) {
    btnNotificacoes.addEventListener('click', (e) => {
      e.stopPropagation();
      balao.classList.toggle('hidden');
      atualizarListaNotificacoes();
    });
  }

  document.addEventListener('click', (e) => {
    if (balao && btnNotificacoes && !btnNotificacoes.contains(e.target) && !balao.contains(e.target)) {
      balao.classList.add('hidden');
    }
  });

  // Inicializa último ID existente
  async function inicializarUltimoId() {
    if (ultimoIdNotificado > 0) return;
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('id')
        .eq('status', 'Recebido')
        .order('id', { ascending: false })
        .limit(1);
      if (!error && data && data.length > 0) {
        ultimoIdNotificado = data[0].id;
        salvarEstado();
      }
    } catch (err) {
      console.error('Erro ao inicializar último ID:', err);
    }
  }

  // Função para adicionar novo pedido à lista de notificações
  function adicionarNotificacao(pedido) {
    if (!notificacoes.some(n => n.id === pedido.id)) {
      notificacoes.push(pedido);
      ultimoIdNotificado = Math.max(ultimoIdNotificado, pedido.id);
      salvarEstado();
      atualizarContador();
      atualizarListaNotificacoes();

      somNotificacao.play().catch(err => console.warn('Erro ao tocar som:', err));
      btnNotificacoes.classList.add('animate-pulse');
      setTimeout(() => btnNotificacoes.classList.remove('animate-pulse'), 1000);
    }
  }

  await inicializarUltimoId();
  atualizarContador();
  atualizarListaNotificacoes();

  // =======================
  // Realtime Supabase
  // =======================
  supabase
    .channel('realtime-pedidos')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'pedidos', filter: 'status=eq.Recebido' },
      (payload) => {
        adicionarNotificacao(payload.new);
      }
    )
    .subscribe();
});

// Função do formulário de cadastro de produtos
document.addEventListener("DOMContentLoaded", () => {
  const inputFoto = document.getElementById("fotoProduto");
  const previewImg = document.getElementById("previewImagem");
  const nomeProduto = document.getElementById("nomeProduto");

  // ============================
  // PREVIEW DA IMAGEM
  // ============================
  inputFoto.addEventListener("change", function () {
    const arquivo = this.files[0];

    if (arquivo) {
      const reader = new FileReader();

      reader.onload = function (e) {
        previewImg.src = e.target.result;
      };

      reader.readAsDataURL(arquivo);
    }
  });

  // ============================
  // BLOQUEAR NÚMEROS NO CAMPO NOME
  // ============================
  nomeProduto.addEventListener("input", function () {
    this.value = this.value.replace(/[0-9]/g, ""); // remove números
  });
});

document.addEventListener("DOMContentLoaded", () => {

  // ================================
  // CAMPO DATA
  // ================================
  const inputDataCadastro = document.querySelector('input[type="date"]');
  if (inputDataCadastro) {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, "0");
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const ano = hoje.getFullYear();
    inputDataCadastro.value = `${ano}-${mes}-${dia}`;
  }

  // ================================
  // FUNÇÃO PARA FORMATAR MOEDA BR
  // ================================
  const formatarMoeda = (valor) => {
    const numero = Number(valor) / 100;
    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // ================================
  // CAMPOS DE VALOR
  // ================================
  const inputValorSugerido = document.getElementById('valorSugerido');
  const inputValorCusto = document.getElementById('valorCusto');
  const inputMargem = document.getElementById('margemLucro');

  // ================================
  // CALCULAR MARGEM
  // ================================
  const calcularMargem = () => {
    const custo = Number(inputValorCusto.value.replace(/\D/g, '')) / 100;
    const venda = Number(inputValorSugerido.value.replace(/\D/g, '')) / 100;

    let margem = 0;
    if (venda > 0) {
      margem = ((venda - custo) / venda) * 100;
    }

    inputMargem.value = `${margem.toFixed(2)}%`;
    inputMargem.style.color = margem < 0 ? 'red' : 'black';
  };

  if (inputValorSugerido && inputValorCusto && inputMargem) {
    inputValorSugerido.value = 'R$ 0,00';
    inputValorCusto.value = 'R$ 0,00';
    inputMargem.value = '0%';

    const formatarInputMoeda = (input) => {
      input.addEventListener('input', (e) => {
        let valor = e.target.value.replace(/\D/g, '');
        e.target.value = valor ? formatarMoeda(valor) : 'R$ 0,00';
        calcularMargem();
      });

      input.addEventListener('blur', (e) => {
        if (!e.target.value || e.target.value === 'R$ ,00') {
          e.target.value = 'R$ 0,00';
          calcularMargem();
        }
      });
    };

    formatarInputMoeda(inputValorSugerido);
    formatarInputMoeda(inputValorCusto);
  }

  // ================================
  // CONTROLE DE ABAS
  // ================================
  const abas = document.querySelectorAll(".aba");
  const abaPrincipal = document.getElementById("abaPrincipal");
  const abaEstoque = document.getElementById("abaEstoque");

  abas.forEach(btn => {
    btn.addEventListener("click", () => {
      abas.forEach(b => b.classList.remove("border-b-2", "border-black", "text-black"));
      btn.classList.add("border-b-2", "border-black", "text-black");

      abaPrincipal.classList.add("hidden");
      abaEstoque.classList.add("hidden");

      if (btn.dataset.aba === "estoque") {
        abaEstoque.classList.remove("hidden");
      } else {
        abaPrincipal.classList.remove("hidden");
      }
    });
  });

  // ================================
  // ATUALIZAÇÃO DE ESTOQUE
  // ================================
  const btnAtualizarEstoque = document.getElementById("btnAtualizarEstoque");

  if (btnAtualizarEstoque) {
    btnAtualizarEstoque.addEventListener("click", () => {

      const inputEstoqueAtual = document.getElementById("estoqueAtual");
      const tipoMovimentacao = document.getElementById("tipoMovimentacao");
      const quantidadeInput = document.getElementById("quantidadeMovimentacao");

      const estoqueAtual = parseInt(inputEstoqueAtual.value) || 0;
      const tipo = tipoMovimentacao.value;
      const quantidade = parseInt(quantidadeInput.value);

      if (!quantidade || quantidade <= 0) {
        alert("Informe uma quantidade válida.");
        return;
      }

      let novoEstoque = estoqueAtual;

      if (tipo === "entrada") {
        novoEstoque += quantidade;
      } else {
        if (quantidade > estoqueAtual) {
          alert("Quantidade maior que o estoque disponível.");
          return;
        }
        novoEstoque -= quantidade;
      }

      inputEstoqueAtual.value = novoEstoque;
      quantidadeInput.value = "";

      alert("Estoque atualizado com sucesso!");
    });
  }

});



//submenus categorias
document.addEventListener("DOMContentLoaded", () => {
  const menuCategorias = document.querySelector('[data-menu="categorias"]');
  const submenuCategorias = document.getElementById("submenu-categorias");
  const outrosMenus = document.querySelectorAll('[data-menu]:not([data-menu="categorias"])');

  // Ao clicar em Categorias, alterna visibilidade suavemente
  if (menuCategorias && submenuCategorias) {
    menuCategorias.addEventListener("click", (e) => {
      e.stopPropagation(); // evita que o clique "vaze" para o documento
      submenuCategorias.classList.toggle("aberto");
    });
  }

  // Ao clicar em qualquer outro menu, fecha suavemente
  outrosMenus.forEach(menu => {
    menu.addEventListener("click", () => {
      submenuCategorias.classList.remove("aberto");
    });
  });

  // Clicar fora do menu também fecha suavemente
  document.addEventListener("click", () => {
    submenuCategorias.classList.remove("aberto");
  });

  // Evita que clique dentro do submenu feche ele
  submenuCategorias.addEventListener("click", (e) => {
    e.stopPropagation();
  });
});

// =============================
//   MENU PRODUTOS (SUBMENU)
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const menuProdutos = document.querySelector('[data-menu="produtos"]');
  const submenuProdutos = document.getElementById("submenu-produtos");
  const setaProdutos = document.querySelector(".seta-produtos");

  const todosMenus = document.querySelectorAll(".menu-item");

  if (!menuProdutos || !submenuProdutos) return;

  menuProdutos.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 🔐 PERMISSÃO REAL (SE O MENU ESTÁ VISÍVEL, ELE TEM ACESSO)
    const menuVisivel = getComputedStyle(menuProdutos).display !== "none";

    if (!menuVisivel) {
      mostrarToast?.(
        "Você não tem permissão para acessar Produtos.",
        "bg-red-600"
      );
      return;
    }

    // 🔁 TOGGLE NORMAL
    const aberto = submenuProdutos.classList.contains("aberto");

    fecharSubmenuProdutos();

    if (!aberto) {
      submenuProdutos.classList.add("aberto");
      setaProdutos?.classList.add("rotated");
    }
  });

  // FECHAR AO CLICAR EM OUTRO MENU
  todosMenus.forEach(menu => {
    if (menu !== menuProdutos) {
      menu.addEventListener("click", () => {
        fecharSubmenuProdutos();
      });
    }
  });

  function fecharSubmenuProdutos() {
    submenuProdutos.classList.remove("aberto");
    setaProdutos?.classList.remove("rotated");
  }
});


document.addEventListener('DOMContentLoaded', async () => {
  const btnSalvar = document.getElementById('btnSalvarProduto');
  const inputCodigo = document.getElementById('codigoPreview');
  const inputQuantidadeMovimentacao = document.getElementById('quantidadeMovimentacao');
  const btnAtualizarEstoque = document.getElementById('btnAtualizarEstoque');
  const inputImagemProduto = document.getElementById('imagemProduto');
  const previewImagemProduto = document.getElementById('previewImagemProduto');
  const selectCategoria = document.getElementById('categoriaProduto');

  let imagemUrl = '';

  /* =========================
     CARREGAR CATEGORIAS
  ========================= */
  async function carregarCategorias() {
    if (!selectCategoria) return;

    selectCategoria.innerHTML =
      '<option value="">Selecione uma categoria</option>';

    const { data, error } = await supabase
      .from('categorias')
      .select('nome')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao carregar categorias:', error);
      selectCategoria.innerHTML =
        '<option value="">Erro ao carregar categorias</option>';
      return;
    }

    data.forEach(categoria => {
      const option = document.createElement('option');
      option.value = categoria.nome;
      option.textContent = categoria.nome;
      selectCategoria.appendChild(option);
    });
  }

  /* =========================
     MODAIS
  ========================= */
  function criarModal(modalId, textoId, btnId) {
    const modal = document.getElementById(modalId);
    const texto = document.getElementById(textoId);
    const btnFechar = modal ? modal.querySelector(`#${btnId}`) : null;

    function mostrar(mensagem) {
      if (!modal || !texto) return;
      texto.textContent = mensagem;
      modal.classList.remove('hidden');
    }

    if (btnFechar && modal) {
      btnFechar.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }

    return mostrar;
  }

  const mostrarModalAviso = criarModal('modalAviso', 'modalMensagem', 'btnFecharModal');
  const mostrarModalErro = criarModal('modalErro', 'modalMensagemErro', 'btnFecharModalErro');
  const mostrarModalValorSugerido = criarModal(
    'modalValorSugerido',
    'modalMensagemValorSugerido',
    'btnFecharValorSugerido'
  );

  /* =========================
     CÓDIGO AUTOMÁTICO
  ========================= */
  async function atualizarCodigo() {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('codigo')
        .order('codigo', { ascending: false })
        .limit(1);

      if (error) {
        inputCodigo.value = '0001';
        return;
      }

      const ultimoCodigo = data.length ? parseInt(data[0].codigo) : 0;
      inputCodigo.value = (ultimoCodigo + 1).toString().padStart(4, '0');
    } catch {
      inputCodigo.value = '0001';
    }
  }

  /* =========================
     PREVIEW IMAGEM
  ========================= */
  if (inputImagemProduto && previewImagemProduto) {
    inputImagemProduto.addEventListener('change', () => {
      const file = inputImagemProduto.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        previewImagemProduto.src = e.target.result;
        imagemUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    });

    previewImagemProduto.addEventListener('click', () => {
      inputImagemProduto.click();
    });
  }

  /* =========================
     SALVAR PRODUTO
  ========================= */
  if (btnSalvar) {
    btnSalvar.addEventListener('click', async () => {
      const descricao = document.getElementById('descricao')?.value.trim();
      const quantidade = parseInt(inputQuantidadeMovimentacao?.value);

      const converterMoedaParaFloat = valor => {
        if (!valor) return 0;
        return parseFloat(
          valor.replace(/\./g, '').replace('R$', '').replace(',', '.').trim()
        );
      };

      const valorCusto = converterMoedaParaFloat(
        document.getElementById('valorCusto')?.value
      );
      const valorSugerido = converterMoedaParaFloat(
        document.getElementById('valorSugerido')?.value
      );

      if (!descricao) {
        mostrarModalErro('Informe o nome do produto.');
        return;
      }

      if (valorSugerido === 0) {
        mostrarModalValorSugerido('Valor de venda inválido.');
        return;
      }

      if (!quantidade || quantidade <= 0) {
        mostrarModalErro('Informe a quantidade em estoque.');
        return;
      }

      const { data: existentes } = await supabase
        .from('produtos')
        .select('id')
        .eq('descricao', descricao);

      if (existentes.length > 0) {
        mostrarModalAviso('Produto já cadastrado.');
        return;
      }

      const produto = {
        codigo: parseInt(inputCodigo.value),
        data_cadastro: new Date().toISOString().split('T')[0],
        data_atualizacao: new Date().toISOString().split('T')[0],
        descricao,
        descricao_nfe: document.getElementById('descricaoNfe')?.value || '',
        categoria: selectCategoria.value,
        unidade_medida: document.getElementById('unidadeMedida')?.value || '',
        valor_custo: valorCusto,
        valor_sugerido: valorSugerido,
        estoque: quantidade,
        origem: document.getElementById('origem')?.value || '0',
        ncm: document.getElementById('ncm')?.value || '',
        cest: document.getElementById('cest')?.value || '',
        grupo_icms: document.getElementById('grupoIcms')?.value || '',
        codigo_alternativo:
          document.getElementById('codigoAlternativo')?.value || '',
        imagem_url: imagemUrl,
        situacao: 'ativo'
      };

      const { error } = await supabase.from('produtos').insert([produto]);

      if (error) {
        mostrarModalErro('Erro ao salvar produto: ' + error.message);
      } else {
        mostrarModalAviso('Produto salvo com sucesso!');
        await atualizarCodigo();
        selectCategoria.value = '';
        previewImagemProduto.src = 'https://via.placeholder.com/200';
        imagemUrl = '';
      }
    });
  }

  /* =========================
     ATUALIZAR ESTOQUE
  ========================= */
  if (btnAtualizarEstoque) {
    btnAtualizarEstoque.addEventListener('click', async () => {
      const quantidade = parseInt(inputQuantidadeMovimentacao?.value);
      const tipo = document.getElementById('tipoMovimentacao')?.value;
      const descricao = document.getElementById('descricao')?.value.trim();

      if (!descricao || !quantidade) {
        mostrarModalErro('Informe produto e quantidade.');
        return;
      }

      const { data: produto } = await supabase
        .from('produtos')
        .select('id, estoque')
        .eq('descricao', descricao)
        .single();

      let novoEstoque =
        tipo === 'entrada'
          ? produto.estoque + quantidade
          : Math.max(0, produto.estoque - quantidade);

      await supabase
        .from('produtos')
        .update({ estoque: novoEstoque })
        .eq('id', produto.id);

      mostrarModalAviso(`Estoque atualizado: ${novoEstoque}`);
      document.getElementById('estoqueAtual').value = novoEstoque;
      inputQuantidadeMovimentacao.value = '';
    });
  }

  /* =========================
     INIT
  ========================= */
  await carregarCategorias();
  await atualizarCodigo();
});

let produtoIdExcluir = null

async function carregarProdutos() {
  const corpoTabela = document.getElementById("corpoTabelaProdutos")
  corpoTabela.innerHTML = `<tr><td colspan="6" class="text-gray-400 text-center py-4">Carregando produtos...</td></tr>`

  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('*')
    .order('data_cadastro', { ascending: false })

  if (error) {
    corpoTabela.innerHTML = `<tr><td colspan="6" class="text-red-500 text-center py-4">Erro ao carregar produtos.</td></tr>`
    console.error(error)
    return
  }

  if (!produtos || produtos.length === 0) {
    corpoTabela.innerHTML = `<tr><td colspan="6" class="text-gray-400 text-center py-4">Nenhum produto cadastrado ainda.</td></tr>`
    return
  }

  corpoTabela.innerHTML = ''
  
  produtos.forEach(produto => {
    const tr = document.createElement('tr')

    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">${produto.codigo || ''}</td>
      <td class="px-6 py-4 whitespace-nowrap">${produto.descricao || ''}</td>
      <td class="px-6 py-4 whitespace-nowrap">${produto.categoria || ''}</td>
      <td class="px-6 py-4 whitespace-nowrap">R$ ${produto.valor_sugerido?.toFixed(2) || '0.00'}</td>
      <td class="px-6 py-4 whitespace-nowrap">${produto.situacao || ''}</td>
      <td class="px-6 py-4 whitespace-nowrap space-x-2">
        <button class="btn-acao btn-editar">Editar</button>
        <button class="btn-acao btn-excluir">Excluir</button>
      </td>
    `

    corpoTabela.appendChild(tr)

    // Adiciona os eventos dinamicamente
    const btnEditar = tr.querySelector('.btn-editar')
    btnEditar.addEventListener('click', () => editarProduto(produto.id))

    const btnExcluir = tr.querySelector('.btn-excluir')
    btnExcluir.addEventListener('click', () => abrirModalExcluir(produto.id))
  })
}

// Abrir modal de confirmação
function abrirModalExcluir(id) {
  produtoIdExcluir = id
  const modal = document.getElementById("modalExcluirProduto")
  modal.classList.remove('hidden')
  modal.classList.add('flex')
}

// Cancelar exclusão
document.getElementById("btnCancelarExcluir").addEventListener("click", () => {
  produtoIdExcluir = null
  const modal = document.getElementById("modalExcluirProduto")
  modal.classList.add('hidden')
  modal.classList.remove('flex')
})

// Confirmar exclusão
document.getElementById("btnConfirmarExcluir").addEventListener("click", async () => {
  if (!produtoIdExcluir) return

  const { error } = await supabase.from('produtos').delete().eq('id', produtoIdExcluir)
  if (error) {
    alert('Erro ao excluir produto.')
    console.error(error)
  } else {
    carregarProdutos()
  }

  produtoIdExcluir = null
  const modal = document.getElementById("modalExcluirProduto")
  modal.classList.add('hidden')
  modal.classList.remove('flex')
})

// Função de editar produto
function editarProduto(id) {
  alert('Editar produto ' + id)
}

document.addEventListener('DOMContentLoaded', carregarProdutos)

document.addEventListener("DOMContentLoaded", () => {
  const listaProdutos = document.querySelector('[data-menu="lista-produtos"]');
  const modal = document.getElementById('modalPermissao');
  const btnFechar = document.getElementById('btnFecharModalPermissao');
  const sectionListaProdutos = document.getElementById('lista-produtos');

  // BUSCAR USUÁRIO LOGADO do localStorage
  // Suponha que você salve algo assim no login:
  // localStorage.setItem("usuarioLogado", JSON.stringify({username: "Daniel", permissoes: ["acesso_clientes","acesso_produtos"]}));
  const usuarioAtual = JSON.parse(localStorage.getItem("usuarioLogado"));

  listaProdutos.addEventListener('click', (e) => {
    if (!usuarioAtual || !usuarioAtual.permissoes.includes("Acesso Total")) {
      // Bloqueia usuário sem acesso
      e.preventDefault();
      e.stopImmediatePropagation();
      sectionListaProdutos.style.display = "none";
      modal.classList.remove('hidden');
      return false;
    }
    // Usuário com "Acesso Total" abre normalmente
  });

  btnFechar.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
});

/* ==============================
   CONFIGURAÇÃO WHATSAPP PAINEL
============================== */
function configurarWhatsAppPainel() {
  const btnWhats = document.getElementById("whatsapp-dashboard");
  if (!btnWhats) return;

  // 🔹 CONFIGURAÇÕES
  const numeroEmpresa = "5534998217498"; // coloque o número real
  const mensagemPadrao = "Olá! Preciso de suporte no painel.";

  // 🔹 Detecta mobile ou desktop
  const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(
    navigator.userAgent
  );

  // 🔹 Define o link correto
  const link = isMobile
    ? `https://wa.me/${numeroEmpresa}?text=${encodeURIComponent(mensagemPadrao)}`
    : `https://web.whatsapp.com/send?phone=${numeroEmpresa}&text=${encodeURIComponent(mensagemPadrao)}`;

  // 🔹 Aplica no botão
  btnWhats.setAttribute("href", link);
  btnWhats.setAttribute("target", "_blank");
  btnWhats.setAttribute("rel", "noopener noreferrer");
}

/* ==============================
   INICIALIZAÇÃO
============================== */
document.addEventListener("DOMContentLoaded", () => {
  configurarWhatsAppPainel();
});

//senha de atendimento
  document.addEventListener("DOMContentLoaded", function () {

  const modalSenha = document.getElementById("modalSenha");
  const inputSenha = document.getElementById("senhaAtendimento");
  const erroSenha = document.getElementById("erroSenha");

  // 🔓 Abrir modal
  window.abrirModalSenha = function () {
    modalSenha.classList.remove("hidden");
    erroSenha.classList.add("hidden");
    inputSenha.value = "";
  };

  // ❌ Fechar modal
  window.fecharModalSenha = function () {
    modalSenha.classList.add("hidden");
  };

  // ✅ Validar senha no Supabase
  window.validarAcessoAtendimento = async function () {
    const password = inputSenha.value.trim();

    if (!password) {
      erroSenha.textContent = "Digite a senha";
      erroSenha.classList.remove("hidden");
      return;
    }

    try {
      const { data: usuario, error } = await supabase
        .from("usuarios")
        .select("id")
        .eq("password", password)
        .limit(1)
        .maybeSingle();

      if (error || !usuario) {
        erroSenha.textContent = "Senha incorreta";
        erroSenha.classList.remove("hidden");
        return;
      }

      // ✅ ACESSO LIBERADO
      fecharModalSenha();

      // 🔥 CAMINHO CORRETO
      window.location.href = "../painel-whatsapp/atendimentos.html";

    } catch (err) {
      console.error("Erro ao validar senha:", err);
      erroSenha.textContent = "Erro ao validar acesso";
      erroSenha.classList.remove("hidden");
    }
  };

});
 
//aqui o sistema fecha se tiver ausente
document.addEventListener("DOMContentLoaded", () => {

  // ❌ Não aplica no login
  const paginaAtual = window.location.pathname.split("/").pop();
  if (paginaAtual === "login.html") return;

  const TEMPO_INATIVIDADE = 5 * 60 * 1000; // 5 minuto
  const TEMPO_REDIRECIONAR = 15000; // segundos de contagem regressiva no modal

  const modalAviso = document.getElementById("modalAvisoInatividade");
  const btnFechar = document.getElementById("fechar-modal-aviso");
  const btnOk = document.getElementById("ok-modal-aviso");
  const contadorSpan = document.getElementById("contador-logout");

  // Som de aviso
  const somAviso = new Audio("alerta.mp3"); // coloque o arquivo de som no mesmo diretório

  let timerInatividade;
  let timerLogout;
  let contadorInterval;

  function iniciarTimer() {
    clearTimeout(timerInatividade);
    clearTimeout(timerLogout);
    clearInterval(contadorInterval);

    timerInatividade = setTimeout(() => {
      mostrarModalAviso();
      somAviso.play();
      iniciarContagemRegressiva();
    }, TEMPO_INATIVIDADE);
  }

  function mostrarModalAviso() {
    if (modalAviso) modalAviso.classList.remove("hidden");
  }

  function fecharModalAviso() {
    if (modalAviso) modalAviso.classList.add("hidden");
    clearTimeout(timerLogout);
    clearInterval(contadorInterval);
    iniciarTimer(); // reinicia o timer de inatividade
  }

  function iniciarContagemRegressiva() {
    let tempoRestante = TEMPO_REDIRECIONAR / 1000;
    if (contadorSpan) contadorSpan.textContent = tempoRestante;

    contadorInterval = setInterval(() => {
      tempoRestante -= 1;
      if (contadorSpan) contadorSpan.textContent = tempoRestante;

      if (tempoRestante <= 0) {
        clearInterval(contadorInterval);
      }
    }, 1000);

    // Redireciona após TEMPO_REDIRECIONAR
    timerLogout = setTimeout(() => {
      window.location.href = "login.html";
    }, TEMPO_REDIRECIONAR);
  }

  // Fechar modal clicando no X ou no OK
  btnFechar?.addEventListener("click", fecharModalAviso);
  btnOk?.addEventListener("click", fecharModalAviso);

  // Reiniciar timer ao detectar interação do usuário
  ["mousemove", "mousedown", "keydown", "scroll", "touchstart"].forEach(evento => {
    document.addEventListener(evento, iniciarTimer);
  });

  // Inicia o timer
  iniciarTimer();

});

document.addEventListener("DOMContentLoaded", () => {
  const btnAbrir = document.getElementById("btn-ver-atualizacoes");
  const modal = document.getElementById("modal-atualizacoes");
  const btnFechar = document.getElementById("fechar-atualizacoes");
  const lista = document.getElementById("lista-atualizacoes");

  // Exemplo de atualizações
  let atualizacoes = [
    {
      id: 1,
      data: "04/10/2025",
      descricao: [
        "Função adicionada de Cadastro de Clientes",
        "Função de permissões restritas adicionadas",
        "Função adicionada de Cadastro de Funcionarios",
        "Função adicionada de Cadastro de produtos",
        "Função de deslogar do painel de inatividade",
      ]
    },
    {
      id: 2,
      data: "20/12/2025",
      descricao: ["Adicionado botão de ver atualizações no painel",
                  "Notificaçoes de Pedidos Recebidos"
      ]
    },
    {
      id: 3,
      data: "18/12/2025",
      descricao: ["Corrigido problema de layout em telas pequenas"]
    },
    {
      id: 4,
      data: "15/12/2025",
      descricao: ["Nova funcionalidade de seleção de cidade implementada"]
    },
    {
      id: 5,
      data: "25/12/2025",
      descricao: ["Funçao mudaças no Layout para datas Comemorativas 'Tela de login'",
                  
      ]
    },
    {
      id: 6,
      data: "09/01/2026",
      descricao: ["Adicionando Luiza bot para suporte",
                  "Funçao de cadastro da empresa no cardapio",
                  "Funçao Cadastro de produtos",
                  "Funçao de cadastro e gerenciamento de mesa 'Qr Code",
                  "Funcionalidade para o Bot Luiza",
                  "Funçao para verificar se o cliente esta ou nao bloqueado no sistema",
                  "Funçao Calculadora",
                  "Funçao ver todos os clientes",
                  "Melhorias na Luiza bot"
                  
      ]
    },
    {
      id: 7,
      data: "21/01/2026",
      descricao: ["Adicionando Luiza bot para suporte",
                  "Melhorias no cardapio",
                  "Funçao de mensagem de lembrete do Carrinho",
                  "Funçao de carrinho de produtos"
                  
      ]
    }
  ];

  // Recupera do localStorage quais atualizações já foram vistas
  let atualizacoesVistas = JSON.parse(localStorage.getItem("atualizacoesVistas")) || [];

  // Função para verificar se existem atualizações não vistas
  function verificarAtualizacoes() {
    const naoVistas = atualizacoes.filter(atual => !atualizacoesVistas.includes(atual.id));
    if (naoVistas.length > 0) {
      btnAbrir.classList.remove("hidden"); // mostra o botão
    } else {
      btnAbrir.classList.add("hidden"); // esconde o botão
    }
  }

  // Renderizar atualizações agrupadas por data
  function renderizarAtualizacoes() {
    lista.innerHTML = "";

    atualizacoes.forEach(item => {
      const liData = document.createElement("li");
      liData.className = "bg-gray-50 rounded-lg p-4 shadow-sm";

      const dataTitulo = document.createElement("p");
      dataTitulo.className = "font-bold text-gray-700 mb-2";
      dataTitulo.textContent = item.data;
      liData.appendChild(dataTitulo);

      const ulDescricoes = document.createElement("ul");
      ulDescricoes.className = "list-disc list-inside space-y-1 text-gray-600";

      item.descricao.forEach(desc => {
        const liDesc = document.createElement("li");
        liDesc.textContent = desc;
        ulDescricoes.appendChild(liDesc);
      });

      liData.appendChild(ulDescricoes);
      lista.appendChild(liData);
    });
  }

  // Abrir modal
  btnAbrir.addEventListener("click", () => {
    renderizarAtualizacoes();
    modal.classList.remove("hidden");

    // Marcar todas as atualizações como vistas
    atualizacoesVistas = atualizacoes.map(atual => atual.id);
    localStorage.setItem("atualizacoesVistas", JSON.stringify(atualizacoesVistas));

    // Esconder o botão
    btnAbrir.classList.add("hidden");
  });

  // Fechar modal
  btnFechar.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Inicialmente, verifica se há atualizações não vistas
  verificarAtualizacoes();
});

// card clientes
document.addEventListener("DOMContentLoaded", () => {

  // Função para atualizar o total de clientes
  async function atualizarTotalClientes() {
    try {
      const { count, error } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error("Erro ao buscar clientes:", error.message);
        return;
      }

      document.getElementById("total-clientes").textContent = count;
    } catch (err) {
      console.error("Erro inesperado ao atualizar clientes:", err);
    }
  }

  // Atualiza assim que a página carrega
  atualizarTotalClientes();

  // Atualização automática a cada 5 segundos
  setInterval(atualizarTotalClientes, 5000);
});

// card pedidos
document.addEventListener("DOMContentLoaded", () => {

  // Função para atualizar pedidos pendentes (status = 'Recebido')
  async function atualizarPedidosPendentes() {
    try {
      const { count, error } = await supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Recebido'); // filtra somente os pedidos recebidos

      if (error) {
        console.error("Erro ao buscar pedidos pendentes:", error.message);
        return;
      }

      document.getElementById("pedidos-pendentes").textContent = count;
    } catch (err) {
      console.error("Erro inesperado ao atualizar pedidos pendentes:", err);
    }
  }

  // Atualiza assim que a página carrega
  atualizarPedidosPendentes();

  // Atualização automática a cada 5 segundos
  setInterval(atualizarPedidosPendentes, 5000);
});


// pedidos-concluidos
document.addEventListener("DOMContentLoaded", () => {

  // Função para atualizar pedidos concluídos (status = 'Finalizado')
  async function atualizarPedidosConcluidos() {
    try {
      const { count, error } = await supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Finalizado'); // filtra somente os pedidos finalizados

      if (error) {
        console.error("Erro ao buscar pedidos concluídos:", error.message);
        return;
      }

      document.getElementById("pedidos-concluidos").textContent = count;
    } catch (err) {
      console.error("Erro inesperado:", err);
    }
  }

  // Chamar a função ao carregar a página
  atualizarPedidosConcluidos();

  // Atualizar automaticamente a cada 30 segundos
  setInterval(atualizarPedidosConcluidos, 30000);
});

// card total pedido 
document.addEventListener("DOMContentLoaded", async () => {
  const totalPedidosEl = document.getElementById("total-pedidos");
  let totalPedidos = 0; // contador real do dashboard

  // 1️⃣ Inicializa com todos os pedidos existentes
  async function inicializarTotalPedidos() {
    try {
      const { count, error } = await supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true }); // pega apenas os IDs

      if (error) {
        console.error("Erro ao buscar total de pedidos:", error.message);
        return;
      }

      totalPedidos = count || 0;
      totalPedidosEl.textContent = totalPedidos;
    } catch (err) {
      console.error("Erro inesperado ao inicializar total de pedidos:", err);
    }
  }

  await inicializarTotalPedidos();

  // 2️⃣ Atualização periódica de fallback (não diminui o contador)
  setInterval(async () => {
    try {
      const { count, error } = await supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true });

      if (!error && count > totalPedidos) {
        // só incrementa se houver mais pedidos na tabela
        totalPedidos = count;
        totalPedidosEl.textContent = totalPedidos;
      }
      // se count < totalPedidos, não faz nada
    } catch (err) {
      console.error("Erro ao atualizar total de pedidos:", err);
    }
  }, 5000);

  // 3️⃣ Atualização instantânea via Supabase Realtime para novos pedidos
  supabase
    .from('pedidos')
    .on('INSERT', payload => {
      totalPedidos++;
      totalPedidosEl.textContent = totalPedidos;
    })
    .subscribe();
});


// grafico de vendas
document.addEventListener("DOMContentLoaded", () => {

  const totalPedidosEl = document.getElementById("total-pedidos");
  const totalClientesEl = document.getElementById("total-clientes");
  const selectPeriodo = document.getElementById("periodoPedidos");
  const selectAnoContainer = document.getElementById("selectAnoContainer");
  const selectAno = document.getElementById("anoPedidos");

  const canvas = document.getElementById('graficoPedidos');
  if (!canvas) return console.error("Canvas do gráfico não encontrado!");
  const ctx = canvas.getContext('2d');

  const grafico = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Valor Total Vendido (R$)',
        data: [],
        backgroundColor: '#4400ffff',
        borderColor: '#a36116ff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: (context) => `R$ ${context.parsed.y.toFixed(2)}`
          }
        }
      },
      scales: {
        x: { ticks: { font: { size: 12 } }, barPercentage: 0.5, categoryPercentage: 0.7 },
        y: { beginAtZero: true }
      }
    }
  });

  // Preencher anos de 1400 a 3000
  function preencherAnos() {
    const anoAtual = new Date().getFullYear();
    for (let ano = 1400; ano <= 3000; ano++) {
      const option = document.createElement("option");
      option.value = ano;
      option.textContent = ano;
      if (ano === anoAtual) option.selected = true;
      selectAno.appendChild(option);
    }
  }
  preencherAnos();

  // Buscar pedidos finalizados para o gráfico
  async function buscarPedidos(periodo, anoSelecionado = null) {
    const hoje = new Date();
    let labels = [];
    let dados = [];

    if (periodo === 'ano') {
      const ano = anoSelecionado || hoje.getFullYear();
      labels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      dados = Array(12).fill(0);

      const inicioAno = new Date(ano,0,1).toISOString();
      const fimAno = new Date(ano+1,0,1).toISOString();

      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('horario_recebido_status,total')
        .eq('status','Finalizado')
        .gte('horario_recebido_status', inicioAno)
        .lt('horario_recebido_status', fimAno);

      if (!error) {
        pedidos.forEach(pedido => {
          const mes = new Date(pedido.horario_recebido_status).getMonth();
          dados[mes] += parseFloat(pedido.total || 0);
        });
      }

    } else if (periodo === 'mes') {
      const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth()+1, 0).getDate();
      labels = Array.from({length:diasNoMes}, (_,i)=> (i+1).toString());
      dados = Array(diasNoMes).fill(0);

      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth()+1, 1).toISOString();

      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('horario_recebido_status,total')
        .eq('status','Finalizado')
        .gte('horario_recebido_status', inicioMes)
        .lt('horario_recebido_status', fimMes);

      if (!error) {
        pedidos.forEach(pedido => {
          const dia = new Date(pedido.horario_recebido_status).getDate();
          dados[dia-1] += parseFloat(pedido.total || 0);
        });
      }

    } else if (periodo === 'semana') {
      const diaSemanaHoje = hoje.getDay();
      const domingo = new Date(hoje);
      domingo.setDate(hoje.getDate() - diaSemanaHoje);
      labels = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
      dados = Array(7).fill(0);

      const inicioSemana = new Date(domingo.getFullYear(),domingo.getMonth(),domingo.getDate()).toISOString();
      const fimSemana = new Date(domingo.getFullYear(),domingo.getMonth(),domingo.getDate()+7).toISOString();

      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('horario_recebido_status,total')
        .eq('status','Finalizado')
        .gte('horario_recebido_status', inicioSemana)
        .lt('horario_recebido_status', fimSemana);

      if (!error) {
        pedidos.forEach(pedido => {
          const dia = new Date(pedido.horario_recebido_status).getDay();
          dados[dia] += parseFloat(pedido.total || 0);
        });
      }

    } else if (periodo === 'dia') {
      labels = Array.from({length:24},(_,i)=>i+'h');
      dados = Array(24).fill(0);

      const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();
      const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()+1).toISOString();

      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('horario_recebido_status,total')
        .eq('status','Finalizado')
        .gte('horario_recebido_status', inicioDia)
        .lt('horario_recebido_status', fimDia);

      if (!error) {
        pedidos.forEach(pedido => {
          const hora = new Date(pedido.horario_recebido_status).getHours();
          dados[hora] += parseFloat(pedido.total || 0);
        });
      }
    }

    return { labels, dados };
  }

  // Atualizar dashboard
  async function atualizarDashboard() {
    try {
      const periodo = selectPeriodo?.value || 'ano';
      const anoSelecionado = periodo==='ano'?parseInt(selectAno?.value):new Date().getFullYear();

      if(periodo==='ano') selectAnoContainer.classList.remove('hidden');
      else selectAnoContainer.classList.add('hidden');

      // 🔹 Total de pedidos (todos os status, nunca diminui)
      const { count: totalPedidos } = await supabase
        .from('pedidos')
        .select('id', { count:'exact', head:true }); // pega todos os pedidos
      totalPedidosEl.textContent = totalPedidos || 0;

      // Buscar e atualizar gráfico com valor total vendido (somente Finalizados)
      const { labels, dados } = await buscarPedidos(periodo, anoSelecionado);
      grafico.data.labels = labels;
      grafico.data.datasets[0].data = dados;
      grafico.update();

      // Total de clientes
      const { count: totalClientes } = await supabase
        .from('clientes')
        .select('*',{count:'exact',head:true});
      totalClientesEl.textContent = totalClientes || 0;

    } catch(err){
      console.error("Erro ao atualizar dashboard:",err);
    }
  }

  selectPeriodo?.addEventListener('change', atualizarDashboard);
  selectAno?.addEventListener('change', atualizarDashboard);

  atualizarDashboard();
  setInterval(atualizarDashboard, 10000);

});

// grafico de mais vendidos
document.addEventListener('DOMContentLoaded', () => {

  let graficoMaisVendidos = null; // variável global para o gráfico

  async function carregarProdutosMaisVendidos() {
    const { data: produtos, error } = await supabase
      .from('produtos')
      .select('descricao, estoque')
      .order('estoque', { ascending: false })
      .limit(10); // pega mais para garantir que teremos 5 únicos

    if (error) {
      console.error('Erro ao carregar produtos:', error);
      return [];
    }

    // Filtra para que cada descrição apareça apenas uma vez
    const produtosUnicos = [];
    const nomesVistos = new Set();
    for (const p of produtos) {
      if (!nomesVistos.has(p.descricao)) {
        nomesVistos.add(p.descricao);
        produtosUnicos.push(p);
      }
      if (produtosUnicos.length >= 5) break; // só os 5 primeiros únicos
    }

    return produtosUnicos;
  }

  async function renderizarGraficoMaisVendidos() {
    const produtos = await carregarProdutosMaisVendidos();

    const ctx = document.getElementById('graficoMaisVendidos').getContext('2d');
    const labels = produtos.map(p => p.descricao);
    const data = produtos.map(p => p.estoque);

    // Se já existir, destrói o gráfico anterior
    if (graficoMaisVendidos) graficoMaisVendidos.destroy();

    // Cria novo gráfico
    graficoMaisVendidos = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Estoque',
          data: data,
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });

    // Nomes dos produtos abaixo do gráfico
    const nomesDiv = document.getElementById('nomesProdutosMaisVendidos');
    nomesDiv.innerHTML = '';
    produtos.forEach(p => {
      const pEl = document.createElement('p');
      pEl.textContent = p.descricao;
      nomesDiv.appendChild(pEl);
    });
  }

  // Atualiza a cada 5 segundos
  renderizarGraficoMaisVendidos();
  setInterval(renderizarGraficoMaisVendidos, 5000);
});

const LINK_CARDAPIO = "https://cardapio-demo-v2.vercel.app/";

const btnCompartilhar = document.getElementById("btnCompartilhar");
const menuCompartilhar = document.getElementById("menuCompartilhar");

btnCompartilhar.addEventListener("click", () => {
  menuCompartilhar.classList.toggle("hidden");
});

// Copiar link
document.getElementById("btnCopiarLink").addEventListener("click", () => {
  navigator.clipboard.writeText(LINK_CARDAPIO);
  alert("Link do cardápio copiado!");
});

// Abrir cardápio
document.getElementById("btnAbrirCardapio").addEventListener("click", () => {
  window.open(LINK_CARDAPIO, "_blank");
});

// Compartilhamento
document.querySelectorAll(".btnShare").forEach(btn => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.type;

    if (type === "copiar") {
      navigator.clipboard.writeText(LINK_CARDAPIO);
      alert("Link copiado!");
      return;
    }

    let url = "";

    if (type === "whatsapp") {
      url = `https://wa.me/?text=${encodeURIComponent("Confira nosso cardápio online: " + LINK_CARDAPIO)}`;
    }

    if (type === "facebook") {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(LINK_CARDAPIO)}`;
    }

    if (type === "instagram") {
      alert("O Instagram não permite compartilhamento direto por link.\nCopie o link e cole na bio ou stories.");
      navigator.clipboard.writeText(LINK_CARDAPIO);
      return;
    }

    window.open(url, "_blank");
    menuCompartilhar.classList.add("hidden");
  });
});

// Fecha o menu ao clicar fora
document.addEventListener("click", (e) => {
  if (!btnCompartilhar.contains(e.target) && !menuCompartilhar.contains(e.target)) {
    menuCompartilhar.classList.add("hidden");
  }
});

let avisoMostrado = false;
let modalHorarioAberto = false;

/* ===============================
   DIA DA SEMANA (igual banco)
=============================== */
function getDiaSemanaTexto() {
  const dias = [
    "domingo",
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado"
  ];
  return dias[new Date().getDay()];
}

/* ===============================
   CONVERTE HORA PARA DATE
   (com ajuste de dia)
=============================== */
function horaParaDate(hora, ajusteDia = 0) {
  const [h, m, s] = hora.split(":");
  const d = new Date();
  d.setDate(d.getDate() + ajusteDia);
  d.setHours(Number(h), Number(m), Number(s || 0), 0);
  return d;
}

/* ===============================
   MODAL AVISO (3 MIN)
=============================== */
function mostrarModalAvisoEncerramento() {
  if (avisoMostrado) return;

  avisoMostrado = true;

  const modal = document.getElementById("modalAvisoEncerramento");
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  document.getElementById("btnConfirmarAvisoEncerramento").onclick = () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  };
}

/* ===============================
   MODAL BLOQUEIO HORÁRIO
=============================== */
function mostrarModalHorario() {
  if (modalHorarioAberto) return;

  modalHorarioAberto = true;

  const modal = document.getElementById("modalHorario");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

/* ===============================
   FUNÇÃO PRINCIPAL
=============================== */
async function verificarHorarioSistema() {
  const diaSemana = getDiaSemanaTexto();

  const { data, error } = await supabase
    .from("horarios_semana")
    .select("hora_inicio, hora_fim")
    .eq("dia_semana", diaSemana)
    .single();

  // ❌ Sem configuração válida → BLOQUEIA
  if (error || !data || !data.hora_inicio || !data.hora_fim) {
    mostrarModalHorario();
    return;
  }

  const agora = new Date();

  let horaInicio = horaParaDate(data.hora_inicio);
  let horaFim = horaParaDate(data.hora_fim);

  /* ===============================
     CASO VIRE A MADRUGADA
     Ex: 20:00 → 06:00
  =============================== */
  if (horaFim <= horaInicio) {
    // Se agora é depois da meia-noite
    if (agora < horaFim) {
      horaInicio.setDate(horaInicio.getDate() - 1);
    } else {
      horaFim.setDate(horaFim.getDate() + 1);
    }
  }

  /* ===============================
     FORA DO HORÁRIO
  =============================== */
  if (agora < horaInicio) {
    mostrarModalHorario();
    return;
  }

  if (agora >= horaFim) {
    mostrarModalHorario();

    setTimeout(async () => {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    }, 1000);

    return;
  }

  /* ===============================
     DENTRO DO HORÁRIO
  =============================== */
  modalHorarioAberto = false;

  const diferencaMs = horaFim - agora;
  const diferencaMin = Math.ceil(diferencaMs / 60000);

  // 🔔 Aviso 3 minutos antes
  if (diferencaMin <= 3 && diferencaMin > 0 && !avisoMostrado) {
    mostrarModalAvisoEncerramento();
  }
}

/* ===============================
   EXECUÇÃO
=============================== */
setInterval(verificarHorarioSistema, 1000);
verificarHorarioSistema();

// cadastro de categorias
document.addEventListener("DOMContentLoaded", () => {

  // ==========================
  // USUÁRIO LOGADO
  // ==========================
  const currentUser = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  // ==========================
  // ELEMENTOS
  // ==========================
  const modal = document.getElementById("modalCadastroCategoria");
  const nomeInput = document.getElementById("nomeCategoria");
  const descricaoInput = document.getElementById("descricaoCategoria");

  const modalErro = document.getElementById("modalErroCategoria");
  const btnFecharErro = document.getElementById("btnFecharErro");
  const mensagemErro = document.getElementById("mensagemErroCategoria");

  const btnGerenciar = document.getElementById("btnGerenciarCategorias");
  const listaCategoriasModal = document.getElementById("listaCategoriasModal");
  const categoriasModalTabela = document.getElementById("categoriasModalTabela");

  let editarId = null;

  // ==========================
  // MODAL SENHA ADMIN
  // ==========================
  const modalSenhaAdmin = document.getElementById("modalSenhaAdmin");
  modalSenhaAdmin.style.zIndex = 10001;

  const inputSenhaAdmin = document.getElementById("inputSenhaAdmin");
  const btnCancelarSenhaAdmin = document.getElementById("btnCancelarSenhaAdmin");
  const btnConfirmarSenhaAdmin = document.getElementById("btnConfirmarSenhaAdmin");
  const mensagemErroSenha = document.getElementById("mensagemErroSenha");

  let categoriaParaEditar = null;

  // ==========================
  // FUNÇÃO DE ERRO TEMPORÁRIO
  // ==========================
  function mostrarErroSenhaPorTempo(texto, tempo = 3000) {
    mensagemErroSenha.textContent = texto;
    mensagemErroSenha.classList.remove("hidden");

    inputSenhaAdmin.value = "";
    inputSenhaAdmin.focus();

    setTimeout(() => {
      mensagemErroSenha.classList.add("hidden");
    }, tempo);
  }

  // ==========================
  // LIMPAR ERRO AO DIGITAR
  // ==========================
  inputSenhaAdmin.addEventListener("input", () => {
    mensagemErroSenha.classList.add("hidden");
  });

  // ==========================
  // NOVA CATEGORIA
  // ==========================
  document.getElementById("btnCadastroCategoria")?.addEventListener("click", () => {
    modal.style.display = "flex";
    nomeInput.value = "";
    descricaoInput.value = "";
    listaCategoriasModal.style.display = "none";
    editarId = null;
  });

  document.getElementById("btnFecharModal").onclick = () => modal.style.display = "none";
  document.getElementById("btnCancelarModal").onclick = () => modal.style.display = "none";
  btnFecharErro.onclick = () => modalErro.classList.add("hidden");

  // ==========================
  // GERENCIAR CATEGORIAS
  // ==========================
  btnGerenciar.addEventListener("click", () => {
    listaCategoriasModal.style.display =
      listaCategoriasModal.style.display === "block" ? "none" : "block";

    if (listaCategoriasModal.style.display === "block") {
      carregarCategoriasModal();
    }
  });

  // ==========================
  // CARREGAR CATEGORIAS
  // ==========================
  async function carregarCategoriasModal() {
    const { data: categorias, error } = await supabase
      .from("categorias")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    categoriasModalTabela.innerHTML = "";

    categorias.forEach(cat => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${cat.nome}</td>
        <td>${cat.descricao}</td>
        <td>
          <button class="btnEditar" data-id="${cat.id}">Editar</button>
          <button class="btnBloquear" data-id="${cat.id}">Bloquear</button>
        </td>
      `;
      categoriasModalTabela.appendChild(tr);
    });

    // EDITAR
    document.querySelectorAll(".btnEditar").forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;

        if (currentUser.cargo === "Administrador") {
          abrirModalCategoria(id);
        } else {
          categoriaParaEditar = id;
          inputSenhaAdmin.value = "";
          mensagemErroSenha.classList.add("hidden");
          modalSenhaAdmin.style.display = "flex";
          inputSenhaAdmin.focus();
        }
      };
    });

    // BLOQUEAR
    document.querySelectorAll(".btnBloquear").forEach(btn => {
      btn.onclick = async () => {
        if (!confirm("Deseja bloquear esta categoria?")) return;

        // Se quiser bloquear, você pode criar campo "ativo" opcional ou ignorar
        alert("Bloqueio de categoria não implementado nesta versão.");
      };
    });
  }

  // ==========================
  // CANCELAR SENHA ADMIN
  // ==========================
  btnCancelarSenhaAdmin.onclick = () => {
    modalSenhaAdmin.style.display = "none";
    inputSenhaAdmin.value = "";
    mensagemErroSenha.classList.add("hidden");
    categoriaParaEditar = null;
  };

  // ==========================
  // CONFIRMAR SENHA ADMIN
  // ==========================
  btnConfirmarSenhaAdmin.onclick = async () => {
    const senha = inputSenhaAdmin.value.trim();

    if (senha === "") {
      mostrarErroSenhaPorTempo("O campo senha não pode ficar vazio.");
      return;
    }

    const { data: admin, error } = await supabase
      .from("usuarios")
      .select("id")
      .eq("cargo", "Administrador")
      .eq("password", senha)
      .eq("ativo", true);

    if (error || !admin || admin.length === 0) {
      mostrarErroSenhaPorTempo("Senha do administrador incorreta.");
      return;
    }

    mensagemErroSenha.classList.add("hidden");
    modalSenhaAdmin.style.display = "none";
    inputSenhaAdmin.value = "";

    abrirModalCategoria(categoriaParaEditar);
    categoriaParaEditar = null;
  };

  // ==========================
  // ABRIR MODAL PARA EDIÇÃO
  // ==========================
  async function abrirModalCategoria(id) {
    const { data: categoria, error } = await supabase
      .from("categorias")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert("Erro ao carregar categoria");
      return;
    }

    nomeInput.value = categoria.nome;
    descricaoInput.value = categoria.descricao;
    editarId = id;
    modal.style.display = "flex";
  }

  // ==========================
  // SALVAR CATEGORIA
  // ==========================
  document.getElementById("btnSalvarCategoria").onclick = async () => {
    const nome = nomeInput.value.trim();
    const descricao = descricaoInput.value.trim();
    const icone = `/icones/${nome.toLowerCase()}.png`; // padrão, você pode ajustar

    if (nome === "") {
      mensagemErro.textContent = "O campo ‘Nome da Categoria’ não pode ficar vazio.";
      modalErro.classList.remove("hidden");
      return;
    }

    // Verificar duplicado pelo nome
    const { data: duplicado } = await supabase
      .from("categorias")
      .select("id")
      .ilike("nome", nome);

    if (duplicado?.some(c => c.id !== editarId)) {
      mensagemErro.textContent = "Esta categoria já está cadastrada no sistema.";
      modalErro.classList.remove("hidden");
      return;
    }

    let result;

    if (editarId) {
      result = await supabase
        .from("categorias")
        .update({ nome, descricao, icone })
        .eq("id", editarId);
    } else {
      result = await supabase
        .from("categorias")
        .insert([{ nome, descricao, icone }]);
    }

    if (result.error) {
      console.error("Erro ao salvar categoria:", result.error);
      mensagemErro.textContent = result.error.message;
      modalErro.classList.remove("hidden");
      return;
    }

    alert(editarId ? "Categoria atualizada!" : "Categoria cadastrada!");
    modal.style.display = "none";
    editarId = null;
    carregarCategoriasModal();
  };

});


// =============================
// FUNÇÃO PARA VERIFICAR ESTOQUE ZERADO
// =============================
async function verificarEstoqueZerado() {
  const modal = document.getElementById("modalEstoqueZerado");
  const totalSpan = document.getElementById("totalProdutosZerados");
  const listaProdutos = document.getElementById("listaProdutosZerados");
  const btnFechar = document.getElementById("btnFecharModalEstoque");

  if (!modal || !totalSpan || !listaProdutos || !btnFechar) return;

  try {
    // Busca produtos com estoque = 0
    const { data: produtos, error } = await supabase
      .from("produtos")
      .select("id, descricao, estoque")
      .eq("estoque", 0);

    if (error) {
      console.error("Erro ao buscar produtos com estoque zerado:", error);
      return;
    }

    // Se não houver produtos, não mostra o modal
    if (!produtos || produtos.length === 0) return;

    // Atualiza o total
    totalSpan.textContent = produtos.length;

    // Limpa a lista
    listaProdutos.innerHTML = "";

    // Adiciona cada produto na lista
    produtos.forEach(prod => {
      const li = document.createElement("li");
      li.textContent = prod.descricao;
      li.style.marginBottom = "4px";
      listaProdutos.appendChild(li);
    });

    // Mostra o modal
    modal.classList.remove("hidden");

    // Fecha o modal
    btnFechar.onclick = () => {
      modal.classList.add("hidden");
    };

  } catch (err) {
    console.error("Erro inesperado ao verificar estoque zerado:", err);
  }
}



// =============================
// EXIBIR MODAL DE ESTOQUE ZERADO NO ADMIN
// =============================
document.addEventListener("DOMContentLoaded", async () => {
  if (localStorage.getItem("mostrarEstoqueZerado") === "true") {
    await verificarEstoqueZerado();
    localStorage.removeItem("mostrarEstoqueZerado");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // ================= MENU MESAS =================
  const menuMesas = document.querySelector('[data-menu="mesas"]');
  const submenuMesas = document.getElementById("submenu-mesas");
  const setaMesas = document.querySelector(".seta-mesas");

  // Todas as seções do sistema
  const todasSeções = document.querySelectorAll(".content-section");

  // Submenus individuais
  const submenuCadastroMesas = document.querySelector('[data-menu="cadastro-mesas"]');
  const submenuListaMesas = document.querySelector('[data-menu="lista-mesas"]');

  // ================= FUNÇÃO PARA FECHAR SUBMENUS =================
  function fecharTodosSubmenus() {
    // Fecha container do submenu Mesas
    if(submenuMesas) {
      submenuMesas.style.maxHeight = "0px";
      submenuMesas.style.opacity = "0";
      if(setaMesas) setaMesas.classList.remove("rotated");
    }

    // Remove visual de ativo nos submenus
    if(submenuCadastroMesas) submenuCadastroMesas.classList.remove("active");
    if(submenuListaMesas) submenuListaMesas.classList.remove("active");
  }

  // Abre/fecha submenu Mesas
  menuMesas.addEventListener("click", () => {
    if(submenuMesas.style.maxHeight === "0px" || submenuMesas.style.maxHeight === "") {
      fecharTodosSubmenus(); // Fecha qualquer submenu aberto antes
      submenuMesas.style.maxHeight = "500px";
      submenuMesas.style.opacity = "1";
      if(setaMesas) setaMesas.classList.add("rotated");
    } else {
      fecharTodosSubmenus();
    }
  });

  // ================= FUNÇÃO UNIVERSAL PARA ABRIR TELAS =================
  function abrirTela(telaId) {
  // Fecha submenus
  fecharTodosSubmenus();

  // Esconde todas as seções
  todasSeções.forEach(section => {
    section.style.display = "none";
  });

  // Mostra a seção
  const tela = document.getElementById(telaId);
  if (tela) tela.style.display = "block";

  // ✅ SE FOR CADASTRO DE MESAS → GERA NÚMERO
  if (telaId === "cadastro-mesas") {
    gerarNumeroMesa();
  }
}


  // ================= CLIQUE NOS SUBMENUS =================
  if(submenuCadastroMesas) {
    submenuCadastroMesas.addEventListener("click", () => {
      abrirTela("cadastro-mesas");
    });
  }

  if(submenuListaMesas) {
    submenuListaMesas.addEventListener("click", () => {
      abrirTela("lista-mesas");
    });
  }

  // ================= CLIQUE EM OUTROS MENUS =================
  const outrosMenus = document.querySelectorAll('[data-menu]:not([data-menu="mesas"])');
  outrosMenus.forEach(menu => {
    menu.addEventListener("click", () => {
      fecharTodosSubmenus(); // Fecha todos os submenus ao clicar em outro menu
    });
  });
});



document.addEventListener("DOMContentLoaded", () => {
  // 1️⃣ Todas as seções de conteúdo
  const sections = document.querySelectorAll(".content-section");

  // 2️⃣ Todos os submenus
  const submenus = document.querySelectorAll("[data-submenu]");

  // 3️⃣ Função para abrir uma tela específica
function abrirTela(telaId, submenuAtivo) {
  // Esconde todas as seções
  sections.forEach(section => section.style.display = "none");

  // Remove a classe 'active' de todos os submenus
  submenus.forEach(sm => sm.classList.remove("active"));

  // Mostra apenas a seção selecionada
  const tela = document.getElementById(telaId);
  if (tela) tela.style.display = "block";

  // Marca o submenu clicado como ativo, exceto os "mesas" sem efeito visual
  if (submenuAtivo && !["cadastro-mesas", "lista-mesas"].includes(submenuAtivo.getAttribute("data-submenu"))) {
    submenuAtivo.classList.add("active");
  }
}

// 4️⃣ Submenu Cadastro de Mesas
const submenuCadastroMesas = document.querySelector('[data-submenu="cadastro-mesas"]');
if (submenuCadastroMesas) {
  submenuCadastroMesas.addEventListener("click", () => {
    // Abre a tela
    document.querySelectorAll(".content-section")
      .forEach(sec => sec.style.display = "none");

    document.getElementById("cadastro-mesas").style.display = "block";

    // ✅ GERA O NÚMERO AQUI (SEM FALHA)
    gerarNumeroMesa();
  });
}


// 5️⃣ Submenu Lista Mesas
const submenuListaMesas = document.querySelector('[data-submenu="lista-mesas"]');
if(submenuListaMesas) {
  submenuListaMesas.addEventListener("click", () => {
    abrirTela("lista-mesas", submenuListaMesas);
  });
}

// 6️⃣ Submenu Produtos
const submenuProdutos = document.querySelector('[data-submenu="produtos"]');
if(submenuProdutos) {
  submenuProdutos.addEventListener("click", () => {
    abrirTela("produtos", submenuProdutos);
  });
}

// Se quiser abrir uma tela padrão ao carregar
// abrirTela("dashboard", null);


  // Se quiser abrir uma tela padrão ao carregar
  // abrirTela("dashboard", null);
});


// =========================
// PAINEL
// =========================
const painelMesas = document.getElementById("painelMesas");

// Cache local (estado atual das mesas)
const mesasCache = new Map();

// =========================
// FUNÇÃO PARA RETORNAR HORÁRIO DE SÃO PAULO
// =========================
function horaSP() {
  const agora = new Date();

  // Converte para horário de São Paulo (GMT-3)
  const utc = agora.getTime() + agora.getTimezoneOffset() * 60000;
  const fusoSP = utc - 3 * 60 * 60000; // GMT-3
  const dataSP = new Date(fusoSP);

  // Retorna no formato "YYYY-MM-DD HH:MM:SS"
  return dataSP.toISOString().replace("T", " ").slice(0, 19);
}

// =========================
// FUNÇÃO PARA RENDERIZAR MESA
// =========================
function renderizarMesa(mesa) {
  let mesaDiv = document.getElementById(`mesa-${mesa.id}`);
  const valorConsumido = mesa.valor ? mesa.valor.toFixed(2) : "0,00";
  const ocupada = mesa.cliente_presente === true;
  const atendida = mesa.atendida === true; // Verifica se já foi atendida

  // =========================
  // CRIA MESA SE NÃO EXISTIR
  // =========================
  if (!mesaDiv) {
    mesaDiv = document.createElement("div");
    mesaDiv.id = `mesa-${mesa.id}`;
    mesaDiv.className = `
      relative flex flex-col items-center justify-start
      cursor-pointer transition-transform hover:scale-105
    `;

    mesaDiv.innerHTML = `
      <!-- MONITOR -->
      <div class="monitor 
        w-full h-28 rounded-md 
        flex flex-col items-center justify-between
        border-2 border-black shadow-md
      ">
        <div class="titulo w-full text-center text-xs font-bold bg-black text-white py-1">
          Mesa ${String(mesa.numero).padStart(3, "0")}
        </div>

        <div class="status-text text-sm font-bold mt-2">
          ${ocupada ? "OCUPADA" : "LIVRE"}
        </div>

        <div class="valor text-xs font-semibold mb-2">
          R$ ${valorConsumido}
        </div>
      </div>

      <!-- SUPORTE -->
      <div class="base w-6 h-3 bg-black mt-1 rounded-sm"></div>
      <div class="haste w-1 h-3 bg-black"></div>
      <div class="base-final w-10 h-2 bg-black rounded-sm"></div>
    `;

    // =========================
    // CLIQUE PARA ALTERAR STATUS
    // =========================
    mesaDiv.addEventListener("click", async () => {
      const mesaAtual = mesasCache.get(mesa.id);
      const novoStatus = !mesaAtual.cliente_presente;

      // Atualiza visual imediatamente
      atualizarStatusVisual(mesaDiv, novoStatus, mesaAtual.atendida);

      // Atualiza cache local
      mesasCache.set(mesa.id, {
        ...mesaAtual,
        cliente_presente: novoStatus,
      });

      // Define hora_ocupada: se ocupada → registra hora, se livre → apaga
      const horaAtual = novoStatus ? horaSP() : null;

      const { error } = await supabase
        .from("mesas")
        .update({ 
          cliente_presente: novoStatus,
          hora_ocupada: horaAtual
        })
        .eq("id", mesa.id);

      if (error) {
        console.error("Erro ao atualizar mesa:", error);
        // Reverte visual se houver erro
        atualizarStatusVisual(mesaDiv, !novoStatus, mesaAtual.atendida);
      }
    });

    painelMesas.appendChild(mesaDiv);

  } else {
    // =========================
    // ATUALIZA VALORES EXISTENTES
    // =========================
    mesaDiv.querySelector(".titulo").textContent =
      `Mesa ${String(mesa.numero).padStart(3, "0")}`;
    mesaDiv.querySelector(".valor").textContent = `R$ ${valorConsumido}`;
    atualizarStatusVisual(mesaDiv, ocupada, atendida);

    // Atualiza hora_ocupada automaticamente só se mesa estiver ocupada e não tiver hora registrada
    if (ocupada && !mesa.hora_ocupada) {
      const horaAtual = horaSP();
      supabase
        .from("mesas")
        .update({ hora_ocupada: horaAtual })
        .eq("id", mesa.id)
        .then(({ error }) => {
          if (error) console.error("Erro ao atualizar hora_ocupada:", error);
        });
    }
  }
}


// =========================
// ATUALIZA STATUS VISUAL
// =========================
function atualizarStatusVisual(mesaDiv, ocupada, atendida = true) {
  const monitor = mesaDiv.querySelector(".monitor");
  const statusText = mesaDiv.querySelector(".status-text");

  // Remove todas as cores e alertas antes de aplicar novas
  monitor.classList.remove("bg-red-600", "bg-blue-800", "alerta-piscar");

  if (ocupada) {
    if (!atendida) {
      // Mesa ocupada mas não atendida → cor alerta piscando (ex: laranja)
      monitor.classList.add("alerta-piscar");
    } else {
      // Mesa ocupada e atendida → vermelho normal
      monitor.classList.add("bg-red-600");
    }
    statusText.textContent = "OCUPADA";
  } else {
    // Mesa livre → azul
    monitor.classList.add("bg-blue-800");
    statusText.textContent = "LIVRE";
  }
}





// =========================
// FUNÇÃO PARA CARREGAR MESAS
// =========================
async function carregarMesas() {
  // =========================
  // CONFIGURA GRID E GAP CORRETO
  // =========================
  painelMesas.className =
    "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 p-6";

  try {
    const { data: mesas, error } = await supabase
      .from("mesas")
      .select("*")
      .order("numero", { ascending: true });

    if (error) {
      console.error("Erro ao buscar mesas:", error);
      return;
    }

    mesas.forEach((mesa) => {
      mesasCache.set(mesa.id, mesa);
      renderizarMesa(mesa);
    });
  } catch (err) {
    console.error("Erro ao carregar mesas:", err);
  }
}

// =========================
// ATUALIZAÇÃO AUTOMÁTICA A CADA 3 SEGUNDOS
// =========================
setInterval(async () => {
  const { data: mesas, error } = await supabase
    .from("mesas")
    .select("*")
    .order("numero", { ascending: true });

  if (!error && mesas) {
    mesas.forEach((mesaAtualizada) => {
      mesasCache.set(mesaAtualizada.id, mesaAtualizada);
      renderizarMesa(mesaAtualizada);
    });
  }
}, 3000); // 3000ms = 3 segundos

// =========================
// INICIALIZA
// =========================
carregarMesas();
// =========================
// REALTIME (atualiza só o que mudou)
// =========================
supabase
  .channel("mesas-realtime")
  .on(
    "postgres_changes",
    { event: "UPDATE", schema: "public", table: "mesas" },
    (payload) => {
      const mesa = payload.new;
      mesasCache.set(mesa.id, mesa);
      renderizarMesa(mesa);
    }
  )
  .subscribe();

// =========================
// INICIAR
// =========================
carregarMesas();

// =========================
// Inicial
// =========================


// =========================
// Campos do formulário
// =========================
const numeroMesaInput = document.getElementById("numeroMesa");
console.log("Input numeroMesa:", numeroMesaInput);
const capacidadeInput = document.getElementById("capacidadeMesa");
const descricaoInput = document.getElementById("descricaoMesa");
const localizacaoInput = document.getElementById("localizacaoMesa");
const ativoInput = document.getElementById("ativoMesa");
const observacoesInput = document.getElementById("observacoesMesa");

const form = document.getElementById("formCadastroMesas");
const qrcodeContainer = document.getElementById("qrcodeContainer");
const qrcodeWrapper = document.getElementById("qrcodeWrapper");
const btnSalvarQR = document.getElementById("btnSalvarQR");
const btnImprimirQR = document.getElementById("btnImprimirQR");
const btnGerarQR = document.getElementById("btnGerarQR");

let qrCodeInstance = null;
let qrGerado = false;
let qrLinkGerado = "";

// =========================
// Gera próximo número da mesa
// =========================
async function gerarNumeroMesa() {
  if (!numeroMesaInput) {
    console.error("Campo numeroMesa não encontrado");
    return;
  }

  try {
    const { data, error } = await supabase
      .from("mesas")
      .select("numero")
      .order("numero", { ascending: false })
      .limit(1);

    if (error) throw error;

    numeroMesaInput.value =
      data.length === 0 ? 1 : Number(data[0].numero) + 1;

    console.log("Número da mesa gerado:", numeroMesaInput.value);

  } catch (err) {
    console.error("Erro ao gerar número da mesa:", err);
    numeroMesaInput.value = 1;
  }
}

// =========================
// Limpar formulário (não limpa QR)
// =========================
function limparFormulario() {
  capacidadeInput.value = "";
  descricaoInput.value = "";
  localizacaoInput.value = "";
  observacoesInput.value = "";
  ativoInput.checked = true;
  qrGerado = false;
}

// =========================
// Gerar QR Code (COM LINK)
// =========================
btnGerarQR.addEventListener("click", () => {
  const capacidade = parseInt(capacidadeInput.value);
  const numeroMesa = numeroMesaInput.value;

  if (!capacidade || capacidade < 1) {
    alert("Informe uma capacidade válida antes de gerar o QR Code.");
    return;
  }

  // 🔗 LINK FINAL DO QR CODE
  qrLinkGerado = `https://daniel2025mar.github.io/Cardapio-Demo-V2/painel/ativar_mesa.html?mesa=${numeroMesa}`;

  qrcodeContainer.innerHTML = "";

  qrCodeInstance = new QRCode(qrcodeContainer, {
    text: qrLinkGerado,
    width: 192,
    height: 192,
    colorDark: "#1f2937",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  qrcodeWrapper.classList.remove("hidden");
  qrGerado = true;

  alert("QR Code gerado! Agora clique em 'Salvar Mesa' para cadastrar.");
});

// =========================
// Salvar mesa (somente se QR gerado)
// =========================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!qrGerado) {
    alert("Você precisa gerar o QR Code antes de salvar a mesa!");
    return;
  }

  const novoNumero = parseInt(numeroMesaInput.value);
  const capacidade = parseInt(capacidadeInput.value);

  try {
    const { error } = await supabase.from("mesas").insert([
      {
        numero: novoNumero,
        capacidade: capacidade,
        descricao: descricaoInput.value,
        localizacao: localizacaoInput.value,
        observacoes: observacoesInput.value,
        ativo: ativoInput.checked,
        cliente_presente: false,
        qrcode: qrLinkGerado
      }
    ]);

    if (error) throw error;

    alert(
      `Mesa ${novoNumero} cadastrada com sucesso!\nO QR Code permanece visível para salvar ou imprimir.`
    );

    gerarNumeroMesa();
    limparFormulario();
  } catch (err) {
  console.error("Erro detalhado ao salvar mesa:", err);

  let mensagem = "Não foi possível salvar a mesa.";

  // Erro específico: número duplicado
  if (err?.code === "23505") {
    mensagem =
      "Já existe uma mesa com este número.\n\n" +
      "Atualize a página e tente novamente.";
  }
  // Erro vindo do Supabase
  else if (err?.message) {
    mensagem =
      "Ocorreu um erro inesperado.\n\n" +
      "Detalhes técnicos:\n" +
      err.message;
  }

  mostrarModalErro(mensagem, "Erro ao salvar mesa");
}


});

// =========================
// Salvar QR Code como imagem
// =========================
btnSalvarQR.addEventListener("click", () => {
  if (!qrCodeInstance) return;

  const img = qrcodeContainer.querySelector("img");
  if (!img) return alert("QR Code ainda não gerado.");

  const link = document.createElement("a");
  link.href = img.src;
  link.download = `Mesa_${numeroMesaInput.value}.png`;
  link.click();
});

// =========================
// Imprimir QR Code
// =========================
btnImprimirQR.addEventListener("click", () => {
  if (!qrCodeInstance) return;

  const img = qrcodeContainer.querySelector("img");
  if (!img) return alert("QR Code ainda não gerado.");

  const w = window.open("");
  w.document.write(`<img src="${img.src}" style="width:300px;height:300px;">`);
  w.print();
  w.close();
});

// =========================
// Botão Limpar
// =========================
document
  .getElementById("btnLimparMesas")
  .addEventListener("click", limparFormulario);
// =============================
// DOM READY
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modalClientes");
  const lista = document.getElementById("listaClientes");
  const btnFechar = modal.querySelector(".modal-fechar");
  const inputBusca = document.getElementById("buscarCliente");

  let clientesCache = [];

  // =============================
  // NORMALIZAR TEXTO (IGNORAR ACENTO)
  // =============================
  function normalizarTexto(texto) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  // =============================
  // OBSERVA ABERTURA DO MODAL
  // =============================
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.attributeName === "class" &&
        modal.classList.contains("ativo")
      ) {
        carregarClientes();
      }
    });
  });

  observer.observe(modal, { attributes: true });

  // =============================
  // FECHAR MODAL
  // =============================
  btnFechar.addEventListener("click", () => {
    modal.classList.remove("ativo");
    inputBusca.value = "";
  });

  // =============================
  // CARREGAR CLIENTES (SUPABASE)
  // =============================
  async function carregarClientes() {
    lista.innerHTML = "<p>Carregando clientes...</p>";

    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("nome")
        .order("nome", { ascending: true });

      if (error) {
        console.error(error);
        lista.innerHTML = "<p>Erro ao carregar clientes.</p>";
        return;
      }

      if (!data || data.length === 0) {
        lista.innerHTML = "<p>Nenhum cliente encontrado.</p>";
        return;
      }

      clientesCache = data;
      renderizarClientes(data);
    } catch (err) {
      console.error(err);
      lista.innerHTML = "<p>Erro inesperado.</p>";
    }
  }

  // =============================
  // RENDERIZAR CLIENTES
  // =============================
  function renderizarClientes(clientes) {
    lista.innerHTML = "";

    if (clientes.length === 0) {
      lista.innerHTML =
        '<p class="cliente-vazio">Nenhum cliente encontrado.</p>';
      return;
    }

    clientes.forEach((cliente) => {
      const item = document.createElement("div");
      item.className = "cliente-item";

      const nome = document.createElement("strong");
      nome.textContent = cliente.nome;

      const info = document.createElement("span");
      info.textContent = "Cliente cadastrado no sistema";

      item.appendChild(nome);
      item.appendChild(info);
      lista.appendChild(item);
    });
  }

  // =============================
  // BUSCA EM TEMPO REAL
  // =============================
  inputBusca.addEventListener("input", () => {
    const termoDigitado = normalizarTexto(inputBusca.value);

    if (!termoDigitado) {
      renderizarClientes(clientesCache);
      return;
    }

    const filtrados = clientesCache.filter((cliente) =>
      normalizarTexto(cliente.nome).includes(termoDigitado)
    );

    renderizarClientes(filtrados);
  });
});

//atualizaçao de taxa de entrega
// =============================
// ALTERAR TAXA DE ENTREGA
// =============================

const inputTaxa = document.getElementById("inputTaxaEntrega");
const btnSalvarTaxa = document.getElementById("btnSalvarTaxa");
const msgTaxa = document.getElementById("msgTaxa");

// guarda o valor atual vindo do banco
let valorAtualTaxa = null;

/* =============================
   CARREGAR TAXA AO ABRIR
============================= */
async function carregarTaxaEntrega() {
  const { data, error } = await supabase
    .from("taxa")
    .select("valor")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Erro ao carregar taxa:", error);
    return;
  }

  valorAtualTaxa = Number(data.valor);
  inputTaxa.value = valorAtualTaxa.toFixed(2);
}

carregarTaxaEntrega();

/* =============================
   SALVAR NOVA TAXA
============================= */
btnSalvarTaxa.addEventListener("click", async () => {
  const novoValor = parseFloat(inputTaxa.value);

  // validação básica
  if (isNaN(novoValor) || novoValor < 0) {
    mostrarErroTaxa("Informe um valor válido para a taxa.");
    return;
  }

  // 🚫 valor igual ao atual
  if (novoValor === valorAtualTaxa) {
    mostrarErroTaxa("O valor informado já é o valor atual da taxa.");
    return;
  }

  const { error } = await supabase
    .from("taxa")
    .update({ valor: novoValor })
    .eq("id", 1);

  if (error) {
    console.error("Erro ao atualizar taxa:", error);
    mostrarErroTaxa("Erro ao salvar a taxa.");
    return;
  }

  // atualiza valor local
  valorAtualTaxa = novoValor;

  mostrarSucessoTaxa();
});

/* =============================
   FEEDBACK VISUAL
============================= */
function mostrarSucessoTaxa() {
  msgTaxa.textContent = "✔ Taxa atualizada com sucesso!";
  msgTaxa.classList.remove("hidden");
  msgTaxa.classList.remove("text-red-600");
  msgTaxa.classList.add("text-green-600");

  setTimeout(() => {
    msgTaxa.classList.add("hidden");
  }, 3000);
}

function mostrarErroTaxa(mensagem) {
  msgTaxa.textContent = mensagem;
  msgTaxa.classList.remove("hidden");
  msgTaxa.classList.remove("text-green-600");
  msgTaxa.classList.add("text-red-600");

  setTimeout(() => {
    msgTaxa.classList.add("hidden");
  }, 4000);
}

//funçao onde mostra a informaçoes do desenvolvedor

document.addEventListener('DOMContentLoaded', () => {
  // Seleciona elementos
  const logoClick = document.getElementById('logoClick');
  const modalSobre = document.getElementById('modalSobre');
  const btnFechar = document.getElementById('btnFecharModal');

  if (!logoClick || !modalSobre || !btnFechar) {
    console.error('Elementos do modal não encontrados.');
    return;
  }

  // Abrir modal ao clicar na logo
  logoClick.addEventListener('click', () => {
    modalSobre.classList.remove('hidden');
  });

  // Fechar modal ao clicar no botão X
  btnFechar.addEventListener('click', (e) => {
    e.stopPropagation(); // impede o clique de "subir" para o modal
    modalSobre.classList.add('hidden');
  });

  // Fechar modal ao clicar fora da caixa
  modalSobre.addEventListener('click', (e) => {
    if (e.target === modalSobre) {
      modalSobre.classList.add('hidden');
    }
  });
});


// Elementos do modal
const modal = document.getElementById('modalFeedback');
const fecharModal = document.getElementById('fecharModal'); 
const cancelarBtn = modal.querySelector('button.bg-gray-200'); 
const enviarBtn = modal.querySelector('button.bg-blue-600');
const estrelas = document.querySelectorAll('.estrela');
const feedbackInput = document.getElementById('feedbackInput');
let avaliacao = 0;

// Nome do usuário e empresa (exemplo: podem vir do login ou do sistema)
const nomeUsuario = localStorage.getItem('nomeUsuario') || "Usuário Desconhecido";
const nomeEmpresa = localStorage.getItem('nomeEmpresa') || "Empresa Desconhecida";

// Mensagem de feedback textual
let msgAvaliacao = document.getElementById('msgAvaliacao');
if(!msgAvaliacao){
  msgAvaliacao = document.createElement('p');
  msgAvaliacao.id = 'msgAvaliacao';
  msgAvaliacao.className = 'text-center text-gray-600 mb-4 font-medium';
  const estrelasContainer = document.getElementById('estrelas');
  estrelasContainer.parentNode.insertBefore(msgAvaliacao, estrelasContainer.nextSibling);
}

// Mensagens por nota
const feedbackText = {
  1: "Muito Ruim 😞",
  2: "Ruim 😕",
  3: "Regular 😐",
  4: "Bom 🙂",
  5: "Muito Bom 😄"
};

// ===========================
// Abrir modal apenas 1 vez por mês
// ===========================
function abrirModalSeNaoVistoEsteMes() {
  const hoje = new Date();
  const anoMesAtual = `${hoje.getFullYear()}-${hoje.getMonth() + 1}`; // Ex: "2026-1"

  const ultimaExibicao = localStorage.getItem('ultimaExibicaoFeedback');

  if(ultimaExibicao !== anoMesAtual){
    modal.classList.remove('hidden');
    localStorage.setItem('ultimaExibicaoFeedback', anoMesAtual);
  }
}
window.addEventListener('load', abrirModalSeNaoVistoEsteMes);

// ===========================
// Fechar modal
// ===========================
fecharModal.addEventListener('click', () => modal.classList.add('hidden'));
cancelarBtn.addEventListener('click', () => modal.classList.add('hidden'));
window.addEventListener('click', e => { if(e.target === modal) modal.classList.add('hidden') });

// ===========================
// Atualiza estrelas com efeito
// ===========================
function atualizarEstrelas(nota){
  estrelas.forEach((estrela, index) => {
    if(index < nota){
      estrela.classList.remove('text-gray-300');
      estrela.classList.add('text-blue-500', 'scale-110'); // efeito escala
    } else {
      estrela.classList.remove('text-blue-500', 'scale-110');
      estrela.classList.add('text-gray-300');
    }
  });
  msgAvaliacao.textContent = nota ? feedbackText[nota] : '';
}

// Eventos das estrelas
estrelas.forEach((estrela, index) => {
  // Hover: cresce levemente
  estrela.addEventListener('mouseover', () => {
    estrela.classList.add('scale-125', 'transition-transform', 'duration-200');
    atualizarEstrelas(index + 1);
  });

  estrela.addEventListener('mouseout', () => {
    estrela.classList.remove('scale-125');
    atualizarEstrelas(avaliacao);
  });

  // Click: define avaliação com efeito “bounce”
  estrela.addEventListener('click', () => {
    avaliacao = index + 1;
    atualizarEstrelas(avaliacao);
    estrela.classList.add('animate-bounce');
    setTimeout(() => estrela.classList.remove('animate-bounce'), 500);
    console.log("Avaliação:", avaliacao);
  });
});

// ===========================
// Envio do feedback para Supabase
// ===========================
enviarBtn.addEventListener('click', async () => {
  const mensagem = feedbackInput.value;

  if(avaliacao === 0){
    alert("Por favor, selecione uma avaliação de 1 a 5 estrelas.");
    return;
  }

  // Informações adicionais do usuário
  const navegador = navigator.userAgent;
  const sistema_operacional = navigator.platform;
  const url_pagina = window.location.href;

  let dispositivo = "Desktop";
  if(/Mobi|Android/i.test(navigator.userAgent)) dispositivo = "Mobile";
  if(/iPad|Tablet/i.test(navigator.userAgent)) dispositivo = "Tablet";

  try {
    const { data, error } = await supabase
      .from('feedbacks')
      .insert([{
        usuario: nomeUsuario,
        empresa: nomeEmpresa,
        avaliacao: avaliacao,
        mensagem: mensagem,
        navegador: navegador,
        sistema_operacional: sistema_operacional,
        url_pagina: url_pagina,
        dispositivo: dispositivo
      }]);

    if(error){
      console.error(error);
      alert("Erro ao enviar o feedback. Tente novamente.");
    } else {
      alert("Obrigado pelo seu feedback!");
      modal.classList.add('hidden');
      feedbackInput.value = "";
      atualizarEstrelas(0);
      avaliacao = 0;
    }
  } catch(err){
    console.error(err);
    alert("Erro ao enviar o feedback. Verifique sua conexão.");
  }
});

//funçao para atualizar o pedido delivery

async function atualizarPedidosDelivery() {
  const { count, error } = await supabase
    .from('pedidos')
    .select('id', { count: 'exact', head: true })
    .eq('tipo_entrega', 'delivery')

  if (error) {
    console.error('Erro ao buscar pedidos delivery:', error)
    return
  }

  const card = document.getElementById('cardPedidosDelivery')
  if (card) {
    card.textContent = count ?? 0
  }
}

// 🔄 Atualização em tempo real
supabase
  .channel('pedidos-delivery-realtime')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'pedidos',
      filter: 'tipo_entrega=eq.delivery'
    },
    (payload) => {
      console.log('Pedido delivery alterado:', payload)
      atualizarPedidosDelivery()
    }
  )
  .subscribe()

// 🚀 Atualiza ao abrir o dashboard
document.addEventListener('DOMContentLoaded', () => {
  atualizarPedidosDelivery()
})
