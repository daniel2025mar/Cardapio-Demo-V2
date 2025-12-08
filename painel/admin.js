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

      // ================================
      // Formata horário corretamente (HH:MM)
      // ================================
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
      .select("*")
      .order("nome", { ascending: true });

    if (error) throw error;

    lista.innerHTML = "";

    // Checa se o usuário tem apenas acesso_clientes
    const permissoesCliente = window.permissoesDetalhadas["acesso_clientes"];
    const isAcessoClienteExclusivo = permissoesCliente && Object.keys(window.permissoesDetalhadas).length === 1;

    clientes.forEach((cliente, index) => {
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
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${cliente.up || "—"}</td>
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

      // Bloquear apenas se usuário tiver somente acesso_clientes
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

  // Busca o cliente no Supabase
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

  // Preenche os campos do modal
  document.getElementById("edit-id").value = cliente.id;
  document.getElementById("edit-nome").value = cliente.nome || "";
  document.getElementById("edit-telefone").value = cliente.telefone || "";
  document.getElementById("edit-cidade").value = cliente.cidade || "";
  document.getElementById("edit-up").value = cliente.up || "";

  // Abre o modal
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


// Eventos dos botões de fechar
document.getElementById("fechar-modal-editar").addEventListener("click", fecharModalEditar);
document.getElementById("cancelar-edicao").addEventListener("click", fecharModalEditar);
// =============================
//     SALVAR ALTERAÇÕES
// =============================
document.getElementById("form-editar-cliente").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("edit-id").value;

  // Aplicar máscara antes de salvar
  const telefoneFormatado = aplicarMascaraTelefone(
    document.getElementById("edit-telefone").value
  );

  const dadosAtualizados = {
    nome: document.getElementById("edit-nome").value.trim(),
    telefone: telefoneFormatado,
    cidade: document.getElementById("edit-cidade").value.trim(),
    up: document.getElementById("edit-up").value.trim(),
  };

  console.log("Salvando alterações do cliente:", dadosAtualizados);

  const { error } = await supabase
    .from("clientes")
    .update(dadosAtualizados)
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar cliente:", error);
    mostrarToast("Erro ao salvar alterações!", "bg-red-600"); // ⚠️ Toast de erro
    return;
  }

  fecharModalEditar();
  carregarClientes(); // Atualiza a lista sem reload

  mostrarToast("Cliente atualizado com sucesso!", "bg-green-600"); // 🎉 Toast moderno
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
// LISTAR FUNCIONÁRIOS COM BOTÕES EDITAR, BLOQUEAR E EXCLUIR
// ==============================
async function listarFuncionarios() {
  try {
    const { data: funcionarios, error } = await supabase
      .from("usuarios")
      .select(`
        id,
        username,
        password,
        cargo,
        email,
        permissoes,
        funcionario_id,
        funcionarios:funcionarios!left(nome_completo)
      `);

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
      nome.textContent = f.funcionarios?.nome_completo || '—';

      // Corrige leitura do ARRAY de permissões
      let permText;
      if (f.username.toLowerCase() === "admin") {
        permText = "Acesso Total"; // Admin sempre mostra Acesso Total
      } else {
        const permissoesLiberadas = Array.isArray(f.permissoes) ? f.permissoes : [];
        permText = permissoesLiberadas.length ? permissoesLiberadas.map(p => traducirPermissao(p)).join(", ") : "-";
      }

      const perm = document.createElement("span");
      perm.classList.add("text-sm", "text-gray-600");
      perm.textContent = permText;

      nomeDiv.appendChild(nome);
      nomeDiv.appendChild(perm);
      div.appendChild(nomeDiv);

      // Botões (não mostrar para admin)
      if (f.username.toLowerCase() !== "admin") {
        const botoesDiv = document.createElement("div");
        botoesDiv.classList.add("flex", "gap-2");

        // Botão Editar
        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.classList.add("px-3", "py-1", "bg-blue-500", "hover:bg-blue-600", "text-white", "rounded", "text-sm");
        btnEditar.addEventListener("click", () => abrirModalEdicao(f));

        // Botão Bloquear
        const btnBloquear = document.createElement("button");
        btnBloquear.textContent = "Bloquear";
        btnBloquear.classList.add("px-3", "py-1", "bg-gray-400", "hover:bg-gray-500", "text-white", "rounded", "text-sm");
        btnBloquear.addEventListener("click", async () => {
          if (confirm(`Deseja bloquear o funcionário ${f.funcionarios?.nome_completo}?`)) {
            try {
              const { error } = await supabase
                .from("usuarios")
                .update({ ativo: false })
                .eq("id", f.id);
              if (error) throw error;
              alert("Funcionário bloqueado com sucesso!");
              listarFuncionarios();
            } catch (err) {
              console.error("Erro ao bloquear funcionário:", err);
              alert("Erro ao bloquear funcionário.");
            }
          }
        });

        // Botão Excluir
        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.classList.add("px-3", "py-1", "bg-red-700", "hover:bg-red-800", "text-white", "rounded", "text-sm");
        btnExcluir.addEventListener("click", async () => {
          if (confirm(`Deseja realmente excluir o funcionário ${f.funcionarios?.nome_completo}? Essa ação não pode ser desfeita.`)) {
            try {
              // Exclui da tabela usuarios
              const { error: errorUsuario } = await supabase
                .from("usuarios")
                .delete()
                .eq("id", f.id);
              if (errorUsuario) throw errorUsuario;

              // Exclui da tabela funcionarios
              const { error: errorFuncionario } = await supabase
                .from("funcionarios")
                .delete()
                .eq("id", f.funcionario_id);
              if (errorFuncionario) throw errorFuncionario;

              alert("Funcionário excluído com sucesso!");
              listarFuncionarios();
            } catch (err) {
              console.error("Erro ao excluir funcionário:", err);
              alert("Erro ao excluir funcionário. Veja o console.");
            }
          }
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



// ==============================
// ABRIR MODAL DE EDIÇÃO
// ==============================
// Função para abrir modal de edição
async function abrirModalEdicao(f) {
  document.getElementById("modal-editar-funcionario").classList.remove("hidden");

  // Preenche campos básicos
  document.getElementById("editarIdFuncionario").value = f.id;
  document.getElementById("editarNomeFuncionario").value = f.funcionarios?.nome_completo || '';
  document.getElementById("editarUsuarioFuncionario").value = f.username;
  document.getElementById("editarSenhaFuncionario").value = f.password;
  document.getElementById("editarEmailFuncionario").value = f.email;

  // Verifica se permissoes é array
  const permissoes = Array.isArray(f.permissoes) ? f.permissoes : [];

  // Reflete as permissões no modal
  document.getElementById("editarPermAcessoTotal").checked = permissoes.includes("Acesso Total");
  document.getElementById("editarPermClientes").checked = permissoes.includes("acesso_clientes");
  document.getElementById("editarPermPedidos").checked = permissoes.includes("acesso_pedidos");
  document.getElementById("editarPermProdutos").checked = permissoes.includes("acesso_produtos");
  document.getElementById("editarPermFuncionarios").checked = permissoes.includes("acesso_funcionarios");
  document.getElementById("editarPermRelatorios").checked = permissoes.includes("acesso_relatorios");
}

// ==============================
// FECHAR MODAL
// ==============================
document.getElementById("btnFecharModal").addEventListener("click", () => {
  document.getElementById("modal-editar-funcionario").classList.add("hidden");
});

// ==============================
// SALVAR ALTERAÇÕES DO MODAL
// ==============================

document.getElementById("form-editar-funcionario").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("editarIdFuncionario").value;
  const nome = document.getElementById("editarNomeFuncionario").value.trim();
  const usuario = document.getElementById("editarUsuarioFuncionario").value.trim();
  const senha = document.getElementById("editarSenhaFuncionario").value.trim();
  const email = document.getElementById("editarEmailFuncionario").value.trim();

  // Monta objeto de permissões para salvar no banco como JSON
  const permissoesObj = {
    "Acesso Total": document.getElementById("editarPermAcessoTotal")?.checked || false,
    clientes: document.getElementById("editarPermClientes")?.checked || false,
    pedidos: document.getElementById("editarPermPedidos")?.checked || false,
    produtos: document.getElementById("editarPermProdutos")?.checked || false,
    funcionarios: document.getElementById("editarPermFuncionarios")?.checked || false,
    relatorios: document.getElementById("editarPermRelatorios")?.checked || false
  };

  try {
    // Pegar id do funcionário relacionado
    const { data: usuarioExistente, error: errorUsuarioFetch } = await supabase
      .from("usuarios")
      .select("funcionario_id")
      .eq("id", id)
      .single();
    if (errorUsuarioFetch) throw errorUsuarioFetch;

    const funcionarioId = usuarioExistente.funcionario_id;

    // Atualiza usuário com JSON de permissões
    const { error: errorUsuario } = await supabase
      .from("usuarios")
      .update({
        username: usuario,
        password: senha,
        email,
        permissoes: JSON.stringify(permissoesObj) // salva JSON no banco
      })
      .eq("id", id);
    if (errorUsuario) throw errorUsuario;

    // Atualiza funcionário
    const { error: errorFuncionario } = await supabase
      .from("funcionarios")
      .update({ nome_completo: nome })
      .eq("id", funcionarioId);
    if (errorFuncionario) throw errorFuncionario;

    alert("Funcionário atualizado com sucesso!\nPermissões salvas no banco: " + JSON.stringify(permissoesObj));
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


