
/* =============================
   CONFIGURAÇÃO DO SUPABASE
============================= */
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://jvxxueyvvgqakbnclgoe.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHh1ZXl2dmdxYWtibmNsZ29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjM3MzYsImV4cCI6MjA3OTU5OTczNn0.zx8i4hKRBq41uEEBI6s-Z70RyOVlvYz0G4IMgnemT3E";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
let clienteAtual = null;

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

  /* ===== DETECTAR DESBLOQUEIO ===== */
  if (clienteAtual && usuarioPediuDesbloqueio(texto)) {
    respostaSemPermissao(
      "desbloquear clientes",
      "liberar o acesso"
    );
    return;
  }

  /* ===== DETECTAR BLOQUEIO ===== */
  if (clienteAtual && usuarioPediuBloqueio(texto)) {
    respostaSemPermissao(
      "bloquear clientes",
      "realizar o bloqueio"
    );
    return;
  }

  if (aguardandoCliente) {
    aguardandoCliente = false;
    buscarCliente(texto);
    return;
  }

  if (aguardandoErro) {
    aguardandoErro = false;
    mostrarDigitando();
    setTimeout(() => {
      removerDigitando();
      adicionarMensagemBot(
        "Obrigado por explicar 👍<br><br>Já entendi o problema."
      );
    }, 1200);
    return;
  }

  mostrarDigitando();
  setTimeout(() => {
    removerDigitando();
    adicionarMensagemBot(
      "Entendi 😊<br><br>Pode me explicar um pouco melhor?"
    );
  }, 1200);
}

/* =============================
   BUSCAR CLIENTE
============================= */
async function buscarCliente(nomeDigitado) {
  mostrarDigitando();
  const termo = normalizarTexto(nomeDigitado);

  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome, email, status");

  removerDigitando();

  if (error || !data?.length) {
    adicionarMensagemBot("Ops 😕 Não consegui consultar os clientes agora.");
    return;
  }

  const cliente = data.find(c =>
    normalizarTexto(c.nome).includes(termo)
  );

  if (!cliente) {
    adicionarMensagemBot(
      "Hmm 🤔 Não encontrei nenhum cliente com esse nome.<br>" +
      "Tente digitar apenas o primeiro nome."
    );
    return;
  }

  clienteAtual = cliente;

  adicionarMensagemBot(
    "<strong>Cliente encontrado ✅</strong><br><br>" +
    `👤 <strong>Nome:</strong> ${cliente.nome}<br>` +
    `📧 <strong>E-mail:</strong> ${cliente.email}<br>` +
    `📌 <strong>Status:</strong> ${cliente.status}`
  );

  setTimeout(perguntarAcaoCliente, 1200);
}

/* =============================
   AÇÕES DO CLIENTE
============================= */
function perguntarAcaoCliente() {
  const div = document.createElement("div");
  div.className = "msg bot";
  div.innerHTML = `
    <div class="nome-bot">Luiza</div>
    Perfeito 😊<br><br>
    O que você deseja fazer com este cliente?
    <div class="opcoes-chat">
      <button onclick="acaoCliente('status')">📌 Ver status</button>
      <button onclick="acaoCliente('pedidos')">📦 Ver pedidos</button>
      <button onclick="acaoCliente('bloqueio')">🔒 Ver bloqueio</button>
    </div>
  `;
  chatMessages.appendChild(div);
  rolarChat();
}

window.acaoCliente = async function (acao) {
  mostrarDigitando();

  if (acao === "status") {
    setTimeout(() => {
      removerDigitando();
      adicionarMensagemBot(
        `📌 O status de <strong>${clienteAtual.nome}</strong> é <strong>${clienteAtual.status}</strong>.`
      );
    }, 1000);
  }

  if (acao === "pedidos") {
    setTimeout(() => {
      removerDigitando();
      adicionarMensagemBot(
        "📦 Em breve vou conseguir listar os pedidos desse cliente 😉"
      );
    }, 1000);
  }

  if (acao === "bloqueio") {
    const { data, error } = await supabase
      .from("clientes")
      .select("bloqueado")
      .eq("id", clienteAtual.id)
      .single();

    removerDigitando();

    if (error) {
      adicionarMensagemBot("Ops 😕 Não consegui verificar o bloqueio agora.");
      return;
    }

    if (data.bloqueado) {
      adicionarMensagemBot(
        `🔒 <strong>Atenção</strong><br><br>
         O cliente <strong>${clienteAtual.nome}</strong> está <strong>BLOQUEADO</strong>.`
      );
    } else {
      adicionarMensagemBot(
        `✅ Tudo certo!<br><br>
         O cliente <strong>${clienteAtual.nome}</strong> <strong>NÃO está bloqueado</strong>.`
      );
    }
  }
};

/* =============================
   UTILIDADES
============================= */
function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function usuarioPediuDesbloqueio(texto) {
  return normalizarTexto(texto).includes("desbloquear");
}

function usuarioPediuBloqueio(texto) {
  const t = normalizarTexto(texto);
  return t.includes("bloquear") || t.includes("bloqueio");
}

function respostaSemPermissao(acao, descricao) {
  mostrarDigitando();
  setTimeout(() => {
    removerDigitando();
    adicionarMensagemBot(
      "Entendo sua solicitação 😊<br><br>" +
      `No momento, eu não tenho permissão para <strong>${acao}</strong> no sistema.<br><br>` +
      `Para ${descricao}, é necessário entrar em contato com o <strong>administrador do sistema</strong>, que poderá avaliar a solicitação.`
    );
  }, 1200);
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
  div.innerHTML = `<div class="nome-bot">Luiza</div>${texto}`;
  chatMessages.appendChild(div);
  rolarChat();
}

/* =============================
   DIGITANDO
============================= */
function mostrarDigitando() {
  if (document.getElementById("digitando")) return;
  const div = document.createElement("div");
  div.className = "msg bot";
  div.id = "digitando";
  div.innerHTML = `<div class="nome-bot">Luiza</div><em>está digitando...</em>`;
  chatMessages.appendChild(div);
  rolarChat();
}

function removerDigitando() {
  document.getElementById("digitando")?.remove();
}

/* =============================
   INÍCIO
============================= */
function mensagemInicial() {
  mostrarDigitando();
  setTimeout(() => {
    removerDigitando();
    adicionarMensagemBot(
      "Oi 😊 Tudo bem?<br><br>" +
      "Eu sou a <strong>Luiza</strong>, do suporte.<br>" +
      "Como posso te ajudar agora?"
    );
    setTimeout(mostrarOpcoesIniciais, 600);
  }, 1200);
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

window.selecionarOpcao = function (opcao) {
  mostrarDigitando();
  setTimeout(() => {
    removerDigitando();
    if (opcao === "cliente") {
      adicionarMensagemBot(
        "Perfeito 😊<br><br>Por favor, me diga o <strong>nome do cliente</strong>."
      );
      aguardandoCliente = true;
    }

    if (opcao === "erro") {
      adicionarMensagemBot(
        "Certo 👍<br><br>Pode me explicar qual erro está acontecendo?"
      );
      aguardandoErro = true;
    }
  }, 1000);
};

/* =============================
   SCROLL
============================= */
function rolarChat() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}