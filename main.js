// =============================
//   CONFIGURAÇÃO DO SUPABASE
// =============================
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYWtibmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


const menu = document.getElementById("menu")
const carbtn = document.getElementById("card-btn")
const cardmodal = document.getElementById("card-modal")
const cartitemcontainer = document.getElementById("card-itens")
const cardtotal = document.getElementById("card-total")
const checkout = document.getElementById("checkout-btn")
const closeModelbtn = document.getElementById("close-model-btn")
const cardCounter = document.getElementById("card-count")
const andressInput = document.getElementById("address")
const andresswarn = document.getElementById("address-warn")
const retirarLocal = document.getElementById("retirarLocal");

let cart = [];

//funçaos do cardapio

// abrir model do carrinho
carbtn.addEventListener("click", function() {
    cardmodal.style.display = "flex"
    updateCartModal();
}) 

// fechar o model do carrinho
cardmodal.addEventListener("click", function(event){
 if(event.target === cardmodal){
    cardmodal.style.display = "none"
 }
})

//funçao fechar o modal no button fechar
closeModelbtn.addEventListener("click", function(){
     cardmodal.style.display = "none"
})

//adiconar produtos
menu.addEventListener("click", function(event){
let parenButton = event.target.closest(".add-to-card-btn")
if(parenButton){
    const name = parenButton.getAttribute("data-name")
    const price = parseFloat(parenButton.getAttribute("data-price").replace(",", "."))
    //adicionar no carrinho
  addToCart(name, price)
}
})

async function carregarProdutos() {
  try {
    // Busca todos os produtos ativos
    const { data: produtos, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('situacao', 'ativo');

    if (error) {
      console.error("Erro ao buscar produtos:", error);
      return;
    }

    // Agrupa produtos por categoria
    const categorias = {};
    produtos.forEach(produto => {
      const cat = produto.categoria || "Outros";
      if (!categorias[cat]) categorias[cat] = [];
      categorias[cat].push(produto);
    });

    // Para cada categoria, renderiza os cards
    Object.keys(categorias).forEach(cat => {
      const container = document.getElementById(cat); // id do main grid para cada categoria
      if (!container) return;

      categorias[cat].forEach(produto => {
        const card = document.createElement('div');
        card.className = "produto-item flex gap-4 p-4 bg-white rounded-xl shadow hover:shadow-lg transition-shadow duration-200";
        card.dataset.categoria = cat;

        card.innerHTML = `
          <img src="${produto.imagem_url || './public/Imagem/default.png'}" alt="${produto.descricao}"
               class="w-28 h-28 rounded-lg object-cover hover:scale-105 hover:-rotate-2 transition-transform duration-300">
          <div class="flex flex-col justify-between w-full">
            <div>
              <p class="font-bold text-lg mb-1">${produto.descricao}</p>
              <p class="text-sm text-gray-600">${produto.descricao_nfe || ''}</p>
            </div>
            <div class="flex items-center justify-between mt-3">
              <p class="font-bold text-lg text-red-600">R$ ${produto.valor_sugerido.toFixed(2)}</p>
              <div class="flex gap-2">
                <button class="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-white open-ingredientes-btn" data-name="${produto.descricao}">
                  <i class="fas fa-list"></i>
                </button>
                <button class="bg-gray-900 hover:bg-gray-800 px-5 py-2 rounded add-to-card-btn" data-name="${produto.descricao}" data-price="${produto.valor_sugerido.toFixed(2)}">
                  <i class="fas fa-shopping-cart text-white text-lg"></i>
                </button>
              </div>
            </div>
          </div>
        `;
        container.appendChild(card);
      });
    });

  } catch (err) {
    console.error("Erro inesperado:", err);
  }
}

// Chama a função ao carregar a página
window.addEventListener('DOMContentLoaded', carregarProdutos);


//funçao para adicionar no carrinho
function addToCart(name, price){

const existengItem = cart.find(item => item.name === name)

if(existengItem){
 // se for o nome igual, almenta somente a quantidade.
 existengItem.quantity += 1;
}else{

    cart.push({
    name,
    price,
    quantity: 1,
 })
}
 
updateCartModal()
}

// atualize o carrinho
function updateCartModal() {
  cartitemcontainer.innerHTML = "";
  let total = 0;

  // 👉 Taxa padrão
  let taxaEntrega = cart.length > 0 ? 3.00 : 0.00;

  // 👉 Se marcar “retirar no local”, taxa vira 0
  if (retirarLocal.checked) {
    taxaEntrega = 0.00;
  }

  // 👉 Rolagem da lista
  cartitemcontainer.style.maxHeight = "250px";
  cartitemcontainer.style.overflowY = "auto";
  cartitemcontainer.style.marginBottom = "10px";
  cartitemcontainer.style.paddingRight = "6px";

  cardmodal.style.overflow = "visible";

  cart.forEach(item => {
    const cartItemElements = document.createElement("div");
    cartItemElements.classList.add(
      "flex", "justify-between", "mb-4",
      "flex-col", "border-b", "pb-2"
    );

    cartItemElements.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium">${item.name}</p>
          <p>Qtd: ${item.quantity}</p>
          <p class="font-medium mt-2">R$ ${item.price.toFixed(2)}</p>
        </div>

        <button class="remove-from-card-btn bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition"
                data-name="${item.name}">
          Remover
        </button>
      </div>
    `;

    total += item.price * item.quantity;
    cartitemcontainer.appendChild(cartItemElements);
  });

  // 👉 Total com taxa ou sem taxa
  const totalComTaxa = total + taxaEntrega;

  // 👉 Exibe taxa + total formatados
  cardtotal.innerHTML = `
    <p class="font-medium">
      Taxa de Entrega:
      <span class="text-blue-800 font-medium">
        ${taxaEntrega.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </span>
    </p>

    <p class="font-bold mt-1">
      Total:
      ${totalComTaxa.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
    </p>
  `;

  cardCounter.innerHTML = cart.length;
}


retirarLocal.addEventListener("change", function () {
  updateCartModal(); // Atualiza o modal quando marcar/desmarcar
});
// funçao para remover item do carrinho
cartitemcontainer.addEventListener("click", function(event){
   if(event.target.classList.contains("remove-from-card-btn")){
      const name = event.target.getAttribute("data-name")

      removeItemCard(name)
   }
})

function removeItemCard(name){
   const index = cart.findIndex(item => item.name === name);
   if(index !== -1){
      const item = cart[index];

      if(item.quantity > 1){
         item.quantity -= 1;
         updateCartModal();
         return;
      }

      cart.splice(index, 1);
      updateCartModal();
   }
}

//funçao do campo do endereço
andressInput.addEventListener("input", function(event){
 let inputValue = event.target.value; // sempre minúsculo
  if(inputValue !==""){
   andressInput.classList.remove("border-red-500")
   andresswarn.classList.add("hidden")
  }
})

// =============================
//   FUNÇÃO → Salvar pedido no Supabase
// =============================
async function salvarPedidoNoSupabase(pedido) {
  const { data, error } = await supabase
    .from("pedidos")
    .insert([pedido]);

  if (error) {
    console.error("Erro ao salvar pedido no Supabase:", error);

    Toastify({
      text: "Erro ao salvar pedido no sistema",
      duration: 4000,
      close: true,
      gravity: "top",
      position: "center",
      style: { background: "linear-gradient(to right, #ff0000, #660000)" }
    }).showToast();

    return false;
  }

  return true;
}
checkout.addEventListener("click", async function () {

  // 🔹 Verifica se o usuário está logado
  const storedUser = localStorage.getItem("userGoogle");
  if (!storedUser) {
    loginModal.classList.remove("hidden");
    setTimeout(() => {
      loginModalBox.classList.remove("scale-95", "opacity-0");
      loginModalBox.classList.add("scale-100", "opacity-100");
    }, 50);

    Toastify({
      text: "Você precisa entrar ou criar uma conta para enviar o pedido",
      duration: 3000,
      close: true,
      gravity: "top",
      position: "center",
      style: { background: "linear-gradient(to right, #ff6a00, #ff0000)" }
    }).showToast();

    return;
  }

  // ==============================================
  // 🔒 VERIFICA SE O CLIENTE ESTÁ BLOQUEADO
  // ==============================================
  const usuarioLogado = JSON.parse(storedUser);
  const emailUsuario = usuarioLogado.email;

  const { data: clienteData, error: clienteError } = await supabase
    .from("clientes")
    .select("bloqueado")
    .eq("email", emailUsuario)
    .single();

  if (clienteError) {
    console.error("Erro ao verificar bloqueio do cliente:", clienteError);
  }

  // 🚫 Se estiver bloqueado → impede o pedido
  if (clienteData && clienteData.bloqueado === true) {
    Toastify({
      text: "Seu acesso para finalizar pedidos está temporariamente bloqueado.",
      duration: 4000,
      close: true,
      gravity: "top",
      position: "center",
      style: { background: "linear-gradient(to right, #610202ff, #8b0000)" }
    }).showToast();
    return;
  }

  // ==============================
  // Verifica se o restaurante está aberto
  // ==============================
  const isOpen = checkRestauranteOpen();
  if (!isOpen) {
    const modalLojaFechada = document.getElementById('loja-fechada-modal');
    const modalContent = modalLojaFechada.children[0];
    const btnFechar = document.getElementById('fechar-loja-fechada');
    const btnOk = document.getElementById('ok-loja-fechada');

    modalLojaFechada.classList.remove('hidden');
    setTimeout(() => {
      modalContent.classList.remove('scale-90', 'opacity-0');
      modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);

    function fecharModal() {
      modalContent.classList.add('scale-90', 'opacity-0');
      setTimeout(() => modalLojaFechada.classList.add('hidden'), 300);
    }

    btnFechar.addEventListener('click', fecharModal);
    btnOk.addEventListener('click', fecharModal);

    return;
  }

  // ==============================
  // Verifica se o carrinho está vazio
  // ==============================
  if (cart.length === 0) {
    Toastify({
      text: "Seu carrinho está vazio",
      duration: 3000,
      close: true,
      gravity: "top",
      position: "left",
      style: { background: "linear-gradient(to right, #adb000ff, #ebfc00ff)" }
    }).showToast();
    return;
  }

  // ==============================
  // Verifica endereço
  // ==============================
  const retirarLocalChecked = retirarLocal.checked;
  if (!retirarLocalChecked && andressInput.value === "") {
    andresswarn.classList.remove("hidden");
    andressInput.classList.add("border-red-500");
    return;
  }

  // ==============================
  // Monta o pedido
  // ==============================
  const cartItens = cart.map(item => {
    let nomeProduto = item.name;
    if (item.custom && item.removidos && item.removidos.length > 0) {
      nomeProduto += ` (Sem ${item.removidos.join(", ")})`;
    }
    return `${nomeProduto} | Quantidade: ${item.quantity} | Preço: R$ ${item.price.toFixed(2)}`;
  }).join("\n");

  const totalProdutos = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  let taxaEntrega = retirarLocalChecked ? 0 : 3.00;
  const totalComTaxa = totalProdutos + taxaEntrega;

  // ==============================
  // ENVIA PARA O WHATSAPP
  // ==============================
  let mensagemTexto = `🛍️ *Resumo do Pedido:*\n\n${cartItens}\n\n`;

  if (retirarLocalChecked) {
    mensagemTexto += `🏃 *Retirada no Local*\n📦 *Taxa de Entrega:* R$ 0,00\n`;
  } else {
    mensagemTexto += `📦 *Taxa de Entrega:* R$ ${taxaEntrega.toFixed(2)}\n🏠 *Endereço:* ${andressInput.value}\n`;
  }

  mensagemTexto += `💰 *Total:* R$ ${totalComTaxa.toFixed(2)}`;

  const mensagem = encodeURIComponent(mensagemTexto);
  const phone = "+5534998276982";
  window.open(`https://wa.me/${phone}?text=${mensagem}`);

  // ================================================
  // 🔥 SALVAR NO SUPABASE
  // ================================================
  const usuario = JSON.parse(storedUser);

  const pedidoSupabase = {
    numero_pedido: Date.now().toString(),
    tipo_entrega: retirarLocalChecked ? "retirar" : "entregar",
    horario_recebido: new Date().toLocaleString(),
    status: "Recebido",
    subtotal: totalProdutos,
    total: totalComTaxa,
    cliente: usuario.name,
    telefone: usuario.phone || "",
    endereco: retirarLocalChecked ? "Retirada no Local" : andressInput.value,
    referencia: "",
    pagamento: "Pagar na entrega",
    observacoes: "",
    horario_recebido_status: new Date().toISOString(),
    horario_preparo_status: "",
    horario_entrega_status: "",
    criado_em: new Date().toISOString(),
    itens: cart
  };

  await salvarPedidoNoSupabase(pedidoSupabase);

  await atualizarClienteSupabase(usuario, retirarLocalChecked ? "Retirada no Local" : andressInput.value);

  // =====================================================
  // Salva no "Meus Pedidos"
  // =====================================================
  let pedidosFinalizados = JSON.parse(localStorage.getItem("pedidosFinalizados")) || [];

  const cartComData = cart.map(pedido => ({
    ...pedido,
    dataHora: new Date().toISOString()
  }));

  pedidosFinalizados = [...pedidosFinalizados, ...cartComData];
  localStorage.setItem("pedidosFinalizados", JSON.stringify(pedidosFinalizados));

  (function atualizarMeusPedidos() {
    const lista = document.getElementById("listaMeusPedidos");
    lista.innerHTML = "";

    if (pedidosFinalizados.length === 0) {
      lista.innerHTML = "<li class='p-2 text-gray-500'>Nenhum pedido finalizado ainda.</li>";
      return;
    }

    pedidosFinalizados.forEach((pedido, index) => {
      const li = document.createElement('li');
      li.className = "border-b border-gray-200 py-2";
      li.innerHTML = `
        <strong>Pedido ${index + 1}:</strong> ${pedido.name} | Quantidade: ${pedido.quantity} | R$ ${pedido.price.toFixed(2)}
      `;
      lista.appendChild(li);
    });
  })();

  // Limpa tudo
  cart = [];
  updateCartModal();
  cardmodal.style.display = "none";

  // Modal de Sucesso
  setTimeout(() => {
    const modal = document.getElementById('pedido-sucesso-modal');
    const modalBox = document.getElementById('pedido-modal-box');
    modal.classList.remove('hidden');

    setTimeout(() => {
      modalBox.classList.remove('scale-90', 'opacity-0');
      modalBox.classList.add('scale-100', 'opacity-100');
    }, 50);

    const btnOk = document.getElementById('pedido-sucesso-ok');
    btnOk.addEventListener('click', () => {
      modalBox.classList.add('scale-90', 'opacity-0');
      setTimeout(() => modal.classList.add('hidden'), 300);
    });
  }, 500);

});

// ================================================
// 🔥 NOVO → ATUALIZAR OU INSERIR CLIENTE NO SUPABASE
async function atualizarClienteSupabase(usuario, enderecoTratado) {
  try {
    const email = usuario.email;

    // 🔎 Verifica se o cliente já existe
    const { data: clienteExistente, error: erroBusca } = await supabase
      .from("clientes")
      .select("email")
      .eq("email", email)
      .single();

    // Se houver erro diferente de "registro não encontrado", interrompe
    if (erroBusca && erroBusca.code !== "PGRST116") {
      console.error("Erro ao buscar cliente:", erroBusca);
      return;
    }

    // =======================================================
    // 📌 CASO 1 → Cliente já existe → ATUALIZAR
    // =======================================================
    if (clienteExistente) {
      const { error: erroUpdate } = await supabase
        .from("clientes")
        .update({
          nome: usuario.name,
          telefone: usuario.phone || "",
          endereco: enderecoTratado,
          atualizado_em: new Date().toISOString()
        })
        .eq("email", email);

      if (erroUpdate) console.error("Erro ao atualizar cliente:", erroUpdate);
      else console.log("Cliente atualizado com sucesso!");
      return;
    }

    // =======================================================
    // 📌 CASO 2 → Cliente NÃO existe → INSERIR NOVO
    // =======================================================
    const { error: erroInsert } = await supabase
      .from("clientes")
      .insert({
        nome: usuario.name,
        email: email,
        telefone: usuario.phone || "",
        endereco: enderecoTratado,
        bloqueado: false, // padrão
        criado_em: new Date().toISOString()
      });

    if (erroInsert) console.error("Erro ao inserir cliente:", erroInsert);
    else console.log("Cliente inserido com sucesso!");

  } catch (e) {
    console.error("Erro inesperado ao salvar cliente:", e);
  }
}


//horario de funcionamento
function checkRestauranteOpen(){
   const data = new Date();
   const hora = data.getHours();
   return hora >= 7 && hora < 22;
}


const spanItem = document.getElementById("date-span")
const isOpen = checkRestauranteOpen();

if(isOpen){
   spanItem.classList.remove("bg-red-500");
   spanItem.classList.add("bg-green-600")
}else{
   spanItem.classList.remove("bg-green-600");
   spanItem.classList.add("bg-red-500")
}

// ⚙️ Adiciona a seção do desenvolvedor logo abaixo do cardápio, com espaçamento antes do botão do carrinho
const devInfo = document.createElement("div");
devInfo.classList.add(
  "text-center",
  "mt-14",
  "p-6",
  "rounded-t-2xl",     // 🔥 SOMENTE EM CIMA ARREDONDADO
  "rounded-b-none",    // 🔥 PARTE DE BAIXO RETA
  "shadow-xl",
  "bg-black",           // 🔥 FUNDO PRETO FIXO (independente do tema)
  "border-t",
  "border-gray-700",
  "w-full"
);

devInfo.innerHTML = `
  <p class="mb-3 text-gray-300 text-sm tracking-wide">
    Desenvolvido por
  </p>

  <a href="https://www.dmdesigngrafico.com.br" target="_blank" title="Visite o site da DM Design Gráfico"
     class="inline-block">
    <img 
      src="/Imagem/DMDESIGN.png"
      class="mx-auto w-40 h-auto mb-4 cursor-pointer 
             transition-transform duration-300 hover:scale-110 drop-shadow-lg
             brightness-0 invert"   <!-- 👈 TRANSFORMA A LOGO EM BRANCO -->
    />
  </a>

  <div class="mt-2 mb-1">
    <p class="font-semibold text-gray-200 text-sm">
      Burguer Fresh — CNPJ: 12.345.678/0001-90
    </p>
    <p class="text-gray-400 text-xs mt-1">
      © 2025 Todos os direitos reservados
    </p>
  </div>

  <p class="text-xs font-medium text-red-400 mt-2 tracking-wide">
    DM DESIGN GRÁFICO — Tecnologia & Soluções para Delivery
  </p>
`;



// 🔹 Adiciona margem inferior para não encostar no botão fixo do carrinho
devInfo.style.marginBottom = "40px";

// 👉 Insere logo abaixo do menu
menu.insertAdjacentElement("afterend", devInfo);

// ===============================
// MODAL DE INGREDIENTES
// ===============================

// Seletores do modal
const ingredientesModal = document.getElementById("ingredientes-modal");
const ingredientesTitle = document.getElementById("ingredientes-title");
const ingredientesList = document.getElementById("ingredientes-list");
const fecharIngredientes = document.getElementById("ingredientes-close");
const salvarIngredientes = document.getElementById("ingredientes-save");
const ingredientesTotal = document.getElementById("ingredientes-total");

let produtoSelecionado = null;

// Banco de ingredientes com valor
const ingredientesBanco = {
  "Chesse Pickles": [
    { nome: "Hamburguer", preco: 2.00 },
    { nome: "Mussarela empada", preco: 1.50 },
    { nome: "Picles", preco: 6.70 },
    { nome: "Cebola Roxa", preco: 7.00 },
    { nome: "Alface", preco: 1.70 },
    { nome: "Maionese Dev", preco: 1.70 }
  ],
  "Chicken": [
    { nome: "Hamburguer de Frango empanado", preco: 2.00 },
    { nome: "Queijo Prato", preco: 1.50 },
    { nome: "Bacon", preco: 6.70 },
    { nome: "Cebola Roxa", preco: 7.00 },
    { nome: "Tomate", preco: 1.70 },
    { nome: "Alface", preco: 1.70 },
    { nome: "Maionese", preco: 1.70 }
  ],
  "Hamburguer Magno": [
    { nome: "Alface", preco: 2.00 },
    { nome: "Carne smash 180g", preco: 1.50 },
    { nome: "Queijo prato", preco: 6.70 },
    { nome: "Maionese da casa", preco: 7.00 },
    { nome: "Ovo", preco: 1.70 }
  ],
  "Hamburguer X Tudo": [
    { nome: "Alface", preco: 2.00 },
    { nome: "Carne smash 180g", preco: 1.50 },
    { nome: "Queijo prato", preco: 6.70 },
    { nome: "Maionese da casa", preco: 7.00 },
    { nome: "Ovo", preco: 1.70 }
  ],

  "Cupim Burguer": [
    { nome: "Alface Americana", preco: 10.00 },
    { nome: "Molho Dev", preco: 1.50 },
    { nome: "Cupim Defumado", preco: 14.70 },
    { nome: "Hamburguer", preco: 15.00 },
    { nome: "Queijo Prato", preco: 5.0 },
    { nome: "Bacon", preco: 4.70 }
  ]
};

// ===============================
// ABRIR MODAL
// ===============================
document.querySelectorAll(".open-ingredientes-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    produtoSelecionado = btn.dataset.name;

    ingredientesTitle.innerText = produtoSelecionado;
    ingredientesList.innerHTML = "";

    const lista = ingredientesBanco[produtoSelecionado] || [];

    // Criar checkboxes
    lista.forEach(item => {
      const div = document.createElement("div");
      div.classList.add("flex", "items-center", "gap-2");

      div.innerHTML = `
  <input type="checkbox" class="ingrediente-item" data-preco="${item.preco}" checked>
  <label>${item.nome}</label>
`;


      ingredientesList.appendChild(div);
    });

    atualizarPrecoIngredientes();
    ingredientesModal.classList.remove("hidden");
  });
});

// ===============================
// ATUALIZAR TOTAL
// ===============================
function atualizarPrecoIngredientes() {
  let total = 0;
  document.querySelectorAll(".ingrediente-item").forEach(input => {
    if (input.checked) {
      const precoIngrediente = parseFloat(input.dataset.preco);
      if (!isNaN(precoIngrediente)) total += precoIngrediente;
    }
  });

  ingredientesTotal.innerText = `Total: R$ ${total.toFixed(2)}`;
}

// ===============================
// MARCAR/DESELECIONAR
// ===============================
document.addEventListener("change", e => {
  if (e.target.classList.contains("ingrediente-item")) {
    atualizarPrecoIngredientes();
  }
});

// ===============================
// FECHAR MODAL
// ===============================
fecharIngredientes.addEventListener("click", () => {
  ingredientesModal.classList.add("hidden");
});

// ===============================
// SALVAR INGREDIENTES
// ===============================
salvarIngredientes.addEventListener("click", () => {
  // Pega os ingredientes desmarcados corretamente
  const desmarcados = [...document.querySelectorAll(".ingrediente-item")]
    .filter(input => !input.checked)
    .map(input => {
      // Pega o texto do label associado a este input
      const label = input.nextElementSibling; // assuming label vem logo após o input
      return label ? label.innerText.split(" — ")[0] : "";
    }).filter(nome => nome !== ""); // remove strings vazias

  // Calcula preço final baseado nos ingredientes selecionados
  const totalFinal = [...document.querySelectorAll(".ingrediente-item")]
    .filter(input => input.checked)
    .reduce((sum, input) => sum + parseFloat(input.dataset.preco), 0);

  // Adiciona produto personalizado no carrinho
  const existingItem = cart.find(item => item.name === produtoSelecionado && item.custom);

  if (existingItem) {
    existingItem.quantity += 1;
    existingItem.price = totalFinal; // Atualiza preço personalizado
    existingItem.removidos = desmarcados; // atualiza ingredientes removidos
  } else {
    cart.push({
      name: produtoSelecionado,
      price: totalFinal,
      quantity: 1,
      custom: true, // marca que é um produto personalizado
      removidos: desmarcados // salva os ingredientes desmarcados
    });
  }

  // Atualiza o carrinho visualmente
  updateCartModal();

  ingredientesModal.classList.add("hidden");

  Toastify({
    text: "Produto adicionado ao carrinho!",
    duration: 2000,
    gravity: "top",
    backgroundColor: "green"
  }).showToast();
});

// ===============================
// Função de login por conta do Google
// ===============================

const loginModal = document.getElementById("login-modal");
const loginModalBox = document.getElementById("login-modal-box");

const btnLogin = document.getElementById("btn-login");
const btnCadastro = document.getElementById("btn-cadastro");
const btnFecharLogin = document.getElementById("login-fechar");
const userPhoto = document.getElementById("user-photo");
const googleLoginBtn = document.getElementById("google-login-btn");

// ===============================
// Mostrar foto do usuário
// ===============================
function showUser(user) {
    btnLogin.style.display = "none";
    btnCadastro.style.display = "none";

    if (user.picture) {
        userPhoto.src = user.picture;
        userPhoto.classList.remove("hidden");
    }
}

// ===============================
// Restaurar login salvo
// ===============================
window.addEventListener("DOMContentLoaded", () => {
    const storedUser = localStorage.getItem("userGoogle");
    if (storedUser) {
        showUser(JSON.parse(storedUser));
    }
});

// ===============================
// Abrir modal
// ===============================
function openLoginModal() {
    loginModal.classList.remove("hidden");
    setTimeout(() => {
        loginModalBox.classList.remove("scale-95", "opacity-0");
        loginModalBox.classList.add("scale-100", "opacity-100");
    }, 50);
}

btnLogin.addEventListener("click", openLoginModal);
btnCadastro.addEventListener("click", openLoginModal);

// ===============================
// Fechar modal
// ===============================
btnFecharLogin.addEventListener("click", () => {
    loginModalBox.classList.add("scale-95", "opacity-0");
    loginModalBox.classList.remove("scale-100", "opacity-100");
    setTimeout(() => loginModal.classList.add("hidden"), 200);
});

// ===============================
// Callback do Google
// ===============================
function handleCredentialResponse(response) {
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const user = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')));

    console.log("Usuário logado:", user);
    localStorage.setItem("userGoogle", JSON.stringify(user));

    loginModal.classList.add("hidden");
    showUser(user);
}

// ===============================
// Inicialização do Google Identity
// ===============================
window.onload = function () {

    google.accounts.id.initialize({
        client_id: "621855197030-q8979a04uvji9232rluhc9183dhnedfh.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });

    // Renderiza o botão invisível oficial
    google.accounts.id.renderButton(
        document.getElementById("google-signin-btn"),
        { theme: "outline", size: "large" }
    );

    // Quando o usuário clicar no botão customizado → aciona o oficial
    googleLoginBtn.addEventListener("click", () => {
        document
            .querySelector("#google-signin-btn div[role=button]")
            .click();
    });
};

// ===============================
// MODAL DO PERFIL (FUNCIONAL) - CORRIGIDO
// ===============================

// Seletores do modal
const perfilModal = document.getElementById("perfilModal-container");
const perfilModalBox = document.getElementById("perfilModal-box");
const perfilNome = document.getElementById("perfilModal-nome");
const logoutBtn = document.getElementById("perfilModal-logout");

// Foto pequena no topo (abre/fecha o modal)
const userPhotocliente = document.getElementById("user-photo");

// Botões exibidos quando o usuário NÃO está logado
const btnLogincliente = document.getElementById("btn-login");
const btnCadastrocliente = document.getElementById("btn-cadastro");

// Estado do modal
let modalAberto = false;

// ===============================
// FUNÇÃO PARA ATUALIZAR UI DO USUÁRIO
// ===============================
function atualizarUIUsuario(user) {
    if (user) {
        // Mostra a foto do usuário somente se não estiver aberta
        if (userPhotocliente) {
            if (!modalAberto) userPhotocliente.src = user.photoURL || "./Imagem/default-user.png";
            userPhotocliente.classList.remove("hidden");
        }
        // Mostra o nome no modal
        if (perfilNome) perfilNome.textContent = `Olá! ${user.name || "Usuário"}`;

        // Esconde botões de login/cadastro
        if (btnLogincliente) btnLogincliente.style.display = "none";
        if (btnCadastrocliente) btnCadastrocliente.style.display = "none";
    } else {
        // Usuário deslogado
        if (userPhotocliente) userPhotocliente.classList.add("hidden");
        if (btnLogincliente) btnLogincliente.style.display = "block";
        if (btnCadastrocliente) btnCadastrocliente.style.display = "block";
        if (perfilNome) perfilNome.textContent = "Olá! Usuário";
    }
}

// ===============================
// FUNÇÃO PARA ABRIR MODAL
// ===============================
function abrirModal() {
    const user = JSON.parse(localStorage.getItem("userGoogle"));
    if (!user) return;

    // Atualiza o nome do modal, mas não a foto
    if (perfilNome) perfilNome.textContent = `Olá! ${user.name || "Usuário"}`;

    if (perfilModal) perfilModal.classList.remove("hidden");

    // Animação suave
    if (perfilModalBox) {
        perfilModalBox.classList.remove("scale-95", "opacity-0");
        perfilModalBox.classList.add("scale-100", "opacity-100");
    }

    modalAberto = true;
}

// ===============================
// FUNÇÃO PARA FECHAR MODAL
// ===============================
function fecharModal() {
    if (!modalAberto) return;

    if (perfilModalBox) {
        perfilModalBox.classList.add("scale-95", "opacity-0");
        perfilModalBox.classList.remove("scale-100", "opacity-100");
    }

    if (perfilModal) perfilModal.classList.add("hidden");

    modalAberto = false;
}

// ===============================
// TOGGLE AO CLICAR NA FOTO
// ===============================
if (userPhotocliente) {
    userPhotocliente.addEventListener("click", (e) => {
        e.stopPropagation(); // Evita fechar imediatamente
        if (modalAberto) {
            fecharModal();
        } else {
            abrirModal();
        }
    });
}

// ===============================
// FECHAR AO CLICAR FORA
// ===============================
document.addEventListener("click", (e) => {
    if (!modalAberto) return;
    if (e.target !== userPhotocliente && !perfilModalBox.contains(e.target)) {
        fecharModal();
    }
});

// ===============================
// FECHAR AO ROLAR OU MOVER O CARDÁPIO
// ===============================
window.addEventListener("scroll", fecharModal);

// ===============================
// LOGOUT
// ===============================
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("userGoogle");

        atualizarUIUsuario(null);

        fecharModal();
    });
}

// ===============================
// INICIALIZAÇÃO - Carrega usuário do localStorage
// ===============================
const userLogado = JSON.parse(localStorage.getItem("userGoogle"));
atualizarUIUsuario(userLogado);




// Função para normalizar strings (remover acentos e caracteres especiais)
function normalizeString(str) {
  return str
    .normalize('NFD')             // separa os acentos das letras
    .replace(/[\u0300-\u036f]/g, '') // remove os diacríticos
    .replace(/[^a-zA-Z0-9\s]/g, '') // remove caracteres especiais
    .toLowerCase()
    .trim();
}

// Seleciona o input de pesquisa e o container dos produtos
const searchInput = document.getElementById('searchInput');
const produtos = document.querySelectorAll('#menu main > div'); // cada produto
const noResults = document.getElementById('noResults');

searchInput.addEventListener('input', () => {
  const termo = normalizeString(searchInput.value);
  let encontrados = 0;

  produtos.forEach(produto => {
    const nome = normalizeString(produto.querySelector('p.font-bold').textContent);
    if (nome.includes(termo)) {
      produto.style.display = 'flex';
      encontrados++;
    } else {
      produto.style.display = 'none';
    }
  });

  // Mostra ou esconde a mensagem de "Nenhum produto encontrado"
  if (encontrados === 0) {
    noResults.classList.remove('hidden');
  } else {
    noResults.classList.add('hidden');
  }
});


// propagandas
const textos = [
  '<i class="fa-solid fa-money-bill-transfer"></i> Pagamento via PIX disponível',

  '<i class="fa-solid fa-bullhorn"></i> Confira nossas promoções exclusivas',
  '<i class="fa-solid fa-utensils"></i> Novidades no cardápio esta semana',
  '<i class="fa-solid fa-gift"></i> Aproveite nosso cupom especial de hoje'
];

let index = 0;
const elemento = document.getElementById("rotating-text");

// Define opacidade inicial
elemento.style.transition = "opacity 0.5s ease";
elemento.innerHTML = textos[index];

setInterval(() => {
  // Fade out
  elemento.style.opacity = 0;

  setTimeout(() => {
    // Troca o texto com HTML
    index = (index + 1) % textos.length;
    elemento.innerHTML = textos[index];

    // Fade in
    elemento.style.opacity = 1;
  }, 500); // duração do fade out
}, 3000); // tempo total entre trocas


//funçao de filtro
// Seleciona todos os cards de categoria
const categoriaCards = document.querySelectorAll('.categoria-card-modern-small');

// Seleciona todos os produtos
const produtoscate = document.querySelectorAll('.produto-item');

// Função para filtrar produtos
function filtrarProdutos(categoria) {
  produtos.forEach(produto => {
    if (produto.dataset.categoria === categoria) {
      produto.style.display = 'flex'; // mostra os produtos da categoria selecionada
    } else {
      produto.style.display = 'none'; // esconde os outros produtos
    }
  });
}

// Adiciona evento de clique em cada card de categoria
categoriaCards.forEach(card => {
  card.addEventListener('click', () => {
    const categoria = card.dataset.categoria;
    filtrarProdutos(categoria);
  });
});

// Opcional: mostra todos os produtos ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
  produtos.forEach(produto => produto.style.display = 'flex');
});

// ========================
// ABRIR MODAL NO CELULAR
// ========================

document.querySelectorAll(".produto-item").forEach(card => {
  card.addEventListener("click", function (event) {
    // 🔹 Ignora clique nos botões internos
    if (event.target.closest(".add-to-card-btn") || event.target.closest(".open-ingredientes-btn")) return;

    // 🔹 Só abre modal no celular
    if (window.innerWidth > 768) return;

    resetQty(); // reset quantidade

    const img = this.querySelector("img").src;
    const name = this.querySelector("p.font-bold").innerText;
    const desc = this.querySelector("p.text-sm").innerText;
    const price = this.querySelector("p.text-red-600").innerText;

    document.getElementById("modalImg").src = img;
    document.getElementById("modalName").innerText = name;
    document.getElementById("modalDesc").innerText = desc;
    document.getElementById("modalPrice").innerText = price;

    document.getElementById("mobileProductModal").classList.remove("hidden");
  });
});

// ========================
// FECHAR MODAL CLICANDO FORA
// ========================
document.getElementById("mobileProductModal").addEventListener("click", function (e) {
  if (e.target === this) this.classList.add("hidden");
});

// ========================
// SISTEMA DE QUANTIDADE
// ========================
let qty = 1;

document.getElementById("qtyPlus").addEventListener("click", function () {
  qty++;
  document.getElementById("qtyValue").innerText = qty;
});

document.getElementById("qtyMinus").addEventListener("click", function () {
  if (qty > 0) {
    qty--;
    document.getElementById("qtyValue").innerText = qty;
  }
});

// ========================
// RESET QUANTIDADE
// ========================
function resetQty() {
  qty = 1;
  document.getElementById("qtyValue").innerText = 1;
}

// ========================
// FUNÇÃO DO MODAL DE ALERTA
// ========================
function showAlertModal(message) {
  const modal = document.getElementById("alertModal");
  const msg = document.getElementById("alertModalMessage");
  const btn = document.getElementById("alertModalBtn");

  msg.textContent = message;
  modal.classList.remove("hidden");

  btn.onclick = () => {
    modal.classList.add("hidden");
  };
}

// ========================
// ADICIONAR AO CARRINHO
// ========================
document.getElementById("modalAddBtn").addEventListener("click", function () {

  // 🔥 BLOQUEIO DE QUANTIDADE 0
  if (qty === 0) {

    showAlertModal("Para continuar, selecione uma quantidade válida maior que zero antes de adicionar o produto ao carrinho.");

    return; // impede o restante da função
  }

  const name = document.getElementById("modalName").innerText;
  const priceText = document.getElementById("modalPrice").innerText.replace("R$ ", "").replace(",", ".");
  const price = parseFloat(priceText);

  const item = {
    name: name,
    quantity: qty,
    price: price,
    total: (qty * price).toFixed(2)
  };

  // Se cart já existe, usa ele. Se não existe, cria.
  if (typeof cart === "undefined") {
    window.cart = [];
  }

  cart.push(item);
  console.log("Carrinho atualizado:", cart);

  // Fecha modal
  document.getElementById("mobileProductModal").classList.add("hidden");

  resetQty();
});


  document.addEventListener("DOMContentLoaded", function () {
    const retirar = document.getElementById("retirarLocal");
    const address = document.getElementById("address");
    const warn = document.getElementById("address-warn");

    // Função para atualizar o estado
    function updateAddressState() {
      if (retirar.checked) {
        address.value = "";
        address.disabled = true;
        address.classList.add("bg-gray-200", "cursor-not-allowed");
        warn.classList.add("hidden");
      } else {
        address.disabled = false;
        address.classList.remove("bg-gray-200", "cursor-not-allowed");
      }
    }

    // Ativa ao clicar no checkbox
    retirar.addEventListener("change", updateAddressState);

    // Garantir estado correto ao abrir modal
    updateAddressState();
  });

 // Seleciona elementos
const meusPedidosBtn = document.getElementById("meus-pedidos-btn");
const meusPedidosModal = document.getElementById("meusPedidosModal");
const listaMeusPedidos = document.getElementById("listaMeusPedidos");
const fecharMeusPedidos = document.getElementById("fecharMeusPedidos");

// Função para mostrar pedidos
function mostrarMeusPedidos() {
  const pedidosFinalizados = JSON.parse(localStorage.getItem('pedidosFinalizados')) || [];
  listaMeusPedidos.innerHTML = "";

  if (pedidosFinalizados.length === 0) {
    listaMeusPedidos.innerHTML = "<li class='text-gray-500'>Nenhum pedido finalizado ainda.</li>";
  } else {
    pedidosFinalizados.forEach((pedido, index) => {

      // 📌 Formata a data/hora salva
      const dataHora = pedido.dataHora
        ? new Date(pedido.dataHora).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })
        : "Data não registrada";

      const li = document.createElement('li');
      li.className = "border-b border-gray-200 py-3";

      li.innerHTML = `
        <strong>Pedido ${index + 1}</strong><br>
        Produto: ${pedido.name}<br>
        Quantidade: ${pedido.quantity}<br>
        Valor: R$ ${pedido.price.toFixed(2)}<br>
        <span class="text-sm text-gray-600">📅 ${dataHora}</span>
      `;

      listaMeusPedidos.appendChild(li);
    });
  }

  // Abre o modal
  meusPedidosModal.classList.remove("hidden");
}

// Evento para abrir modal
meusPedidosBtn.addEventListener("click", (e) => {
  e.preventDefault();
  mostrarMeusPedidos();
});

// Evento para fechar modal
fecharMeusPedidos.addEventListener("click", () => {
  meusPedidosModal.classList.add("hidden");
});

// Fecha modal ao clicar fora da caixa
meusPedidosModal.addEventListener("click", (e) => {
  const modalContent = meusPedidosModal.querySelector("div");
  if (!modalContent.contains(e.target)) {
    meusPedidosModal.classList.add("hidden");
  }
});

// -----------------------------
// NAVEGAÇÃO ENTRE CATEGORIAS (CELULAR)
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const categoriaContainer = document.getElementById("categoriaContainer");
  const navLeft = document.getElementById("navLeft");
  const navRight = document.getElementById("navRight");

  if (!categoriaContainer || !navLeft || !navRight) return;

  const cards = Array.from(categoriaContainer.querySelectorAll(".categoria-card-modern-small"));

  let startIndex = 0;
  const visibleCount = 2;

  const isMobile = () => window.innerWidth < 768;

  // Transição suave
  cards.forEach((card) => {
    card.style.transition = "opacity 0.35s ease, transform 0.35s ease";
  });

  function renderMobileView() {
    cards.forEach((card, index) => {
      const isVisible = index >= startIndex && index < startIndex + visibleCount;

      if (isVisible) {
        card.style.display = "flex";
        requestAnimationFrame(() => {
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
        });
      } else {
        card.style.opacity = "0";
        card.style.transform = "translateY(12px)";
        // Esconde após a transição
        setTimeout(() => {
          if (card.style.opacity === "0") card.style.display = "none";
        }, 350);
      }
    });

    // Botões desabilitados quando não há mais cards
    navLeft.disabled = startIndex === 0;
    navRight.disabled = startIndex + visibleCount >= cards.length;

    [navLeft, navRight].forEach((btn) => {
      if (btn.disabled) {
        btn.classList.add("opacity-50", "cursor-not-allowed");
        btn.classList.remove("hover:text-red-600");
      } else {
        btn.classList.remove("opacity-50", "cursor-not-allowed");
        btn.classList.add("hover:text-red-600");
      }
    });
  }

  function restoreDesktopView() {
    cards.forEach((card) => {
      card.style.display = "";
      card.style.opacity = "";
      card.style.transform = "";
    });
  }

  function handleViewport() {
    if (isMobile()) {
      renderMobileView();
    } else {
      restoreDesktopView();
    }
  }

  // Botões NEXT / PREV
  navRight.addEventListener("click", () => {
    if (!isMobile()) return;
    if (startIndex + visibleCount >= cards.length) return;
    startIndex++;
    renderMobileView();
  });

  navLeft.addEventListener("click", () => {
    if (!isMobile()) return;
    if (startIndex <= 0) return;
    startIndex--;
    renderMobileView();
  });

  // Swipe para mobile
  let startX = 0;
  categoriaContainer.addEventListener("touchstart", (e) => {
    if (!isMobile()) return;
    startX = e.touches[0].clientX;
  }, { passive: true });

  categoriaContainer.addEventListener("touchend", (e) => {
    if (!isMobile()) return;
    const diff = startX - e.changedTouches[0].clientX;
    if (diff > 40 && startIndex + visibleCount < cards.length) {
      startIndex++;
      renderMobileView();
    } else if (diff < -40 && startIndex > 0) {
      startIndex--;
      renderMobileView();
    }
  }, { passive: true });

  window.addEventListener("resize", handleViewport);
  handleViewport();
});


//funçao lista 
document.addEventListener("DOMContentLoaded", () => {
  const categoriaCards = document.querySelectorAll(".categoria-card-modern-small");
  const produtos = document.querySelectorAll(".produto-item");

  categoriaCards.forEach(card => {
    card.addEventListener("click", () => {
      const categoria = card.dataset.categoria;

      produtos.forEach(prod => {
        if (categoria === "all") {
          prod.style.display = "flex";
        } else {
          prod.style.display = prod.dataset.categoria === categoria ? "flex" : "none";
        }
      });
    });
  });

  // Busca de produtos
  const searchInput = document.getElementById("searchInput");
  const noResults = document.getElementById("noResults");

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    let found = false;

    produtos.forEach(prod => {
      const name = prod.querySelector("p.font-bold").textContent.toLowerCase();
      if (name.includes(query)) {
        prod.style.display = "flex";
        found = true;
      } else {
        prod.style.display = "none";
      }
    });

    noResults.classList.toggle("hidden", found);
  });
});

function renderMenu() {
    const menu = document.getElementById("menu");
    if (!menu) return;

    menu.innerHTML = "";

    produtos.forEach(prod => {
        const card = document.createElement("div");
        card.className = "produto-item bg-white p-4 rounded shadow";

        card.innerHTML = `
            <img src="${prod.imagem}" class="w-full h-40 object-cover rounded mb-2">
            <p class="font-bold text-lg">${prod.nome}</p>
            <p class="text-sm text-gray-600">${prod.descricao}</p>
            <p class="text-red-600 font-bold">R$ ${prod.preco}</p>
        `;

        menu.appendChild(card);
    });
}
