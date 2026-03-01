
/* =============================
   CONFIGURAÇÃO DO SUPABASE
============================= */

import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { abrirCalculadora } from "./Calculadora.js";

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
let aguardandoFeedback = false;
let confirmandoEnvioFeedback = false; // controla se o usuário disse sim ou não
let aguardandoErro = false;
let aguardandoContinuidade = false;
let clienteAtual = null;
let aguardandoMesaLivre = false;
let cacheMesasLivres = [];


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

  setTimeout(() => {
    chatMessages.innerHTML = "";
    iniciou = false;
    aguardandoCliente = false;
    aguardandoErro = false;
    aguardandoContinuidade = false;
    clienteAtual = null;
  }, 3000);
};

/* =============================
   ENVIO DE MENSAGEM
============================= */
btnEnviar.onclick = enviarMensagem;
inputMensagem.addEventListener("keypress", e => {
  if (e.key === "Enter") enviarMensagem();
});

/* =============================
   LISTA DE ATUALIZAÇÕES DO SISTEMA
============================= */
const atualizacoes = [
  {
    id: 1,
    data: "04/10/2025",
    descricao: [
      "Função adicionada de Cadastro de Clientes",
      "Função de permissões restritas adicionadas",
      "Função adicionada de Cadastro de Funcionarios",
      "Função adicionada de Cadastro de produtos",
      "Função de deslogar do painel de inatividade"
    ]
  },
  {
    id: 2,
    data: "20/12/2025",
    descricao: [
      "Adicionado botão de ver atualizações no painel",
      "Notificações de Pedidos Recebidos"
    ]
  },
  {
    id: 3,
    data: "18/12/2025",
    descricao: ["Corrigido problema de layout em telas pequenas"]
  },
  {
    id: 4,
    data: "15/12/2025",
    descricao: ["Nova funcionalidade de seleção de cidade implementada"]
  },
  {
    id: 5,
    data: "25/12/2025",
    descricao: ["Mudanças no Layout para datas comemorativas ('Tela de login')"]
  },
  {
    id: 6,
    data: "09/01/2026",
    descricao: [
      "Adicionando Luiza bot para suporte",
      "Função de cadastro da empresa no cardápio",
      "Função Cadastro de produtos",
      "Função de cadastro e gerenciamento de mesa (QR Code)",
      "Funcionalidade para o Bot Luiza",
      "Funçao Calculadora",
      "Funçao ver todos os clientes",
      "Melhorias na Luiza bot"
    ]
  },
  {
      id: 7,
      data: "21/01/2026",
      descricao: ["Adicionando Luiza bot para suporte",
                  "Melhorias no cardapio",
                  "Funçao de mensagem de lembrete do Carrinho",
                  "Funçao de carrinho de produtos"
                  
      ]
    },
    {
      id: 8,
      data: "01/03/2026",
      descricao: ["Funçao de Cadastro do Usuario",
                  "Melhorias no cardapio",
                  "Funçao de envio de pedidos para whatsapp da empresa",
                  "Funçao Relatorio de Garçom e Entregadores PDF",
                  "Melhorias no menu de pedidos",
                  "Funçao Historico de pedidos no cardapio",
                  "Funçao do Sistema de entregador",
                  "Funcao Rota de entregas de Pedido",
                  "Funçao de comprovante por foto sistema entregador",
                  "Funçao do Sistema Garçom"
                  
      ]
    }
];

/* =============================
   FUNÇÃO ENVIAR MENSAGEM
============================= */

function enviarMensagem() {
  const texto = inputMensagem.value.trim();
  if (!texto) return;

  adicionarMensagemUsuario(texto);
  inputMensagem.value = "";

  const textoNormalizado = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

    
  /* =============================
   ÁREA DO ENTREGADOR
============================= */


const LINK_ENTREGADOR =
  "https://daniel2025mar.github.io/Cardapio-Demo-V2/painelentregador/loginentregador.html";

// estado global
if (typeof window.__entregadorState === "undefined") {
  window.__entregadorState = {
    ativo: false,
    aguardandoEnvioAcesso: false,
    aguardandoNomeEntregador: false
  };
}

// palavras relacionadas ao entregador
const palavrasEntregador = [
  "entregador",
  "entrega",
  "area do entregador",
  "pedido nao encontrado",
  "atraso na entrega",
  "dificuldade com endereco",
  "outro problema"
];

// palavras que indicam painel
const palavrasPainel = [
  "painel",
  "link",
  "login",
  "acesso",
  "sistema"
];

const chamouEntregador = palavrasEntregador.some(p =>
  textoNormalizado.includes(p)
);

const pediuPainel = palavrasPainel.some(p =>
  textoNormalizado.includes(p)
);

/* 👉 CASO 1: PEDIU PAINEL */
if (pediuPainel && !window.__entregadorState.aguardandoEnvioAcesso) {
  mostrarDigitando();
  setTimeout(() => {
    removerDigitando();
    adicionarMensagemBot(
      `Perfeito 😊<br><br>
      Aqui está o <strong>link do painel do entregador</strong> 👇<br><br>
      🚚 <a href="${LINK_ENTREGADOR}" target="_blank">
      Acessar Painel do Entregador</a><br><br>
      Você precisa que eu envie esse acesso para o <strong>entregador</strong>?<br>
      Responda com <strong>sim</strong> ou <strong>não</strong>.`
    );
    window.__entregadorState.aguardandoEnvioAcesso = true;
  }, 800);

  return;
}

/* 👉 CONFIRMAÇÃO */
if (window.__entregadorState.aguardandoEnvioAcesso) {
  window.__entregadorState.aguardandoEnvioAcesso = false;

  if (usuarioDisseSim(texto)) {
    window.__entregadorState.aguardandoNomeEntregador = true;

    mostrarDigitando();
    setTimeout(() => {
      removerDigitando();
      adicionarMensagemBot(
        "Perfeito 🚚💙<br><br>Qual é o <strong>nome de usuário do entregador</strong>?"
      );
    }, 800);

    return;
  }

  if (usuarioDisseNao(texto)) {
    mostrarDigitando();
    setTimeout(() => {
      removerDigitando();
      adicionarMensagemBot(
        "Tudo bem 😊<br><br>Se precisar do acesso depois, é só me chamar."
      );
    }, 800);
    return;
  }

  adicionarMensagemBot(
    "Por favor 😊<br>Responda apenas com <strong>sim</strong> ou <strong>não</strong>."
  );
  window.__entregadorState.aguardandoEnvioAcesso = true;
  return;
}

/* 👉 RECEBE USERNAME DO ENTREGADOR */
if (window.__entregadorState.aguardandoNomeEntregador) {
  window.__entregadorState.aguardandoNomeEntregador = false;

  const usernameEntregador = texto.trim();

  mostrarDigitando();

  setTimeout(async () => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("username, password")
      .ilike("username", usernameEntregador)
      .eq("cargo", "Entregador")
      .eq("ativo", true)
      .single();

    removerDigitando();

    if (error || !data) {
      adicionarMensagemBot(
        `❌ Não encontrei nenhum entregador ativo com o usuário <strong>${usernameEntregador}</strong>.<br><br>
        Verifique o nome e tente novamente.`
      );

      window.__entregadorState.aguardandoNomeEntregador = true;
      return;
    }

    adicionarMensagemBot(
      `🚚 <strong>Acesso do Entregador</strong><br><br>
      👤 <strong>Usuário:</strong> ${data.username}<br>
      🔑 <strong>Senha:</strong> ${data.password}<br><br>
      🌐 <a href="${LINK_ENTREGADOR}" target="_blank">
      Acessar Painel do Entregador</a><br><br>
      Basta enviar essas informações para o entregador 😊`
    );
  }, 800);

  return;
}

/* 👉 ÁREA DO ENTREGADOR */
if (chamouEntregador && !window.__entregadorState.ativo) {
  window.__entregadorState.ativo = true;

  mostrarDigitando();
  setTimeout(() => {
    removerDigitando();
    adicionarMensagemBot(
      `🚚 <strong>Área do Entregador</strong><br><br>
      Escolha uma opção ou descreva o que você precisa:<br><br>
      📦 Pedido não encontrado<br>
      ⏰ Atraso na entrega<br>
      📍 Dificuldade com endereço<br>
      ❓ Outro problema`
    );
  }, 1000);

  return;
}

/* 👉 FALLBACK */
if (window.__entregadorState.ativo) {
  mostrarDigitando();
  setTimeout(() => {
    removerDigitando();
    adicionarMensagemBot(
      "Entendi 👍<br><br>Pode me explicar melhor o que você precisa?"
    );
  }, 800);

  return;
}

/* =============================
   DETECÇÃO DE CORES PISCANDO NAS MESAS
============================= */
const coresPiscando = ["piscando", "amarelo", "amarela", "laranja", "laranjado"];

const mencionouCor = coresPiscando.some(p => textoNormalizado.includes(p));

if (mencionouCor) {
  mostrarDigitando();
  setTimeout(() => {
    removerDigitando();
    adicionarMensagemBot(
      "Olá 😊<br><br>" +
      "A cor que você está visualizando na mesa indica que ela ainda está aguardando atendimento. " +
      "Por favor, aguarde até que um atendente seja direcionado para atendê-la. 💙"
    );
  }, 800);
  return; // interrompe o processamento normal
}

  /* =============================
     FECHAR CALCULADORA - PRIORIDADE
  ============================ */
  const palavrasFechar = ["fechar", "feche", "fecha", "sair"];
  const palavrasCalc = ["calculadora", "calc"];

  const querFecharCalculadora = palavrasFechar.some(pf =>
    palavrasCalc.some(pc => textoNormalizado.includes(pf) && textoNormalizado.includes(pc))
  );

  if (querFecharCalculadora) {
    mostrarDigitando();
    setTimeout(() => {
      removerDigitando();
      adicionarMensagemBot("Ok, fechando a calculadora 💙");
      fecharCalculadora(); // fecha imediatamente
    }, 800);
    return; // interrompe qualquer outro processamento
  }

  /* =============================
     ABRIR CALCULADORA
  ============================ */
  const abrirCalcKeywords = ["calculadora", "abrir calculadora", "abrir calc"];
  if (abrirCalcKeywords.some(p => textoNormalizado.includes(p))) {
    mostrarDigitando();
    setTimeout(() => {
      removerDigitando();
      adicionarMensagemBot("Aqui está a calculadora 🧮. Você pode usar agora!");
      abrirCalculadora();
    }, 800);
    return;
  }

  /* =============================
   FUNCIONAMENTO SEM INTERNET
============================= */
const palavrasSemInternet = ["sem conexao", "sem conexão", "offline", "internet"];

const perguntouSemInternet = palavrasSemInternet.some(p =>
  textoNormalizado.includes(p)
);

if (perguntouSemInternet) {
  mostrarDigitando();
  setTimeout(() => {
    removerDigitando();
    adicionarMensagemBot(
      "Infelizmente, nosso sistema não funciona sem conexão com a internet 💻🌐.<br>" +
      "Como utilizamos banco de dados na nuvem, é necessário estar online para acessar todas as funcionalidades."
    );

    // Depois de enviar a mensagem, pergunta se deseja mais alguma coisa
    setTimeout(() => {
      mostrarDigitando();
      setTimeout(() => {
        removerDigitando();
        adicionarMensagemBot(
          "Posso te ajudar com mais alguma coisa? 😊<br>" +
          "Responda com <strong>sim</strong> ou <strong>não</strong>."
        );
        aguardandoContinuidade = true; // ativa o estado para resposta de continuidade
      }, 800);
    }, 500); // pequeno delay antes de mostrar a pergunta
  }, 4000); // delay de 4 segundos para a primeira resposta
  return; // interrompe qualquer outro processamento
}

     /* =============================
     CONSULTA DE MESAS OCUPADAS
  ============================ */
  const palavrasMesa = ["mesa", "mesas"];
  const palavrasOcupada = ["ocupada", "ocupado", "ocupadas", "ocupados"];

  const perguntouMesaOcupada =
    palavrasMesa.some(p => textoNormalizado.includes(p)) &&
    palavrasOcupada.some(p => textoNormalizado.includes(p));

  if (perguntouMesaOcupada) {
    mostrarDigitando();

    setTimeout(async () => {
      removerDigitando();
      adicionarMensagemBot("Um momento, vou verificar no sistema. ⏳");

      // Delay de 10 segundos antes da consulta
      setTimeout(async () => {
        await verificarMesas();
      }, 10000);

    }, 800);

    return;
  }

/* =============================
   CONSULTA DE VENCIMENTO MENSAL
============================= */
const palavrasVencimento = ["vence", "vencimento", "mensalidade", "pagamento mensal"];

const perguntouVencimento = palavrasVencimento.some(p => textoNormalizado.includes(p));

if (perguntouVencimento) {
  mostrarDigitando();
  setTimeout(() => {
    removerDigitando();
    adicionarMensagemBot(
      "😊 Entendi sua dúvida sobre a mensalidade ou vencimento do sistema.<br><br>" +
      "No momento, ainda não consigo informar essa informação diretamente, " +
      "mas você pode verificar com o administrador do sistema."
    );
  }, 1000);
  return; // interrompe o processamento normal
}

  /* =============================
   VERIFICAR MESAS NO SUPABASE
============================= */
async function verificarMesas() {
  mostrarDigitando();

  const { data, error } = await supabase
    .from("mesas")
    .select("descricao, cliente_presente");

  removerDigitando();

  if (error || !data?.length) {
    adicionarMensagemBot(
      "Ops 😕 Não consegui verificar as mesas no momento."
    );
    return;
  }

  const mesasOcupadas = data.filter(m => m.cliente_presente === true);
  const mesasLivres = data.filter(m => m.cliente_presente === false);

  // guarda em memória para o próximo passo
  cacheMesasLivres = mesasLivres;

  if (mesasOcupadas.length === 0) {
    adicionarMensagemBot(
      "✅ Ótima notícia!<br><br>Todas as mesas estão <strong>livres</strong> no momento 😊"
    );
    return;
  }

  if (mesasLivres.length === 0) {
    adicionarMensagemBot(
      "⚠️ No momento, <strong>todas as mesas estão ocupadas</strong>."
    );
    return;
  }

  aguardandoMesaLivre = true;

  adicionarMensagemBot(
    `📊 Situação das mesas:<br><br>
     🔴 <strong>Ocupadas:</strong> ${mesasOcupadas.length}<br>
     🟢 <strong>Livres:</strong> ${mesasLivres.length}<br><br>
     Se quiser, posso te ajudar a localizar uma mesa livre 😉`
  );
}

  /* =============================
     LOCALIZAR MESA LIVRE
  ============================ */
  if (aguardandoMesaLivre) {
    const respostaSim = ["sim", "s", "quero", "quero sim", "ok", "pode"];

    if (respostaSim.some(p => textoNormalizado.includes(p))) {
      aguardandoMesaLivre = false;

      if (!cacheMesasLivres.length) {
        adicionarMensagemBot(
          "Hmm 🤔 Parece que não há mesas livres agora."
        );
        return;
      }

      const mesaDisponivel = cacheMesasLivres[0]; // pega a primeira livre

      mostrarDigitando();
      setTimeout(() => {
        removerDigitando();
        adicionarMensagemBot(
          `🪑 Mesa disponível encontrada!<br><br>
           👉 <strong>Mesa:</strong> ${mesaDisponivel.descricao}<br><br>
           Você já pode utilizá-la 😊`
        );
      }, 1000);

      cacheMesasLivres = [];
      return;
    }

    // Se respondeu algo diferente
    adicionarMensagemBot(
      "Tudo bem 😊<br>Se precisar de uma mesa livre, é só me avisar."
    );
    aguardandoMesaLivre = false;
    cacheMesasLivres = [];
    return;
  }


  /* =============================
   O QUE É O GESTIOMAX
============================= */

const mencionouGestioMax = textoNormalizado.includes("gestiomax");

const frasesGestioMax = [
  "o que e",
  "oque e",
  "para que serve",
  "explica",
  "me fala",
  "faz o que"
];

const perguntouExplicitamenteGestioMax = frasesGestioMax.some(frase =>
  textoNormalizado.includes(frase)
);

// Caso especial: digitou apenas "gestiomax"
const digitouSomenteGestioMax =
  textoNormalizado.trim() === "gestiomax";

const perguntouGestioMax =
  mencionouGestioMax &&
  (perguntouExplicitamenteGestioMax || digitouSomenteGestioMax);

if (perguntouGestioMax) {
  mostrarDigitando();

  setTimeout(() => {
    removerDigitando();
    adicionarMensagemBot(
      `<strong>O GestioMax</strong> é um sistema completo e inteligente de <strong>gestão de cardápio</strong>, 
      desenvolvido para facilitar o dia a dia de restaurantes, lanchonetes, pizzarias e negócios do setor alimentício 🍽️<br><br>

      Com o GestioMax, você consegue realizar o <strong>cadastro e gerenciamento de produtos</strong>, 
      controlar mesas, organizar pedidos e manter todas as informações centralizadas em um único lugar, 
      de forma simples, rápida e segura.<br><br>

      Além disso, o sistema atende tanto o <strong>atendimento interno</strong> (mesas no local) 
      quanto o <strong>atendimento externo</strong>, permitindo que seus clientes acessem o 
      <strong>cardápio digital</strong> também para <strong>delivery</strong> 📦🚀<br><br>

      Ou seja, o GestioMax não é apenas um cardápio digital — ele é uma <strong>plataforma completa de gestão</strong>, 
      pensada para otimizar processos, melhorar a experiência do cliente e apoiar o crescimento do seu negócio de forma organizada 💙<br><br>

      Se quiser, posso te explicar melhor alguma funcionalidade específica 😊`
    );
  }, 1200);

  return;
}


  /* =============================
     ATUALIZAÇÕES DO SISTEMA
  ============================ */
  const pediuAtualizacao = ["atualizacao", "atualização", "novidade", "novidades"]
    .some(p => textoNormalizado.includes(p));

  if (pediuAtualizacao) {
    mostrarDigitando();
    setTimeout(() => {
      removerDigitando();
      adicionarMensagemBot(
        "Ah, um momento 😊<br>Vou te mostrar o que tem na atualização do sistema..."
      );

      setTimeout(() => {
        mostrarDigitando();
        setTimeout(() => {
          removerDigitando();

          let mensagem = "<strong>✨ Atualizações do Sistema ✨</strong><br><br>";
          atualizacoes.forEach(a => {
            mensagem += `<div style="margin-bottom:10px;"><strong>${a.data}</strong><ul>`;
            a.descricao.forEach(d => {
              mensagem += `<li>${d}</li>`;
            });
            mensagem += "</ul></div>";
          });

          adicionarMensagemBot(mensagem);
        }, 1000);
      }, 1200);
    }, 800);
    return;
  }

  /* =============================
   VER TODOS OS CLIENTES
============================= */

const pediuTodosClientes = [
  "todos os clientes",
  "ver todos os clientes",
  "listar clientes",
  "lista de clientes",
  "ver clientes no sistema"
].some(p => textoNormalizado.includes(p));

if (pediuTodosClientes) {
  mostrarDigitando();

  setTimeout(() => {
    removerDigitando();
    adicionarMensagemBot(
      "Um momento 😊<br><br>Vou te mostrar todos os clientes do sistema."
    );

    // Delay de 10 segundos para abrir o modal
    setTimeout(() => {
      abrirModalClientes();
    }, 10000);

  }, 800);

  return;
}

function abrirModalClientes() {
  document
    .getElementById("modalClientes")
    .classList.add("ativo");
}

  /* =============================
     CARDÁPIO — BLOCO COMPLETO
  ============================ */
  if (typeof window.__cardapioState === "undefined") {
    window.__cardapioState = { aguardando: false, linkEnviado: false };
  }

  const pediuCardapio =
    textoNormalizado.includes("cardapio") ||
    textoNormalizado.includes("menu");

  if (pediuCardapio && !window.__cardapioState.aguardando) {
    mostrarDigitando();
    setTimeout(() => {
      removerDigitando();
      adicionarMensagemBot(
        "Claro 😊<br><br>" +
        "Você gostaria que eu te enviasse o <strong>link do cardápio</strong> agora?"
      );
      window.__cardapioState.aguardando = true;
    }, 1000);
    return;
  }

  if (window.__cardapioState.aguardando) {
    const disseSim = ["sim", "s", "claro", "quero", "ok", "pode", "manda"]
      .some(p => textoNormalizado.includes(p));

    const disseNao = ["nao", "não", "n", "encerrar", "finalizar"]
      .some(p => textoNormalizado.includes(p));

    if (disseSim) {
      window.__cardapioState.aguardando = false;
      window.__cardapioState.linkEnviado = true;
      mostrarDigitando();
      setTimeout(() => {
        removerDigitando();
        adicionarMensagemBot(
          "Perfeito 😄<br><br>" +
          "Aqui está o link do cardápio 👇<br><br>" +
          "🔗 <a href='https://cardapio-demo-v2.vercel.app/' target='_blank'>Acessar cardápio</a><br><br>" +
          "Se precisar de mais alguma coisa, é só me chamar 💙"
        );
      }, 1000);
      return;
    }

    if (disseNao) {
      window.__cardapioState.aguardando = false;
      mostrarDigitando();
      setTimeout(() => {
        removerDigitando();
        adicionarMensagemBot(
          "Tudo bem 😊<br><br>" +
          "Quando quiser o cardápio, é só me avisar."
        );
      }, 1000);
      return;
    }

    adicionarMensagemBot(
      "Só para confirmar 😊<br>" +
      "Você quer que eu envie o <strong>link do cardápio</strong>?<br>" +
      "Responda com <strong>sim</strong> ou <strong>não</strong>."
    );
    return;
  }

  /* =============================
     AGRADECIMENTO APÓS LINK DO CARDÁPIO
  ============================ */
  if (window.__cardapioState.linkEnviado) {
    const agradecimentos = ["obrigado", "obrigada", "valeu", "ok", "thanks"];
    if (agradecimentos.some(a => textoNormalizado.includes(a))) {
      window.__cardapioState.linkEnviado = false;
      mostrarDigitando();
      setTimeout(() => {
        removerDigitando();
        const hora = new Date().getHours();
        let saudacao = "";
        if (hora >= 5 && hora < 12) saudacao = "Tenha um ótimo dia";
        else if (hora >= 12 && hora < 18) saudacao = "Tenha uma ótima tarde";
        else saudacao = "Tenha uma boa noite";

        adicionarMensagemBot(`De nada! Qualquer coisa, é só me chamar 💙<br>${saudacao}!`);
      }, 1000);
      return;
    }
  }

  /* =============================
// RESPOSTA DO FEEDBACK
============================= */
if (confirmandoEnvioFeedback) {
  confirmandoEnvioFeedback = false; // desativa a espera para evitar loops

  if (usuarioDisseSim(texto)) {
    mostrarDigitando();
    setTimeout(() => {
      removerDigitando();
      adicionarMensagemBot("Perfeito! Abrindo a área de feedback 💌");

      // espera 3 segundos e abre o modal
      setTimeout(() => {
        const modal = document.getElementById("modalFeedback");
        modal.classList.remove("hidden"); // mostra o modal
      }, 3000);

    }, 1000);
    return;
  }

  if (usuarioDisseNao(texto)) {
    mostrarDigitando();
    setTimeout(() => {
      removerDigitando();
      adicionarMensagemBot("Tudo bem 😊<br>Se quiser enviar depois, é só me avisar.");
    }, 1000);
    return;
  }

  // Caso o usuário digite algo diferente
  adicionarMensagemBot("Por favor, responda apenas com <strong>sim</strong> ou <strong>não</strong>.");
  confirmandoEnvioFeedback = true; // reativa a espera
  return;
}

  /* ===== CONTINUIDADE ===== */
  if (aguardandoContinuidade) {
    aguardandoContinuidade = false;

    if (usuarioDisseNao(texto)) {
      mostrarDigitando();
      setTimeout(() => {
        removerDigitando();
        adicionarMensagemBot(
          "Perfeito 😊<br><br>" +
          "Fico feliz em ter ajudado!<br>" +
          "Sempre que precisar, estarei por aqui 💙"
        );
        clienteAtual = null;
      }, 1000);
      return;
    }

    if (usuarioDisseSim(texto)) {
      mostrarDigitando();
      setTimeout(() => {
        removerDigitando();
        adicionarMensagemBot("Claro 😄 Vamos continuar!");
        mostrarOpcoesIniciais();
      }, 1000);
      return;
    }

    adicionarMensagemBot(
      "Só para confirmar 😊<br>Você precisa de mais alguma ajuda?<br><strong>sim</strong> ou <strong>não</strong>"
    );
    aguardandoContinuidade = true;
    return;
  }

  if (clienteAtual && usuarioPediuDesbloqueio(texto)) {
    respostaSemPermissao("desbloquear clientes", "liberar o acesso");
    return;
  }

  if (clienteAtual && usuarioPediuBloqueio(texto)) {
    respostaSemPermissao("bloquear clientes", "realizar o bloqueio");
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
    .select("id, nome, email, status, bloqueado");

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
    removerDigitando();
    adicionarMensagemBot(
      clienteAtual.bloqueado
        ? `🔒 O cliente <strong>${clienteAtual.nome}</strong> está <strong>BLOQUEADO</strong>.`
        : `✅ O cliente <strong>${clienteAtual.nome}</strong> <strong>NÃO está bloqueado</strong>.`
    );
  }
};

/* =============================
   UTILIDADES
============================= */
function normalizarTexto(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function usuarioPediuDesbloqueio(texto) {
  return normalizarTexto(texto).includes("desbloquear");
}

function usuarioPediuBloqueio(texto) {
  const t = normalizarTexto(texto);
  return t.includes("bloquear") || t.includes("bloqueio");
}

function usuarioDisseNao(texto) {
  return ["nao", "não", "n", "nada", "encerrar", "finalizar"].some(p =>
    normalizarTexto(texto).includes(p)
  );
}

function usuarioDisseSim(texto) {
  return ["sim", "s", "claro", "quero"].some(p =>
    normalizarTexto(texto).includes(p)
  );
}

function respostaSemPermissao(acao, descricao) {
  mostrarDigitando();
  setTimeout(() => {
    removerDigitando();
    adicionarMensagemBot(
      "Entendo sua solicitação 😊<br><br>" +
      `No momento, eu não tenho permissão para <strong>${acao}</strong> no sistema.<br><br>` +
      `Para ${descricao}, é necessário entrar em contato com o <strong>administrador do sistema</strong>.`
    );

    setTimeout(() => {
      adicionarMensagemBot(
        "Posso te ajudar com mais alguma coisa? 😊<br>" +
        "Responda com <strong>sim</strong> ou <strong>não</strong>."
      );
      aguardandoContinuidade = true;
    }, 5000);
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

    setTimeout(() => {
      mostrarOpcoesIniciais();

      setTimeout(() => {
        adicionarMensagemBot(
          "Ah, só um detalhe importante 😊<br><br>" +
          "Eu ainda não estou totalmente treinada para algumas situações, " +
          "mas vou fazer o meu melhor para te ajudar da forma mais rápida possível 💙"
        );
      }, 800);

    }, 600);

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
      <button onclick="selecionarOpcao('feedback')">💬 Feedback</button>
      <button onclick="selecionarOpcao('entregador')">🚴 Entregador</button>
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

    if (opcao === "feedback") {
      adicionarMensagemBot(
        "Ótimo 💙<br><br>" +
        "Gostaria de enviar um feedback? 😊<br>" +
        "Responda com <strong>sim</strong> ou <strong>não</strong>."
      );
      confirmandoEnvioFeedback = true;
    }

    // 👉 NOVA OPÇÃO: ENTREGADOR
    if (opcao === "entregador") {
      adicionarMensagemBot(
        "🚚 <strong>Área do Entregador</strong><br><br>" +
        "Escolha uma das opções abaixo ou descreva o que você precisa:<br><br>" +
        "📦 Pedido não encontrado<br>" +
        "⏰ Atraso na entrega<br>" +
        "📍 Dificuldade com endereço<br>" +
        "❓ Outro problema"
      );

      aguardandoEntregador = true;
    }

  }, 1000);
};

/* =============================
   SCROLL
============================= */
function rolarChat() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

const avatars = document.querySelectorAll('.luiza-avatar');
const modal = document.getElementById('modalLuiza');
const modalImg = document.getElementById('imgLuizaModal');
const closeBtn = document.querySelector('.close-luiza');

avatars.forEach(img => {
  img.style.cursor = "pointer";
  img.addEventListener('click', () => {
    modal.classList.add('ativo');
    modalImg.src = img.src;
    document.body.style.overflow = "hidden"; // trava scroll
  });
});

closeBtn.onclick = () => {
  modal.classList.remove('ativo');
  document.body.style.overflow = "";
};

// clicar fora NÃO fecha (igual WhatsApp)
// se quiser fechar tocando fora, me avisa
