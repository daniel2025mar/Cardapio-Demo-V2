const API_URL = 'http://localhost:8080/api';

const numeroAtivo = '553498276982@s.whatsapp.net';
let tipoLista = 'contacts'; // 'contacts' ou 'groups'

document.addEventListener('DOMContentLoaded', () => {

    // Seleção de filtro
    const btnAtendimentos = document.getElementById('btn-atendimentos');
    const btnFinalizados = document.getElementById('btn-finalizados');

    btnAtendimentos.onclick = () => {
        tipoLista = 'contacts';
        btnAtendimentos.classList.add('active');
        btnFinalizados.classList.remove('active');
        listarLista();
    };

    btnFinalizados.onclick = () => {
        tipoLista = 'groups';
        btnFinalizados.classList.add('active');
        btnAtendimentos.classList.remove('active');
        listarLista();
    };

    // Inicializa lista na abertura
    listarLista();
});

async function listarLista() {
    const endpoint = tipoLista === 'contacts' ? 'contacts' : 'chats'; // chats pega grupos também

    try {
        const res = await fetch(`${API_URL}/instances/${numeroAtivo}/${endpoint}`, {
            headers: { 'Authorization': 'Bearer 429683C4C977415CAAFCCE10F7D57E11' }
        });
        const data = await res.json();

        const lista = document.getElementById('lista-clientes');
        lista.innerHTML = '';

        data.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('cliente');

            const nome = item.name || item.number || item.subject || 'Sem nome';
            const isOnline = item.isOnline ? 'Online' : '';

            div.innerHTML = `
                <img src="${item.profilePic || 'default.png'}">
                <div class="info">
                    <div class="nome">${nome}</div>
                    <div class="status">${isOnline}</div>
                </div>
            `;

            div.addEventListener('click', () => abrirChat(item.id || item.number));
            lista.appendChild(div);
        });

    } catch (error) {
        console.error('Erro ao listar', tipoLista, error);
    }
}

// Função abrir chat
async function abrirChat(numeroCliente) {
    const chatList = document.getElementById('chat-list');
    chatList.innerHTML = '';

    try {
        const res = await fetch(`${API_URL}/instances/${numeroAtivo}/messages?contact=${numeroCliente}`, {
            headers: { 'Authorization': 'Bearer 429683C4C977415CAAFCCE10F7D57E11' }
        });
        const mensagens = await res.json();

        mensagens.forEach(msg => {
            const div = document.createElement('div');
            div.classList.add('chat-msg');
            if (msg.fromMe) div.classList.add('user');

            div.innerHTML = `
                ${msg.body}
                <span class="hora">${new Date(msg.timestamp).toLocaleTimeString()}</span>
            `;
            chatList.appendChild(div);
        });

        chatList.scrollTop = chatList.scrollHeight;

    } catch (error) {
        console.error('Erro ao abrir chat:', error);
    }

    // Enviar mensagem
    const btnEnviar = document.getElementById('btn-enviar');
    btnEnviar.onclick = async () => {
        const textarea = document.querySelector('#mensagem textarea');
        const body = textarea.value;
        if (!body) return;

        try {
            await fetch(`${API_URL}/instances/${numeroAtivo}/send-message`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer 429683C4C977415CAAFCCE10F7D57E11'
                },
                body: JSON.stringify({ to: numeroCliente, message: body })
            });
            textarea.value = '';
            abrirChat(numeroCliente); // atualizar chat
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }
    };
}
