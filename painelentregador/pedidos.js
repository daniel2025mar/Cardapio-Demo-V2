// Função para marcar pedido como finalizado
function finalizarPedido(id) {
  const statusEl = document.getElementById(`status-${id}`);
  if (statusEl) {
    statusEl.textContent = "Finalizado";
    statusEl.classList.remove("bg-yellow-400");
    statusEl.classList.add("bg-gray-500");
  }
}

// Exemplo de pedidos reais vindos do backend
// No futuro, será substituído por uma requisição real ao banco
const pedidosReais = [
  // Exemplo:
  // { id: 1, cliente: "Nome Cliente", endereco: "Endereço", itens: "Itens" }
];

const container = document.getElementById("pedidos-container");

// Criar cards somente se houver pedidos reais
if (pedidosReais.length > 0) {
  pedidosReais.forEach(pedido => {
    const card = document.createElement("div");
    card.className = "bg-white rounded-lg shadow p-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center";

    card.innerHTML = `
      <div class="mb-4 sm:mb-0">
        <h2 class="text-xl font-semibold">Pedido #${pedido.id}</h2>
        <p class="text-gray-600">Cliente: ${pedido.cliente}</p>
        <p class="text-gray-600">Endereço: ${pedido.endereco}</p>
        <p class="text-gray-600">Itens: ${pedido.itens}</p>
      </div>
      <div class="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
        <span class="px-3 py-1 rounded-full bg-yellow-400 text-white font-semibold text-center sm:text-left" id="status-${pedido.id}">Saindo para entrega</span>
        <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full sm:w-auto" onclick="finalizarPedido(${pedido.id})">Finalizar Pedido</button>
      </div>
    `;
    container.appendChild(card);
  });
} else {
  // Mensagem quando não há pedidos
  const msg = document.createElement("p");
  msg.className = "text-gray-600 text-center mt-10";
  msg.textContent = "Nenhum pedido disponível no momento.";
  container.appendChild(msg);
}
