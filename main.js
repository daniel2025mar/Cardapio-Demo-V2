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

    const fecharModal = () => {
      modalContent.classList.add('scale-90', 'opacity-0');
      setTimeout(() => modalLojaFechada.classList.add('hidden'), 300);
    };

    // Remove event listeners anteriores para não duplicar
    btnFechar.replaceWith(btnFechar.cloneNode(true));
    btnOk.replaceWith(btnOk.cloneNode(true));

    document.getElementById('fechar-loja-fechada').addEventListener('click', fecharModal);
    document.getElementById('ok-loja-fechada').addEventListener('click', fecharModal);

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
  if (!retirarLocalChecked && andressInput.value.trim() === "") {
    andresswarn.classList.remove("hidden");
    andressInput.classList.add("border-red-500");
    return;
  }

  // ==============================
  // Monta a mensagem do pedido
  // ==============================
  const cartItens = cart.map(item => {
    let nomeProduto = item.name;
    if (item.custom && item.removidos && item.removidos.length > 0) {
      const removidosTexto = item.removidos.join(", ");
      nomeProduto += ` (Sem ${removidosTexto})`;
    }
    return `${nomeProduto} | Quantidade: ${item.quantity} | Preço: R$ ${item.price.toFixed(2)}`;
  }).join("\n");

  const totalProdutos = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const taxaEntrega = retirarLocalChecked ? 0 : 3.00;
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

  // ==============================
  // Limpa carrinho e atualiza UI
  // ==============================
  cart = [];
  updateCartModal();
  cardmodal.style.display = "none";

  // ✅ Atualiza o modal “Meus Pedidos”
  atualizarPedidos();

  // ==============================
  // Modal de sucesso
  // ==============================
  setTimeout(() => {
    const modal = document.getElementById('pedido-sucesso-modal');
    const modalBox = document.getElementById('pedido-modal-box');
    modal.classList.remove('hidden');

    setTimeout(() => {
      modalBox.classList.remove('scale-90', 'opacity-0');
      modalBox.classList.add('scale-100', 'opacity-100');
    }, 50);

    const btnOk = document.getElementById('pedido-sucesso-ok');

    // Remove event listener antigo antes de adicionar
    btnOk.replaceWith(btnOk.cloneNode(true));
    document.getElementById('pedido-sucesso-ok').addEventListener('click', () => {
      modalBox.classList.add('scale-90', 'opacity-0');
      setTimeout(() => modal.classList.add('hidden'), 300);
    });
  }, 500);

});

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
    Burguer Fresh- CNPJ: 12.345.678/0001-90 © Todos os direitos reservados. 2025
  </p>

  <p>© 2025 DM DESIGN GRÁFICO — Tecnologia e Soluções para Delivery</p>
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
  card.addEventListener("click", function () {

    if (window.innerWidth > 768) return; // só celular

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
 
  // Elementos do modal e botões
const checkoutBtn = document.getElementById('checkout-btn');
const modal = document.getElementById('meusPedidosModal');
const fecharBtn = document.getElementById('fecharPedidos');
const listaPedidos = document.getElementById('listaPedidos');
const btnMeusPedidos = document.getElementById('btnMeusPedidos');

// Recupera pedidos salvos no localStorage
let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

// Função para formatar data e hora
function formatarDataHora(date) {
  const d = new Date(date);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

// Função para atualizar a lista do modal
function atualizarPedidos() {
  listaPedidos.innerHTML = '';

  if (pedidos.length === 0) {
    const nenhum = document.createElement('div');
    nenhum.classList.add('text-center', 'text-gray-500', 'py-4', 'font-medium');
    nenhum.textContent = 'Você ainda não possui nenhum pedido';
    listaPedidos.appendChild(nenhum);
    return;
  }

  pedidos.forEach(pedido => {
    const item = document.createElement('div');
    item.classList.add('flex', 'flex-col', 'justify-between', 'p-2', 'bg-gray-100', 'rounded-lg', 'mb-2');
    item.innerHTML = `
      <div class="flex justify-between">
        <span>${pedido.nome} x${pedido.quantidade}</span>
        <span>R$ ${pedido.preco.toFixed(2)}</span>
      </div>
      <small class="text-gray-500">Pedido em: ${formatarDataHora(pedido.data)}</small>
    `;
    listaPedidos.appendChild(item);
  });
}

// Salva pedidos no localStorage
function salvarPedidos() {
  localStorage.setItem('pedidos', JSON.stringify(pedidos));
}

// Seleciona todos os botões de adicionar ao carrinho
const botoesAdicionar = document.querySelectorAll('.add-to-card-btn');

botoesAdicionar.forEach(botao => {
  botao.addEventListener('click', () => {
    const nome = botao.dataset.name;
    let preco = parseFloat(botao.dataset.price.replace(',', '.'));
    const agora = new Date();

    // Verifica se o produto já existe no pedido
    const existente = pedidos.find(p => p.nome === nome);
    if (existente) {
      existente.quantidade += 1;
      existente.data = agora; // atualiza a data para a última vez que o produto foi adicionado
    } else {
      pedidos.push({ nome, quantidade: 1, preco, data: agora });
    }

    salvarPedidos();
    atualizarPedidos();
  });
});

// Botão Finalizar Pedido
checkoutBtn.addEventListener('click', () => {
  if (pedidos.length === 0) {
    alert('Adicione produtos antes de finalizar o pedido!');
    return;
  }
  atualizarPedidos();
  modal.classList.remove('hidden');
  modal.classList.add('flex');
});

// Botão "Meus Pedidos"
btnMeusPedidos.addEventListener('click', () => {
  atualizarPedidos();
  modal.classList.remove('hidden');
  modal.classList.add('flex');
});

// Botão Fechar modal
fecharBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
});

// Atualiza pedidos ao carregar a página
window.addEventListener('DOMContentLoaded', atualizarPedidos);
