// =============================
// CONFIGURAÇÃO DO SUPABASE
// =============================
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYWtibmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================
// MODAL DE ERRO
// =============================
function mostrarModalErro(mensagem) {
  console.error("❌ ERRO:", mensagem);

  const modal = document.getElementById("modal-erro");
  const msg = document.getElementById("modal-erro-msg");
  const btn = document.getElementById("btn-fechar-erro");

  if (!modal || !msg || !btn) {
    alert(mensagem);
    return;
  }

  msg.textContent = mensagem;
  modal.classList.remove("hidden");

  btn.onclick = () => modal.classList.add("hidden");
}

// Função para abrir o modal e mostrar a rota
export function mostrarRota(entregadorLat, entregadorLng, clienteLat, clienteLng) {
  const modal = document.getElementById('modal-mapa');
  const btnFechar = document.getElementById('btn-fechar-mapa');

  modal.classList.remove('hidden');

  // Inicializa o mapa
  const map = L.map('mapa').setView([entregadorLat, entregadorLng], 13);

  // Camada de mapa
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Adiciona a rota real usando Leaflet Routing Machine
  const rota = L.Routing.control({
    waypoints: [
      L.latLng(entregadorLat, entregadorLng),
      L.latLng(clienteLat, clienteLng)
    ],
    routeWhileDragging: false,
    show: false,
    addWaypoints: false,
    draggableWaypoints: false,
    createMarker: function(i, wp, nWps) {
      if (i === 0) return L.marker(wp.latLng).bindPopup('Você (Entregador)').openPopup();
      if (i === nWps - 1) return L.marker(wp.latLng).bindPopup('Cliente');
      return null;
    }
  }).addTo(map);

  // Ajusta o zoom para mostrar toda a rota
  rota.on('routesfound', function(e) {
    map.fitBounds(e.routes[0].bounds, {padding: [50, 50]});
  });

  // Botão para fechar modal
  btnFechar.onclick = () => {
    modal.classList.add('hidden');
    map.remove();
  };
}



// =============================
// SALVAR USERNAME DO ENTREGADOR
// =============================
async function salvarEntregadorNaEntrega(entregaId) {
  const entregador = JSON.parse(localStorage.getItem("entregadorLogado"));

  if (!entregador || !entregador.id) {
    throw new Error("Entregador não identificado. Faça login novamente.");
  }

  const { data: usuario, error } = await supabase
    .from("usuarios")
    .select("username")
    .eq("id", entregador.id)
    .single();

  if (error || !usuario?.username) {
    console.error(error);
    throw new Error("Erro ao buscar dados do entregador.");
  }

  const { error: updateError } = await supabase
    .from("entregas")
    .update({ entregador_nome: usuario.username })
    .eq("id", entregaId);

  if (updateError) {
    console.error(updateError);
    throw new Error("Erro ao salvar entregador na entrega.");
  }
}

// =============================
// FINALIZAR PEDIDO (TABELA PEDIDOS)
// =============================
async function finalizarPedido(numeroPedido) {
  const { error } = await supabase
    .from("pedidos")
    .update({
      status: "Finalizado",
      horario_entrega_status: new Date().toISOString()
    })
    .eq("numero_pedido", numeroPedido);

  if (error) {
    console.error("❌ ERRO AO ATUALIZAR PEDIDOS:", error);
    throw new Error("Erro ao salvar na tabela pedidos.");
  }
}

// =============================
// ENTREGAR PEDIDO
// =============================
async function entregarPedidoDOM(id, file, numeroPedido, entregador) {
  const statusEl = document.getElementById(`status-${id}`);
  const btnEl = document.getElementById(`btn-${id}`);
  const cardEl = btnEl?.closest("div");

  if (!statusEl || !btnEl || !cardEl) return;

  btnEl.disabled = true;
  btnEl.textContent = "Finalizando...";

  let fotoUrl = null;

  try {
    // Se houver foto
    if (file) {
      const fileName = `entrega_${id}_${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("fotos-entregas")
        .upload(fileName, file);
      if (error) throw error;

      fotoUrl = supabase.storage
        .from("fotos-entregas")
        .getPublicUrl(fileName).data.publicUrl;
    }

    // 🔹 Salva entregador logado
    await supabase
      .from("entregas")
      .update({ entregador_nome: entregador.username, status: "Entregue", horario_entrega: new Date().toLocaleTimeString(), foto_entrega: fotoUrl })
      .eq("id", id);

    // Atualiza status na tabela pedidos
    await finalizarPedido(numeroPedido);

    cardEl.remove();
  } catch (err) {
    btnEl.disabled = false;
    btnEl.textContent = "Finalizar Pedido";
    mostrarModalErro(err.message || "Erro inesperado ao finalizar.");
  }
}

function mostrarModalAlerta(mensagem) {
  const modal = document.getElementById("modal-alerta");
  const msg = document.getElementById("modal-alerta-msg");
  const btn = document.getElementById("btn-fechar-alerta");

  if (!modal || !msg || !btn) {
    alert(mensagem); // fallback se o modal não existir
    return;
  }

  msg.textContent = mensagem;
  modal.classList.remove("hidden");
  modal.classList.add("flex"); // mostra como flex

  btn.onclick = () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  };
}

// =============================
// CRIAR CARD (COM ITENS)
// =============================
function criarCardEntrega(entrega) {
  const card = document.createElement("div");

  card.className = `
    bg-gradient-to-br from-white to-gray-50
    rounded-2xl shadow-xl border border-gray-100
    p-5 mb-6
    hover:shadow-2xl transition duration-300
  `;

  // Calcular total do pedido
  let totalPedido = 0;

  let itensHtml = `
    <div class="mt-3 space-y-2">
  `;

  if (entrega.itens && entrega.itens.length > 0) {
    entrega.itens.forEach(item => {
      totalPedido += item.total;

      itensHtml += `
        <div class="flex justify-between text-sm text-gray-700 bg-white px-3 py-2 rounded-lg shadow-sm">
          <div>
            <span class="font-semibold">${item.descricao}</span>
            <span class="text-gray-500"> x${item.quantidade}</span>
          </div>
          <div class="font-semibold text-gray-800">
            R$ ${item.total.toFixed(2)}
          </div>
        </div>
      `;
    });
  } else {
    itensHtml += `
      <p class="text-gray-400 italic">Nenhum item informado</p>
    `;
  }

  itensHtml += `</div>`;

  card.innerHTML = `
    <!-- HEADER -->
    <div class="flex justify-between items-center mb-3">
      
      <h2 class="text-lg font-semibold tracking-wide">
        <span class="text-gray-400 uppercase">Pedido</span>
        <span class="text-gray-600 font-bold">
          #${entrega.numero_pedido}
        </span>
      </h2>

      <span id="status-${entrega.id}"
        class="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-700 font-semibold">
        ${entrega.status}
      </span>
    </div>

    <!-- CLIENTE -->
    <div class="text-sm text-gray-600 mb-2">
      <p><strong>Cliente:</strong> ${entrega.nome_cliente}</p>
      <p><strong>Endereço:</strong> ${entrega.endereco}</p>
    </div>

    <!-- ITENS -->
    <div class="border-t pt-3">
      <p class="font-semibold text-gray-800 mb-2">Itens do Pedido</p>
      ${itensHtml}
    </div>

    <!-- TOTAL -->
    <div class="flex justify-between items-center mt-4 pt-3 border-t">
      <span class="text-gray-600 font-medium">Total</span>
      <span class="text-xl font-bold text-green-600">
        R$ ${totalPedido.toFixed(2)}
      </span>
    </div>

    <!-- BOTÕES -->
    <div class="flex gap-3 mt-4">
      <button id="btn-${entrega.id}"
        class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl font-semibold shadow-md transition">
        Finalizar
      </button>

      <button id="btn-rota-${entrega.id}"
        class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl font-semibold shadow-md transition">
        Ver Rota
      </button>
    </div>
  `;

  const entregador = JSON.parse(localStorage.getItem("entregadorLogado"));

  // Finalizar pedido
  card.querySelector(`#btn-${entrega.id}`).onclick = () =>
    entregarPedidoDOM(entrega.id, null, entrega.numero_pedido, entregador);

  // Ver rota
  card.querySelector(`#btn-rota-${entrega.id}`).onclick = () => {
    if (!entregador || !entregador.lat || !entregador.lng) {
      mostrarModalAlerta("Coordenadas do entregador não encontradas!");
      return;
    }

    mostrarRota(
      entregador.lat,
      entregador.lng,
      entrega.lat_cliente,
      entrega.lng_cliente
    );
  };

  return card;
}



// =============================
// CARREGAR ENTREGAS
// =============================
async function carregarEntregas() {
  const container = document.getElementById("pedidos-container");
  container.innerHTML = "";

  // Entregador logado
  const entregador = JSON.parse(localStorage.getItem("entregadorLogado"));
  if (!entregador) return window.location.href = "loginentregador.html";

  try {
    // Buscar pedidos aguardando
    const { data, error } = await supabase
      .from("entregas")
      .select("*")
      .eq("status", "Aguardando")  // 🔹 só os aguardando
      .order("id");

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML =
        "<p class='text-center text-gray-500 mt-10'>Nenhuma entrega aguardando.</p>";
      return;
    }

    // Criar card para cada pedido
    data.forEach(entrega => container.appendChild(criarCardEntrega(entrega)));

  } catch (err) {
    console.error(err);
    mostrarModalErro("Erro ao carregar entregas.");
  }
}


// =============================
// INIT
// =============================
document.addEventListener("DOMContentLoaded", carregarEntregas);


// =============================
// MOSTRAR NOME DO ENTREGADOR
// =============================
async function mostrarNomeEntregador() {
  const el = document.getElementById("nome-entregador");
  const entregador = JSON.parse(localStorage.getItem("entregadorLogado"));

  if (!entregador || !el) {
    window.location.href = "loginentregador.html";
    return;
  }

  el.textContent = entregador.nome || entregador.username;
}

// =============================
// EXECUÇÃO INICIAL
// =============================
document.addEventListener("DOMContentLoaded", () => {
  mostrarNomeEntregador();   // ✅ CORREÇÃO PRINCIPAL
  

  const btnDeslogar = document.getElementById("btn-deslogar");
  if (btnDeslogar) {
    btnDeslogar.onclick = () => {
      localStorage.removeItem("entregadorLogado");
      window.location.href = "loginentregador.html";
    };
  }
});