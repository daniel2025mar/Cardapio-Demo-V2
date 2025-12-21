// server.js
const express = require("express");
const cors = require("cors");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// ⚠️ DADOS CORRETOS DA SUA EVOLUTION
const INSTANCE_ID = "E8DEFB2B1B42-4992-BD87-E95A21652AF9";
const API_KEY = "429683C4C977415CAAFCCE10F7D57E11";
const EVOLUTION_API = "http://localhost:8080";

// TESTE RAIZ
app.get("/", (req, res) => {
  res.send("Servidor Node conectado à Evolution API 🚀");
});

// LISTAR CONTATOS + GRUPOS (chats)
app.get("/clientes", async (req, res) => {
  try {
    const response = await fetch(
      `${EVOLUTION_API}/instances/${INSTANCE_ID}/chats`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Erro ao buscar contatos:", err);
    res.status(500).json({ erro: "Erro ao buscar contatos" });
  }
});

// BUSCAR MENSAGENS DE UM CHAT
app.get("/mensagens/:chatId", async (req, res) => {
  const chatId = req.params.chatId;

  try {
    const response = await fetch(
      `${EVOLUTION_API}/instances/${INSTANCE_ID}/messages?chatId=${chatId}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Erro ao buscar mensagens:", err);
    res.status(500).json({ erro: "Erro ao buscar mensagens" });
  }
});

// ENVIAR MENSAGEM
app.post("/enviar", async (req, res) => {
  const { to, message } = req.body;

  try {
    const response = await fetch(
      `${EVOLUTION_API}/instances/${INSTANCE_ID}/send-message`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: to,
          message,
        }),
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
    res.status(500).json({ erro: "Erro ao enviar mensagem" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});
