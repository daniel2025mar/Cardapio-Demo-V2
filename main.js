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

  // ✅ Define a taxa de entrega: R$0,00 se o carrinho estiver vazio
  const taxaEntrega = cart.length > 0 ? 3.00 : 0.00;

  // ✅ Rolagem apenas dentro da lista de itens
  cartitemcontainer.style.maxHeight = "250px"; // limite visual
  cartitemcontainer.style.overflowY = "auto";  // rolagem vertical
  cartitemcontainer.style.marginBottom = "10px"; // espaço entre lista e total
  cartitemcontainer.style.paddingRight = "6px"; // evita corte da barra

  // ❌ Removemos restrição de altura do modal (não usar maxHeight no modal!)
  cardmodal.style.overflow = "visible"; // mantém tudo visível

  cart.forEach(item => {
    const cartItemElements = document.createElement("div");
    cartItemElements.classList.add("flex", "justify-between", "mb-4", "flex-col", "border-b", "pb-2");
    cartItemElements.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium">${item.name}</p>
          <p>Qtd: ${item.quantity}</p>
          <p class="font-medium mt-2">R$ ${item.price.toFixed(2)}</p>
        </div>

        <button class="remove-from-card-btn bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition" data-name="${item.name}">
          Remover
        </button>
      </div>
    `;
    total += item.price * item.quantity;
    cartitemcontainer.appendChild(cartItemElements);
  });

  // 💵 Calcula total com taxa
  const totalComTaxa = total + taxaEntrega;

  // 🧾 Exibe taxa e total
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

  // Atualiza contador
  cardCounter.innerHTML = cart.length;
}

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
 let inputValue = event.target.Value;
  if(inputValue !==""){
   andressInput.classList.remove("border-red-500")
   andresswarn.classList.add("hidden")
  }
})



checkout.addEventListener("click", function() {

  const isOpen = checkRestauranteOpen();
  if (!isOpen) {
    
    Toastify({
  text: "🍔 Dev Burguer está fechado no momento!",
  duration: 3000,
  close: true,
  gravity: "top", // `top` or `bottom`
  position: "left", // `left`, `center` or `right`
  stopOnFocus: true, // Prevents dismissing of toast on hover
  style: {
    background: "linear-gradient(to right, #b00000ff, #fc0000ff)",
  },
  onClick: function(){} // Callback after click
}).showToast();
    return;
  }

  if (cart.length === 0) {
    
     Toastify({
  text: "Seu carrinho está vazio",
  duration: 3000,
  close: true,
  gravity: "top", // `top` or `bottom`
  position: "left", // `left`, `center` or `right`
  stopOnFocus: true, // Prevents dismissing of toast on hover
  style: {
    background: "linear-gradient(to right, #adb000ff, #ebfc00ff)",
  },
  onClick: function(){} // Callback after click
}).showToast();
    return;
  }

  if (andressInput.value === "") {
    andresswarn.classList.remove("hidden");
    andressInput.classList.add("border-red-500");
    return;
  }

  // 💰 Valor fixo da taxa de entrega
  const taxaEntrega = 3.00;

  // 🛍️ Monta a lista dos itens do carrinho
  const cartItens = cart.map((item) => {
    return `${item.name} | Quantidade: ${item.quantity} | Preço: R$ ${item.price.toFixed(2)}`;
  }).join("\n");

  // 💵 Calcula o total dos produtos
  const totalProdutos = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // 💰 Soma com a taxa de entrega
  const totalComTaxa = totalProdutos + taxaEntrega;

  // 🧾 Monta a mensagem completa
  const mensagem = encodeURIComponent(
    `🛍️ *Resumo do Pedido:*\n\n${cartItens}\n\n📦 *Taxa de Entrega:* R$ ${taxaEntrega.toFixed(2)}\n💰 *Total:* R$ ${totalComTaxa.toFixed(2)}\n\n🏠 *Endereço:* ${andressInput.value}`
  );

  // ☎️ Número do WhatsApp
  const phone = "+5534998276982";

  // 🚀 Abre o WhatsApp com a mensagem formatada
  window.open(`https://wa.me/${phone}?text=${mensagem}`);

  cart = [];
  updateCartModal();

  // ✅ Exibe mensagem de confirmação amigável
  setTimeout(() => {
     Toastify({
  text: "🎉 Parabéns! Seu pedido foi enviado com sucesso e chegará em aproximadamente 30 minutos. 🍔🚀",
  duration: 3000,
  close: true,
  gravity: "top", // `top` or `bottom`
  position: "left", // `left`, `center` or `right`
  stopOnFocus: true, // Prevents dismissing of toast on hover
  style: {
    background: "linear-gradient(to right, #00b02cff, #00fc22ff)",
  },
  onClick: function(){} // Callback after click
}).showToast();
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
  <p>© 2025 DM DESIGN GRAFICO Soluções de Software LTDA</p>
`;

// 🔹 Adiciona margem inferior para não encostar no botão fixo do carrinho
devInfo.style.marginBottom = "40px";

// 👉 Insere logo abaixo do menu
menu.insertAdjacentElement("afterend", devInfo);

