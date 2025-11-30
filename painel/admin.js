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
    contador.textContent = pedidosFinalizados.length || 0;
  }

  // ================================
  // CARREGA FILA DE PEDIDOS (status !== "Finalizado")
  // ================================
  async function carregarFilaPedidos() {
    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Erro ao carregar pedidos:", error);
      return;
    }

    const listaPedidos = document.querySelector(".fila-pedidos-list");
    listaPedidos.innerHTML = "";

    pedidos.forEach(pedido => {
      // Mostra somente pedidos que NÃO estão finalizados
      if (pedido.status === "Finalizado") return;

      const item = document.createElement("div");
      item.classList.add("order-list-item");
      item.dataset.id = pedido.id;

      item.innerHTML = `
        <p class="font-semibold">#${pedido.id} — ${pedido.cliente}</p>
        <p>${pedido.endereco || "Endereço não informado"} • ${pedido.pagamento || "Pagar na entrega"}</p>
        <p>R$ ${Number(pedido.total || 0).toFixed(2)}</p>
        <p>${pedido.horario_recebido || ""}</p>
      `;

      listaPedidos.appendChild(item);
    });
  }

  // Atualiza ao carregar a página
  await atualizarTotalFinalizados();
  await carregarFilaPedidos();
  carregarPedidos(); // mantém sua função original se houver lógica extra

  // ================================
  // BOTÃO FINALIZAR PEDIDO
  // ================================
  const btnFinalizar = document.getElementById("btn-finalizar-pedido");

  if (btnFinalizar) {
    btnFinalizar.addEventListener("click", async () => {
      const numeroPedido = document.getElementById("pedido-numero").textContent;

      if (!numeroPedido || numeroPedido === "0000") {
        mostrarToast("Nenhum pedido selecionado.", "bg-red-600");
        return;
      }

      try {
        // Atualiza status no Supabase
        const { error } = await supabase
          .from("pedidos")
          .update({ status: "Finalizado" })
          .eq("id", numeroPedido);

        if (error) {
          console.error("Erro ao atualizar status:", error);
          mostrarToast("Erro ao finalizar pedido.", "bg-red-600");
          return;
        }

        // Atualiza contador e fila
        await atualizarTotalFinalizados();
        await carregarFilaPedidos();

        // Limpa informações do card de detalhes
        document.getElementById("pedido-numero").textContent = "0000";
        document.getElementById("pedido-hora").textContent = "--:--";
        document.getElementById("pedido-tipo").textContent = "Pedido para entrega";
        document.getElementById("pedido-status").textContent = "🟢 Recebido";
        document.getElementById("total-pedido").textContent = "R$ 0,00";

        document.getElementById("cliente-nome").textContent = "—";
        document.getElementById("cliente-telefone").textContent = "—";
        document.getElementById("cliente-endereco").textContent = "—";
        document.getElementById("cliente-referencia").textContent = "—";
        document.getElementById("tipo-pagamento").textContent = "—";

        document.getElementById("lista-itens").innerHTML = "";
        document.getElementById("subtotal-pedido").textContent = "R$ 0,00";

        document.getElementById("pedido-observacoes").textContent = "Nenhuma observação.";
        document.getElementById("pedido-timeline").innerHTML = "";

        mostrarToast("Pedido finalizado e removido da fila!", "bg-indigo-600");

      } catch (err) {
        console.error("Erro ao finalizar pedido:", err);
        mostrarToast("Erro ao finalizar pedido.", "bg-red-600");
      }
    });
  }
});

// ===============================
//   APLICAR PERMISSÕES
// ===============================
function aplicarPermissoes(usuario) {
  const permissoes = usuario.permissoes || [];

  const userSpan = document.querySelector("header span");
  userSpan.textContent = usuario.username;

  document.querySelectorAll(".content-section").forEach(sec => sec.style.display = "none");

  if (permissoes.includes("acesso_total")) {
    document.querySelectorAll(".content-section").forEach(sec => sec.style.display = "block");
    ativarMenu();
    abrirDashboard();
    return;
  }

  mostrarSecaoPermitida(permissoes);
  filtrarMenu(permissoes);
  ativarMenu();
  abrirDashboard();
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
    // Buscar todos os clientes da tabela "clientes"
    const { data: clientes, error } = await supabase
      .from("clientes")
      .select("*")
      .order("nome", { ascending: true });

    if (error) throw error;

    // Limpar lista
    lista.innerHTML = "";

    // Adicionar linhas na tabela
    clientes.forEach((cliente, index) => {
  const tr = document.createElement("tr");
  tr.className = "hover:bg-gray-50";

  // Se estiver bloqueado, muda o fundo da linha
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
      <button class="px-2 py-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded text-xs font-semibold" data-acao="editar">Editar</button>
      <button class="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold" data-acao="excluir">Excluir</button>
      <button class="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-semibold" data-acao="bloquear">
        ${cliente.bloqueado ? 'Desbloquear' : 'Bloquear'}
      </button>
    </td>
  `;

      // Eventos dos botões
  
tr.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    const acao = btn.dataset.acao;

    switch (acao) {
      case "editar":
        editarCliente(cliente.id);
        break;

      case "excluir":
        if (confirm(`Deseja realmente excluir ${cliente.nome || "—"}?`)) {
          excluirCliente(cliente.id);
        }
        break;

      case "bloquear":
        // Agora envia também o valor atual
        bloquearCliente(cliente.id, cliente.bloqueado);
        break;
    }
  });

});


      lista.appendChild(tr);
    });

    // Se não houver clientes
    if (!clientes || clientes.length === 0) {
      lista.innerHTML = `<tr><td colspan="6" class="text-gray-400 text-center py-4">Nenhum cliente encontrado.</td></tr>`;
    }

  } catch (err) {
    console.error("Erro ao carregar clientes:", err);
    lista.innerHTML = `<tr><td colspan="6" class="text-red-500 text-center py-4">Erro ao carregar clientes.</td></tr>`;
  }
}

// Chamar a função após carregar o DOM
document.addEventListener("DOMContentLoaded", () => {
  carregarClientes();

  // Botão cadastrar cliente
  const btnCadastrar = document.getElementById("btn-cadastrar-cliente");
  if (btnCadastrar) {
    btnCadastrar.addEventListener("click", () => {
      alert("Abrir formulário de cadastro de cliente (implementação futura)");
    });
  }
});


async function bloquearCliente(idCliente, statusAtual) {
  const novoStatus = !statusAtual; // inverte (true → false / false → true)

  const texto = novoStatus
    ? "Deseja bloquear este cliente?"
    : "Deseja desbloquear este cliente?";

  if (!confirm(texto)) return;

  const { error } = await supabase
    .from("clientes")
    .update({ bloqueado: novoStatus })
    .eq("id", idCliente);

  if (error) {
    console.error("Erro ao atualizar bloqueio:", error);
    alert("Erro ao atualizar o status do cliente.");
    return;
  }

  // Atualiza a lista instantaneamente
  carregarClientes();

  // Mensagem moderna
  showToast(
    novoStatus
      ? "Cliente bloqueado com sucesso!"
      : "Cliente desbloqueado com sucesso!"
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
