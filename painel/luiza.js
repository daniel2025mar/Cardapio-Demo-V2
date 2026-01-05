
/* =============================
   CONFIGURAÇÃO DO SUPABASE
============================= */
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYWtibmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* =============================
   ELEMENTOS DO CHAT
============================= */
const btnChat = document.getElementById("btnChat");
const chatBox = document.getElementById("chatBox");
const fecharChat = document.getElementById("fecharChat");
const btnEnviar = document.getElementById("btnEnviar");
const inputMensagem = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

/* =============================
   CONTROLE DE ESTADO
============================= */
let iniciou = false;
let aguardandoCliente = false;
let aguardandoErro = false;

/* =============================
   ABRIR / FECHAR CHAT
============================= */
btnChat.onclick = () => {
  chatBox.classList.toggle("ativo");

  if (!iniciou) {
    mensagemInicial();
    iniciou = true;
  }
};

fecharChat.onclick = () => {
  chatBox.classList.remove("ativo");
};

/* =============================
   ENVIO DE MENSAGEM
============================= */
btnEnviar.onclick = enviarMensagem;

inputMensagem.addEventListener("keypress", e => {
  if (e.key === "Enter") enviarMensagem();
});

function enviarMensagem() {
  const texto = inputMensagem.value.trim();
  if (!texto) return;

  adicionarMensagemUsuario(texto);
  inputMensagem.value = "";

  /* -------- FLUXO CLIENTE -------- */
  if (aguardandoCliente) {
    aguardandoCliente = false;
    buscarCliente(texto);
    return;
  }

  /* -------- FLUXO ERRO -------- */
  if (aguardandoErro) {
    aguardandoErro = false;

    mostrarDigitando();
    setTimeout(() => {
      removerDigitando();
      adicionarMensagemBot(
        "Obrigado por explicar 👍<br><br>" +
        "Já entendi o problema.<br>" +
        "Vou encaminhar isso para a equipe técnica."
      );
    }, 1500);
    return;
  }

  /* -------- PADRÃO -------- */
  mostrarDigitando();
  setTimeout(() => {
    removerDigitando();
    adicionarMensagemBot(
      "Entendi 😊<br><br>" +
      "Pode me explicar um pouco melhor?"
    );
  }, 1500);
}

/* =============================
   BUSCAR CLIENTE (IGNORA ACENTO)
============================= */
async function buscarCliente(nomeDigitado) {
  mostrarDigitando();

  const nomeNormalizado = normalizarTexto(nomeDigitado);

  const { data, error } = await supabase
    .from("clientes")
    .select("nome, email, status");

  removerDigitando();

  if (error || !data || data.length === 0) {
    adicionarMensagemBot(
      "Hmm 🤔 Não encontrei nenhum cliente com esse nome."
    );
    return;
  }

  const cliente = data.find(c =>
    normalizarTexto(c.nome).includes(nomeNormalizado)
  );

  if (!cliente) {
    adicionarMensagemBot(
      "Não localizei esse cliente 😕<br>" +
      "Pode conferir se o nome está correto?"
    );
    return;
  }

  mostrarDigitando();

  setTimeout(() => {
    removerDigitando();

    adicionarMensagemBot(
      "<strong>Cliente encontrado ✅</strong><br><br>" +
      `👤 <strong>Nome:</strong> ${cliente.nome}<br>` +
      `📧 <strong>E-mail:</strong> ${cliente.email}<br>` +
      `📌 <strong>Status:</strong> ${cliente.status}`
    );

    // Mensagem final
    setTimeout(() => {
      mostrarDigitando();

      setTimeout(() => {
        removerDigitando();
        adicionarMensagemBot(
          "ℹ️ No momento, eu ainda não estou treinada para continuar esse atendimento sozinha.<br><br>" +
          "Um atendente humano dará continuidade em breve, tudo bem? 😊<br>" +
          "Obrigada pela compreensão!"
        );
      }, 2000);

    }, 2500);
  }, 1500);
}

/* =============================
   NORMALIZAR TEXTO
============================= */
function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/* =============================
   MENSAGENS
============================= */
function adicionarMensagemUsuario(texto) {
  const div = document.createElement("div");
  div.className = "msg user";
  div.innerText = texto;
  chatMessages.appendChild(div);
  rolarChat();
}

function adicionarMensagemBot(texto) {
  const div = document.createElement("div");
  div.className = "msg bot";
  div.innerHTML = `
    <div class="nome-bot">Luiza</div>
    ${texto}
  `;
  chatMessages.appendChild(div);
  rolarChat();
}

/* =============================
   DIGITANDO...
============================= */
function mostrarDigitando() {
  if (document.getElementById("digitando")) return;

  const div = document.createElement("div");
  div.className = "msg bot";
  div.id = "digitando";
  div.innerHTML = `
    <div class="nome-bot">Luiza</div>
    <em>está digitando...</em>
  `;
  chatMessages.appendChild(div);
  rolarChat();
}

function removerDigitando() {
  const div = document.getElementById("digitando");
  if (div) div.remove();
}

/* =============================
   MENSAGEM INICIAL + OPÇÕES
============================= */
function mensagemInicial() {
  mostrarDigitando();

  setTimeout(() => {
    removerDigitando();
    adicionarMensagemBot(
      "Oi 😊 Tudo bem?<br><br>" +
      "Eu sou a <strong>Luiza</strong>, do suporte.<br>" +
      "Estou aqui pra te ajudar no que precisar.<br><br>" +
      "<em>Sobre o que você precisa de ajuda agora?</em>"
    );

    setTimeout(mostrarOpcoesIniciais, 600);
  }, 1500);
}

function mostrarOpcoesIniciais() {
  const div = document.createElement("div");
  div.className = "msg bot";
  div.innerHTML = `
    <div class="nome-bot">Luiza</div>
    Escolha uma opção 👇
    <div class="opcoes-chat">
      <button onclick="selecionarOpcao('cliente')">👤 Cliente</button>
      <button onclick="selecionarOpcao('erro')">🛠 Erros do sistema</button>
    </div>
  `;
  chatMessages.appendChild(div);
  rolarChat();
}

/* =============================
   OPÇÕES
============================= */
window.selecionarOpcao = function (opcao) {
  mostrarDigitando();

  setTimeout(() => {
    removerDigitando();

    if (opcao === "cliente") {
      adicionarMensagemBot(
        "Perfeito 😊<br><br>" +
        "Por favor, me diga<br>" +
        "<strong>o nome do cliente</strong>."
      );
      aguardandoCliente = true;
    }

    if (opcao === "erro") {
      adicionarMensagemBot(
        "Certo 👍<br><br>" +
        "Pode me explicar qual erro está acontecendo no sistema?"
      );
      aguardandoErro = true;
    }
  }, 1200);
};

/* =============================
   SCROLL
============================= */
function rolarChat() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
