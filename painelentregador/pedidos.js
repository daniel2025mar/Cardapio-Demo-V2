// =============================
// CONFIGURAÇÃO DO SUPABASE
// =============================
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYWtibmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================
// ENTREGAR PEDIDO NO DOM E ATUALIZAR SUPABASE
// =============================
async function entregarPedidoDOM(id, file) {
  const statusEl = document.getElementById(`status-${id}`);
  const btnEl = document.getElementById(`btn-${id}`);
  const cardEl = btnEl ? btnEl.closest("div") : null;

  if (!statusEl || !btnEl || !cardEl || statusEl.textContent === "Entregue") return;

  btnEl.disabled = true;
  btnEl.textContent = "Finalizando...";

  let fotoUrl = null;

  try {
    if (file) {
      const fileName = `entrega_${id}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("fotos-entregas")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      fotoUrl = supabase.storage.from("fotos-entregas").getPublicUrl(fileName).data.publicUrl;
    }

    const { error: updateError } = await supabase
      .from("entregas")
      .update({
        status: "Entregue",
        horario_entrega: new Date().toLocaleTimeString(),
        foto_entrega: fotoUrl || null
      })
      .eq("id", id);

    if (updateError) throw updateError;

    cardEl.remove();

  } catch (err) {
    console.error("Erro ao finalizar pedido:", err);
    alert("Não foi possível finalizar o pedido. Tente novamente.");
    btnEl.disabled = false;
    btnEl.textContent = "Finalizar Pedido";
  }
}

// =============================
// CRIAR CARD DE ENTREGA
// =============================
function criarCardEntrega(entrega) {
  const card = document.createElement("div");
  card.className = `
    bg-white
    rounded-3xl
    shadow-lg
    p-4 sm:p-6
    mb-6
    flex
    flex-col
    justify-between
  `;

  const statusColor = entrega.status?.trim().toLowerCase() === "aguardando" 
    ? "bg-yellow-400 text-gray-800" 
    : "bg-green-500 text-white";

  let itensHtml = "<p class='text-gray-400 italic'>Não informado</p>";
  if (entrega.itens && entrega.itens.length > 0) {
    itensHtml = "<ul class='list-disc list-inside space-y-1'>";
    entrega.itens.forEach(item => {
      itensHtml += `<li class='text-gray-700'><span class='font-semibold'>${item.name}</span> — Qtd: ${item.quantity} — R$ ${item.price.toFixed(2)}</li>`;
    });
    itensHtml += "</ul>";
  }

  card.innerHTML = `
    <h2 class="text-2xl font-bold text-gray-900 mb-2">Pedido ${entrega.numero_pedido}</h2>
    <p class="text-gray-600"><span class="font-semibold">Cliente:</span> ${entrega.nome_cliente}</p>
    <p class="text-gray-600"><span class="font-semibold">Endereço:</span> ${entrega.endereco}</p>
    <p class="text-gray-700 font-semibold mt-3">Itens:</p>
    ${itensHtml}
    <div class="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mt-4">
      <span id="status-${entrega.id}" class="px-4 py-2 rounded-full ${statusColor} font-semibold text-center shadow-md">${entrega.status}</span>
      ${entrega.status?.trim().toLowerCase() === "aguardando" ? `<button id="btn-${entrega.id}" class="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-full shadow-md w-full sm:w-auto">Finalizar Pedido</button>` : ""}
      <span id="check-${entrega.id}" class="text-green-600 text-3xl font-bold" style="display:${entrega.status === "Entregue" ? 'inline-flex' : 'none'};">✔️</span>
    </div>
  `;

  const btnEl = card.querySelector(`#btn-${entrega.id}`);
  if (btnEl) btnEl.addEventListener("click", () => entregarPedidoDOM(entrega.id));

  return card;
}

// =============================
// CARREGAR ENTREGAS Aguardando
// =============================
async function carregarEntregas() {
  const container = document.getElementById("pedidos-container");
  container.innerHTML = "";

  try {
    const { data: entregas, error } = await supabase
      .from("entregas")
      .select("*")
      // usamos ilike para ignorar maiúsculas/minúsculas e espaços
      .ilike("status", "%aguardando%")
      .order("id", { ascending: true });

    console.log("Erro:", error);
    console.log("Entregas retornadas:", entregas);

    if (error) throw error;

    if (!entregas || entregas.length === 0) {
      container.innerHTML = `<p class="text-gray-600 text-center mt-10">Nenhuma entrega aguardando no momento.</p>`;
      return;
    }

    entregas.forEach(entrega => container.appendChild(criarCardEntrega(entrega)));

  } catch (err) {
    console.error("Erro ao carregar entregas:", err);
    container.innerHTML = `<p class="text-gray-600 text-center mt-10">Erro ao carregar entregas.</p>`;
  }
}

// =============================
// VERIFICAR SE USUÁRIO ESTÁ ATIVO
// =============================
async function verificarAtivo(entregadorId) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("ativo")
    .eq("id", entregadorId)
    .single();

  if (error) {
    console.error("Erro ao verificar status do usuário:", error);
    return false;
  }

  return data?.ativo === true;
}

// =============================
// MODAL DE BLOQUEIO
// =============================
function mostrarModalBloqueio() {
  const modal = document.getElementById("modal-bloqueio");
  const modalContent = document.getElementById("modal-content");
  const btnFechar = document.getElementById("btn-fechar-bloqueio");

  if (!modal || !modalContent || !btnFechar) return;

  modal.classList.remove("hidden");
  modalContent.classList.remove("scale-95", "opacity-0");
  modalContent.classList.add("scale-100", "opacity-100");

  btnFechar.addEventListener("click", () => {
    modal.classList.add("hidden");
    localStorage.removeItem("entregadorLogado");
    window.location.href = "loginentregador.html";
  });

  document.body.style.pointerEvents = "none";
  modal.style.pointerEvents = "auto";
}

// =============================
// MONITORAR ATIVO EM TEMPO REAL
// =============================
function monitorarAtivoRealtime(entregadorId) {
  supabase
    .channel('realtime-usuarios')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'usuarios', filter: `id=eq.${entregadorId}` },
      (payload) => {
        if (payload.new.ativo === false) {
          mostrarModalBloqueio();
        }
      }
    )
    .subscribe();
}

// =============================
// MOSTRAR NOME DO ENTREGADOR LOGADO
// =============================
async function mostrarNomeEntregador() {
  const nomeEntregadorEl = document.getElementById("nome-entregador");
  const entregador = JSON.parse(localStorage.getItem("entregadorLogado"));

  if (!entregador || !nomeEntregadorEl) {
    window.location.href = "loginentregador.html";
    return;
  }

  const ativo = await verificarAtivo(entregador.id);

  if (!ativo) {
    mostrarModalBloqueio();
    return;
  }

  nomeEntregadorEl.textContent = entregador.nome || entregador.username;

  // Inicia monitoramento em tempo real
  monitorarAtivoRealtime(entregador.id);
}

// =============================
// EXECUÇÃO INICIAL
// =============================
document.addEventListener("DOMContentLoaded", () => {
  mostrarNomeEntregador();
  carregarEntregas();

  const btnDeslogar = document.getElementById("btn-deslogar");
  if (btnDeslogar) {
    btnDeslogar.addEventListener("click", () => {
      localStorage.removeItem("entregadorLogado");
      window.location.href = "loginentregador.html";
    });
  }
});
