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



checkout.addEventListener("click", function() {

  // 🔹 Verifica se o usuário está logado
  const storedUser = localStorage.getItem("userGoogle");
  if (!storedUser) {
    // Abre o modal de login
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

    return; // interrompe o envio do pedido
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
  // Continua com a lógica atual de montagem do pedido e envio
  // ==============================
  const cartItens = cart.map((item) => {
    let nomeProduto = item.name;
    if (item.custom && item.removidos && item.removidos.length > 0) {
      const removidosTexto = item.removidos.join(", ");
      nomeProduto += ` (Sem ${removidosTexto})`;
    }
    return `${nomeProduto} | Quantidade: ${item.quantity} | Preço: R$ ${item.price.toFixed(2)}`;
  }).join("\n");

  const totalProdutos = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  let taxaEntrega = retirarLocalChecked ? 0 : 3.00;
  const totalComTaxa = totalProdutos + taxaEntrega;

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

  cart = [];
  updateCartModal();
  cardmodal.style.display = "none";

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





//horario de funcionamento
function checkRestauranteOpen(){
   const data = new Date();
   const hora = data.getHours();
   return hora >= 9 && hora < 22;
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
  "mt-10",
  "p-5",
  "border-t",
  "border-gray-300",
  "text-sm",
  "text-gray-600",
  "bg-white",
  "w-full"
);

devInfo.innerHTML = `
  <p class="mb-2">Desenvolvido por</p>

  <a href="https://www.dmdesigngrafico.com.br" target="_blank" title="Visite o site da DM Design Gráfico">
    <img 
      src="/Imagem/DMDESIGN.png" 
      alt="Logo DM Design Gráfico"
      class="mx-auto w-40 h-auto mb-3 cursor-pointer hover:scale-110 transition-transform duration-300"
    />
  </a>

  <!-- 🔹 Linha adicionada conforme solicitado -->
  <p class="font-semibold mt-2">
    Dev Burguer - CNPJ: 12.345.678/0001-90 © Todos os direitos reservados. 2025
  </p>

  <p>© 2025 DM DESIGN GRÁFICO LTDA — Tecnologia e Soluções para Delivery</p>
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
  "Hamburguer Smash": [
    { nome: "Alface", preco: 2.00 },
    { nome: "Carne smash 180g", preco: 1.50 },
    { nome: "Queijo prato", preco: 6.70 },
    { nome: "Maionese da casa", preco: 7.00 },
    { nome: "Ovo", preco: 1.70 }
  ],
  "Hamburguer da Casa": [
    { nome: "Alface", preco: 2.00 },
    { nome: "Carne smash 180g", preco: 1.50 },
    { nome: "Queijo prato", preco: 6.70 },
    { nome: "Maionese da casa", preco: 7.00 },
    { nome: "Ovo", preco: 1.70 }
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
  ]
};

// ===============================
// ABRIR MODAL
// ===============================
document.querySelectorAll(".open-ingredientes-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    produtoSelecionado = btn.dataset.name;

    ingredientesTitle.innerText = `Ingredientes - ${produtoSelecionado}`;
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
// Carrega Google e só depois cria o botão invisível
// ===============================
window.onload = function () {

    google.accounts.id.initialize({
        client_id: "621855197030-q8979a04uvji9232rluhc9183dhnedfh.apps.googleusercontent.com",
        callback: handleCredentialResponse,
        auto_select: false
    });

    // Criar botão invisível
    const googleHiddenBtn = document.createElement("div");
    googleHiddenBtn.style.display = "none";
    document.body.appendChild(googleHiddenBtn);

    google.accounts.id.renderButton(
        googleHiddenBtn,
        { theme: "outline", size: "large" }
    );

    // Associar o botão customizado
    googleLoginBtn.addEventListener("click", () => {
        googleHiddenBtn.querySelector("button").click();
    });
};





