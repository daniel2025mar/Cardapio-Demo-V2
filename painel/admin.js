 // =============================
//   CONFIGURAÇÃO DO SUPABASE
// =============================
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYWtibmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
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
  produtos: "produtos",
  pedidos: "pedidos",
  clientes: "clientes",
  "funcionários": "funcionarios",
  funcionarios: "funcionarios"
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
  // BUSCA USUÁRIO LOGADO
  // ================================
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
// Objeto global para armazenar permissões detalhadas
let permissoesDetalhadas = {};
function aplicarPermissoes(usuario) {
  const permissoes = usuario.permissoes || [];
  window.permissoesDetalhadas = usuario.permissoes_detalhadas || {}; // global para usar no carregarClientes

  // Atualiza nome do usuário no header
  const userSpan = document.querySelector("header span");
  if (userSpan) userSpan.textContent = usuario.username;

  // Esconde todas as seções e menus inicialmente
  document.querySelectorAll(".content-section").forEach(sec => sec.style.display = "none");
  document.querySelectorAll("aside nav label").forEach(label => label.style.display = "none");

  // Verifica se é Acesso Total
  const isAcessoTotal = permissoes.includes("Acesso Total");

  // Se tiver "Acesso Total", libera tudo e não bloqueia botões
  if (isAcessoTotal) {
    document.querySelectorAll(".content-section").forEach(sec => sec.style.display = "block");
    document.querySelectorAll("aside nav label").forEach(label => label.style.display = "flex");
    abrirDashboard();
    ativarMenu();
    ativarMenuConfiguracoes();

    // Usuário com Acesso Total tem todas as permissões
    window.permissoesDetalhadas["Acesso Total"] = { excluir: true, bloquear: true, editar: true };
    return;
  }

  // Mapeia permissões do banco para os IDs das seções
  const PERMISSAO_MAP = {
    "acesso_dashboard": "dashboard",
    "acesso_clientes": "clientes",
    "acesso_pedidos": "pedidos",
    "acesso_produtos": "produtos",
    "acesso_funcionarios": "funcionarios",
    "acesso_relatorios": "relatorios",
    "acesso_configuracoes": "configuracoes"
  };

  permissoes.forEach(p => {
    const secaoID = PERMISSAO_MAP[p];
    if (!secaoID) return;

    const secao = document.getElementById(secaoID);
    if (secao) secao.style.display = "block";

    const menuItem = Array.from(document.querySelectorAll("aside nav label")).find(label => label.dataset.menu === secaoID);
    if (menuItem) menuItem.style.display = "flex";
  });

  const primeiraSecao = document.querySelector(".content-section[style*='display: block']");
  if (primeiraSecao) {
    document.querySelectorAll(".content-section").forEach(sec => sec.style.display = "none");
    primeiraSecao.style.display = "block";
  }

  ativarMenu();
  ativarMenuConfiguracoes();

  // =====================================
  // Define permissoes para buttons baseado na permissão
  // =====================================
  if (permissoes.includes("acesso_clientes") && !isAcessoTotal) {
    // Usuário com apenas acesso_clientes: bloqueia excluir e bloquear
    window.permissoesDetalhadas["acesso_clientes"] = { editar: true, excluir: false, bloquear: false };
  }
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
      const secaoID = MENU_MAP[textoMenu];
      if (!secaoID) return;

      sections.forEach(sec => sec.style.display = "none");
      const target = document.getElementById(secaoID);
      if (target) target.style.display = "block";

      labels.forEach(l => l.classList.remove("active"));
      label.classList.add("active");

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

    lista.innerHTML = "";

    // 🔥 Mapa de UP para exibição correta
    const mapaUP = {
      1: "MG",
      2: "SP",
      3: "RJ",
      "1": "MG",
      "2": "SP",
      "3": "RJ"
    };

    // Checa se o usuário tem apenas acesso_clientes
    const permissoesCliente = window.permissoesDetalhadas["acesso_clientes"];
    const isAcessoClienteExclusivo = permissoesCliente && Object.keys(window.permissoesDetalhadas).length === 1;

    clientes.forEach((cliente, index) => {

      // 🔥 Corrige a exibição do campo UP
      const upFormatado =
        mapaUP[cliente.up] !== undefined ? mapaUP[cliente.up] : cliente.up || "—";

      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-50";
      if (cliente.bloqueado) tr.classList.add("bg-red-50");

      tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${index + 1}</td>

        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          ${cliente.nome || "—"}
          ${cliente.bloqueado ? '<span class="ml-2 px-2 py-0.5 bg-red-200 text-red-800 text-xs rounded-full">Bloqueado</span>' : ''}
        </td>

        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${cliente.telefone || "—"}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${cliente.cidade || "—"}</td>

        <!-- 🔥 Agora exibe corretamente MG -->
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${upFormatado}</td>

        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center space-x-2">
          <button class="btn-editar px-2 py-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded text-xs font-semibold">Editar</button>
          <button class="btn-excluir px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold">Excluir</button>
          <button class="btn-bloquear px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-semibold">
            ${cliente.bloqueado ? 'Desbloquear' : 'Bloquear'}
          </button>
        </td>
      `;

      const btnEditar = tr.querySelector(".btn-editar");
      const btnExcluir = tr.querySelector(".btn-excluir");
      const btnBloquear = tr.querySelector(".btn-bloquear");

      // Botão Editar sempre funciona se permitido
      btnEditar.addEventListener("click", () => {
        if (!isAcessoClienteExclusivo || permissoesCliente.editar) {
          editarCliente(cliente.id);
        } else {
          mostrarToast("Você não tem permissão para editar.", "bg-red-600");
        }
      });

      // Excluir somente para quem não é acesso_exclusivo
      btnExcluir.addEventListener("click", (e) => {
        if (isAcessoClienteExclusivo) {
          e.preventDefault();
          mostrarToast("Você não tem permissão para excluir.", "bg-red-600");
        } else {
          if (confirm(`Deseja realmente excluir ${cliente.nome || "—"}?`)) {
            excluirCliente(cliente.id);
          }
        }
      });

      btnBloquear.addEventListener("click", (e) => {
        if (isAcessoClienteExclusivo) {
          e.preventDefault();
          mostrarToast("Você não tem permissão.", "bg-red-600");
        } else {
          bloquearCliente(cliente.id, cliente.bloqueado);
        }
      });

      lista.appendChild(tr);
    });

    if (!clientes || clientes.length === 0) {
      lista.innerHTML = `<tr><td colspan="6" class="text-gray-400 text-center py-4">Nenhum cliente encontrado.</td></tr>`;
    }

  } catch (err) {
    console.error("Erro ao carregar clientes:", err);
    lista.innerHTML = `<tr><td colspan="6" class="text-red-500 text-center py-4">Erro ao carregar clientes.</td></tr>`;
  }
}


// DOM carregado
document.addEventListener("DOMContentLoaded", () => {
  carregarClientes();

  const btnCadastrar = document.getElementById("btn-cadastrar-cliente");
  if (btnCadastrar) {
    btnCadastrar.addEventListener("click", () => {
      alert("Abrir formulário de cadastro de cliente (implementação futura)");
    });
  }
});


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

  // Buscar cliente
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

  // Preenche os campos básicos
  document.getElementById("edit-id").value = cliente.id;
  document.getElementById("edit-nome").value = cliente.nome || "";
  document.getElementById("edit-telefone").value = cliente.telefone || "";

  // =============================
  //     🔥 CARREGAR ESTADOS
  // =============================
  const estados = await carregarEstadosEditar();

  let estadoId = null;

  // Caso UP seja número (ID)
  if (cliente.up && /^\d+$/.test(String(cliente.up))) {
    estadoId = Number(cliente.up);
  }
  // Caso UP seja sigla
  else if (cliente.up && isNaN(cliente.up)) {
    estadoId = await buscarEstadoIdPorSigla(cliente.up);
  }

  // =============================
  // SE cliente NÃO tem estado → aparece "Selecione..."
  // SE tem estado → selecionar estado normalmente
  // =============================
  if (estadoId) {
    document.getElementById("edit-up").value = estadoId;

    // Carrega as cidades do estado normalmente
    await carregarCidadesPorEstadoEditar(estadoId);

    // Se tiver cidade cadastrada → seleciona
    if (cliente.cidade) {
      document.getElementById("edit-cidade").value = cliente.cidade;
    }

  } else {
    // Cliente NÃO tem estado cadastrado
    document.getElementById("edit-up").value = "";
    document.getElementById("edit-cidade").innerHTML =
      '<option value="">Selecione</option>';
  }

  // Abrir modal
  document.getElementById("modal-editar-cliente").classList.remove("hidden");
  document.getElementById("modal-editar-cliente").classList.add("flex");
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
//     🔥 CARREGAR CIDADES
// =============================
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

  const selectCidade = document.getElementById("edit-cidade");
  selectCidade.innerHTML = '<option value="">Selecione</option>';

  data.forEach(cidade => {
    const opt = document.createElement("option");
    opt.value = cidade.nome;
    opt.textContent = cidade.nome;
    selectCidade.appendChild(opt);
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

      const usuario = f.usuario_id?.[0];
      let permissoesLiberadas = [];
      if (usuario && Array.isArray(usuario.permissoes)) {
        permissoesLiberadas = usuario.permissoes;
      } else if (usuario && typeof usuario?.permissoes === "string") {
        try { permissoesLiberadas = JSON.parse(usuario.permissoes); } catch(e){ permissoesLiberadas = []; }
      }

      let permText = usuario?.username?.toLowerCase() === "admin"
        ? "Acesso Total"
        : (permissoesLiberadas.length ? permissoesLiberadas.join(", ") : "-");

      const perm = document.createElement("span");
      perm.classList.add("text-sm", "text-gray-600");
      perm.textContent = permText;

      nomeDiv.appendChild(nome);
      nomeDiv.appendChild(perm);
      div.appendChild(nomeDiv);

      // Botões (não mostrar para admin)
      if (usuario?.username?.toLowerCase() !== "admin") {
        const botoesDiv = document.createElement("div");
        botoesDiv.classList.add("flex", "gap-2");

        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.classList.add("px-3", "py-1", "bg-blue-500", "hover:bg-blue-600", "text-white", "rounded", "text-sm");
        btnEditar.addEventListener("click", () => abrirModalEdicao(f));

        // Bloquear / Desbloquear
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

              // Mensagens corrigidas
              let mensagem = "";
              if (acao === "bloquear") mensagem = "Funcionário bloqueado com sucesso!";
              else if (acao === "desbloquear") mensagem = "Funcionário desbloqueado com sucesso!";
              mostrarNotificacao(mensagem, "sucesso");

              listarFuncionarios();
            } catch (err) {
              console.error(`Erro ao ${acao} funcionário:`, err);
              mostrarNotificacao(`Erro ao ${acao} funcionário!`, "erro");
            }
          });
        });

        // Excluir
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

  console.log("➡️ Dados capturados do formulário:", { nome, usuario, senha, email });

  try {
    let funcionarioId;
    let usuarioId;

    // =============================
    // 1️⃣ Capturar permissões como ARRAY
    // =============================
    const permissoes = [];
    const checkboxes = [
      { id: "permAcessoTotal", valor: "Acesso Total" },
      { id: "permClientes", valor: "acesso_clientes" },
      { id: "permPedidos", valor: "acesso_pedidos" },
      { id: "permProdutos", valor: "acesso_produtos" },
      { id: "permFuncionarios", valor: "acesso_funcionarios" },
      { id: "permRelatorios", valor: "acesso_relatorios" }
    ];

    checkboxes.forEach(item => {
      const chk = document.getElementById(item.id);
      if (chk && chk.checked) {
        permissoes.push(item.valor);
      }
    });

    console.log("📌 Permissões selecionadas (ARRAY):", permissoes);

    if (formFuncionario.dataset.editingId) {
      // =============================
      // ATUALIZAR FUNCIONÁRIO EXISTENTE
      // =============================
      const idUsuario = formFuncionario.dataset.editingId;
      console.log("✏️ Atualizando usuário ID:", idUsuario);

      const { data: usuarioAtualizado, error: errorUsuario } = await supabase
        .from("usuarios")
        .update({
          username: usuario,
          password: senha,
          email: email,
          permissoes: permissoes // ← array de strings
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

    } else {
      // =============================
      // CADASTRAR NOVO FUNCIONÁRIO
      // =============================
      const { data: funcionarioData, error: errorFuncionario } = await supabase
        .from("funcionarios")
        .insert([{ nome_completo: nome }])
        .select();

      if (errorFuncionario) throw errorFuncionario;
      funcionarioId = funcionarioData[0].id;

      const { data: usuarioData, error: errorUsuario } = await supabase
        .from("usuarios")
        .insert([{
          id: crypto.randomUUID(),       // gera UUID
          username: usuario,
          password: senha,
          email: email || null,
          cargo: "Funcionário",
          funcionario_id: funcionarioId,
          permissoes: permissoes        // ← array de strings
        }])
        .select();

      if (errorUsuario) throw errorUsuario;
      usuarioId = usuarioData[0].id;
    }

    alert(formFuncionario.dataset.editingId ? "Funcionário atualizado com sucesso!" : "Funcionário cadastrado com sucesso!");
    formFuncionario.reset();
    delete formFuncionario.dataset.editingId;

    // Atualiza o painel imediatamente
    listarFuncionarios();

  } catch (err) {
    console.error("❌ ERRO FATAL AO SALVAR FUNCIONÁRIO:", err);
    alert("Erro ao salvar funcionário. Veja o console para detalhes.");
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

  // Abre o modal
  modal.classList.remove("hidden");

  // Função auxiliar para preencher campo se existir
  const setValue = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
  };

  const setChecked = (id, condition) => {
    const el = document.getElementById(id);
    if (el) el.checked = condition;
  };

  // Preenche campos do funcionário
  setValue("editarIdFuncionario", f.id);
  setValue("editarNomeFuncionario", f.nome_completo);

  // Busca usuário associado se f.usuarios não existir
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

  // Preenche campos do usuário se existir
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
  }

  // ==============================
  // FUNÇÃO PARA VISUALIZAR SENHA
  // ==============================
  const toggleSenha = document.getElementById("toggleSenha");
  const inputSenha = document.getElementById("editarSenhaFuncionario");
  const iconOlho = document.getElementById("iconOlho");

  // Remove event listener antigo para evitar duplicação
  toggleSenha.replaceWith(toggleSenha.cloneNode(true));
  const novoToggle = document.getElementById("toggleSenha");

  novoToggle.addEventListener("click", () => {
    if (inputSenha.type === "password") {
      inputSenha.type = "text";
      // Olho fechado (substitui paths)
      iconOlho.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.056 10.056 0 012.135-3.314M6.293 6.293l11.414 11.414"/>
      `;
    } else {
      inputSenha.type = "password";
      // Olho aberto
      iconOlho.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      `;
    }
  });
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

  // Monta array de permissões
  const permissoes = [];
  if (document.getElementById("editarPermAcessoTotal")?.checked) permissoes.push("Acesso Total");
  if (document.getElementById("editarPermClientes")?.checked) permissoes.push("acesso_clientes");
  if (document.getElementById("editarPermPedidos")?.checked) permissoes.push("acesso_pedidos");
  if (document.getElementById("editarPermProdutos")?.checked) permissoes.push("acesso_produtos");
  if (document.getElementById("editarPermFuncionarios")?.checked) permissoes.push("acesso_funcionarios");
  if (document.getElementById("editarPermRelatorios")?.checked) permissoes.push("acesso_relatorios");

  try {
    // 1️⃣ Atualiza funcionário
    const { error: errorFuncionario } = await supabase
      .from("funcionarios")
      .update({ nome_completo: nome })
      .eq("id", idFuncionario);
    if (errorFuncionario) throw errorFuncionario;

    // 2️⃣ Busca usuário associado ao funcionário
    const { data: usuarios, error: errorUsuarioFetch } = await supabase
      .from("usuarios")
      .select("*")
      .eq("funcionario_id", idFuncionario);

    if (errorUsuarioFetch) throw errorUsuarioFetch;

    const usuario = usuarios?.[0];
    if (!usuario) throw new Error("Usuário associado não encontrado");

    // 3️⃣ Atualiza usuário
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

    alert("Funcionário e usuário atualizados com sucesso!");
    document.getElementById("modal-editar-funcionario").classList.add("hidden");
    listarFuncionarios(); // atualiza tabela
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
  try {
    const { data, error } = await supabase
      .from("horarios_semana")
      .select("*");

    if (error) {
      console.error("Erro ao buscar horários:", error);
      return;
    }

    const diasMap = {
      "segunda": "seg",
      "terca": "ter",
      "terça": "ter",
      "quarta": "qua",
      "quinta": "qui",
      "sexta": "sex",
      "sabado": "sab",
      "sábado": "sab",
      "domingo": "dom"
    };

    // Resetar todos os dias
    Object.values(diasMap).forEach(id => {
      const checkbox = document.getElementById(id);
      const filete = document.querySelector(`#${id}_card .filete`);
      if (checkbox) checkbox.checked = false;
      if (filete) {
        filete.classList.remove("bg-blue-500");
        filete.classList.add("bg-red-500");
      }
      document.getElementById(`${id}_inicio`).value = "";
      document.getElementById(`${id}_fim`).value = "";
    });

    // Preencher com dados do banco
    data.forEach(item => {
      const dia = item.dia_semana?.toLowerCase();
      const id = diasMap[dia];
      if (!id) return;

      const checkbox = document.getElementById(id);
      const filete = document.querySelector(`#${id}_card .filete`);
      const inicio = document.getElementById(`${id}_inicio`);
      const fim = document.getElementById(`${id}_fim`);

      if (checkbox) checkbox.checked = !!item.hora_inicio || !!item.hora_fim;

      if (filete) {
        if (checkbox.checked) {
          filete.classList.remove("bg-red-500");
          filete.classList.add("bg-blue-500");
        } else {
          filete.classList.remove("bg-blue-500");
          filete.classList.add("bg-red-500");
        }
      }

      if (inicio) inicio.value = item.hora_inicio ? item.hora_inicio.slice(0,5) : "";
      if (fim) fim.value = item.hora_fim ? item.hora_fim.slice(0,5) : "";
    });

  } catch (e) {
    console.error("Falha ao carregar horários:", e);
  }
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

  alert("Configurações salvas com sucesso!");
}

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
      { id: "permRelatorios", valor: "acesso_relatorios" }
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

// Seleciona os elementos
const btnNotificacoes = document.getElementById('btn-notificacoes');
const balao = document.getElementById('balao-notificacoes');
const contador = document.getElementById('contador-notificacoes');
const lista = document.getElementById('lista-notificacoes');
const btnLimpar = document.getElementById('btnLimpar');

// Exemplo de notificações
let notificacoes = [
  "Novo pedido recebido!",
  "Usuário X se registrou.",
  "Atualização disponível."
];

// Função para atualizar o contador
function atualizarContador() {
  if (notificacoes.length > 0) {
    contador.textContent = notificacoes.length;
    contador.classList.remove('hidden'); // mostra o contador
  } else {
    contador.classList.add('hidden'); // esconde o contador
  }
}

// Função para preencher a lista do balão com hover azul
function atualizarLista() {
  lista.innerHTML = ''; // limpa a lista
  notificacoes.forEach(n => {
    const li = document.createElement('li');
    li.textContent = n;
    li.className = "px-4 py-2 hover:bg-blue-600 cursor-pointer"; // hover azul
    lista.appendChild(li);
  });
}

// Função para limpar as notificações
btnLimpar.addEventListener('click', () => {
  notificacoes = []; // limpa o array de notificações
  atualizarLista();  // atualiza a lista (fica vazia)
  atualizarContador(); // zera o contador
});

// Mostra ou esconde o balão ao clicar no botão
btnNotificacoes.addEventListener('click', () => {
  atualizarLista(); // atualiza a lista ao abrir
  balao.classList.toggle('hidden'); // alterna visibilidade
});

// Fecha o balão ao clicar fora dele
document.addEventListener('click', (e) => {
  if (!btnNotificacoes.contains(e.target) && !balao.contains(e.target)) {
    balao.classList.add('hidden');
  }
});

// Atualiza o contador ao carregar a página
atualizarContador();
