// 🔹 CONFIGURAÇÃO DO FIREBASE
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove } from "firebase/database";

// Configuração do Firebase (substitua pelos seus dados)
const firebaseConfig = {
  apiKey: "AIzaSyC4DMjGfR3tHQWDUdKCT8nC8BK6MrSaLMQ",
  authDomain: "loginpainel-29555.firebaseapp.com",
  databaseURL: "https://loginpainel-29555-default-rtdb.firebaseio.com",
  projectId: "loginpainel-29555",
  storageBucket: "loginpainel-29555.appspot.com",
  messagingSenderId: "462544162950",
  appId: "1:462544162950:web:1379981f5f7be9d865c107"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🔹 ELEMENTOS DA PÁGINA
const usuarioSpan = document.querySelector('header span');
const btnSair = document.querySelector('header button');
const menuLabels = document.querySelectorAll('aside nav label');
const sections = document.querySelectorAll('main section');
const form = document.querySelector('#funcionarios form');
const tabela = document.querySelector('#funcionarios tbody');

// 🔹 FUNÇÃO PARA MOSTRAR SEÇÃO
function showSection(id) {
  sections.forEach(sec => {
    sec.style.display = sec.id === id ? 'block' : 'none';
  });
}
showSection('dashboard');

// 🔹 MENU LATERAL
menuLabels.forEach(label => {
  label.addEventListener('click', () => {
    const targetId = label.getAttribute('for').replace('menu-', '');
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (!usuarioLogado) {
      alert('Nenhum usuário logado!');
      return;
    }

    if (usuarioLogado.permissoes.includes('acesso_total') || usuarioLogado.permissoes.includes(targetId)) {
      showSection(targetId);
      if (targetId === 'pedidos') mostrarPedidos();
    } else {
      alert('Você não tem permissão para acessar esta seção!');
    }
  });
});

// 🔹 FUNÇÕES FIREBASE
function adicionarFuncionarioFirebase(f) {
  set(ref(db, 'funcionarios/' + f.email.replace('.', '_')), f);
}

function removerFuncionarioFirebase(email) {
  remove(ref(db, 'funcionarios/' + email.replace('.', '_')));
}

function carregarFuncionariosFirebase(callback) {
  const funcionariosRef = ref(db, 'funcionarios');
  onValue(funcionariosRef, (snapshot) => {
    const data = snapshot.val();
    const funcionariosArray = Object.values(data || {});
    callback(funcionariosArray);
  });
}

// 🔹 ATUALIZA TABELA DE FUNCIONÁRIOS
function atualizarTabela(funcionarios) {
  tabela.innerHTML = '';
  funcionarios.forEach((f, index) => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-100';

    const permissoesTexto = f.permissoes.includes('acesso_total')
      ? 'Acesso total do painel'
      : f.permissoes.join(', ');

    row.innerHTML = `
      <td class="py-2 px-4 border-b">${f.nome}</td>
      <td class="py-2 px-4 border-b">${f.cargo}</td>
      <td class="py-2 px-4 border-b">${f.email}</td>
      <td class="py-2 px-4 border-b">${permissoesTexto}</td>
      <td class="py-2 px-4 border-b">
        <button class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Editar</button>
        <button class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Excluir</button>
      </td>
    `;
    tabela.appendChild(row);

    // Editar funcionário
    row.querySelector('button.bg-blue-500').addEventListener('click', () => {
      form.querySelector('input[placeholder="Nome"]').value = f.nome;
      form.querySelector('input[placeholder="Cargo"]').value = f.cargo;
      form.querySelector('input[placeholder="Email"]').value = f.email;
      form.querySelector('input[placeholder="Senha"]').value = f.senha;
      form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = f.permissoes.includes(cb.value);
      });
      removerFuncionarioFirebase(f.email);
    });

    // Excluir funcionário
    row.querySelector('button.bg-red-500').addEventListener('click', () => {
      removerFuncionarioFirebase(f.email);
    });
  });
}

// 🔹 CADASTRO DE FUNCIONÁRIOS
form.addEventListener('submit', e => {
  e.preventDefault();
  const nome = form.querySelector('input[placeholder="Nome"]').value.trim();
  const cargo = form.querySelector('input[placeholder="Cargo"]').value.trim();
  const email = form.querySelector('input[placeholder="Email"]').value.trim();
  const senha = form.querySelector('input[placeholder="Senha"]').value.trim();
  const permissoes = Array.from(form.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);

  if (!nome || !cargo || !email || !senha) {
    alert('Preencha todos os campos!');
    return;
  }

  const funcionario = { nome, cargo, email, senha, permissoes };
  adicionarFuncionarioFirebase(funcionario);
  form.reset();
});

// 🔹 LOGIN
export function loginFuncionario(usuario, senha) {
  let user = null;
  carregarFuncionariosFirebase(funcionarios => {
    user = funcionarios.find(f => f.nome === usuario && f.senha === senha)
          || (usuario === 'admin' && senha === '1234'
              ? { nome: 'Administrador', cargo: 'Admin', email: 'admin@admin.com', permissoes: ['acesso_total'] }
              : null);

    if (!user) return null;

    localStorage.setItem('usuarioLogado', JSON.stringify(user));
    aplicarPermissoes(user);
  });
}

// 🔹 APLICA PERMISSÕES
export function aplicarPermissoes(user) {
  if (usuarioSpan) usuarioSpan.textContent = user.nome;

  if (user.permissoes.includes('acesso_total')) {
    menuLabels.forEach(label => {
      label.style.display = 'block';
      label.classList.remove('cursor-not-allowed', 'opacity-50');
      label.removeAttribute('title');
    });
    sections.forEach(sec => sec.style.display = 'block');
    mostrarPedidos();
    return;
  }

  menuLabels.forEach(label => {
    const targetId = label.getAttribute('for').replace('menu-', '');
    if (user.permissoes.includes(targetId)) {
      label.style.display = 'block';
      label.classList.remove('cursor-not-allowed', 'opacity-50');
      label.removeAttribute('title');
    } else {
      label.style.display = 'block';
      label.classList.add('cursor-not-allowed', 'opacity-50');
      label.setAttribute('title', 'Sem permissão');
    }
  });

  sections.forEach(sec => sec.style.display = 'none');
  user.permissoes.forEach(p => {
    const sec = document.getElementById(p);
    if (sec) sec.style.display = 'block';
  });

  if (user.permissoes.includes('pedidos')) mostrarPedidos();
}

// 🔹 MOSTRA PEDIDOS
function mostrarPedidos() {
  const pedidosSection = document.getElementById('pedidos');
  if (!pedidosSection) return;
  pedidosSection.innerHTML = '';

  const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
  if (pedidos.length === 0) {
    pedidosSection.innerHTML = '<p class="p-4">Nenhum pedido encontrado.</p>';
    return;
  }

  pedidos.forEach(pedido => {
    const div = document.createElement('div');
    div.className = 'border p-4 mb-2 rounded shadow bg-white';
    div.innerHTML = `
      <p><strong>ID:</strong> ${pedido.id}</p>
      <p><strong>Cliente:</strong> ${pedido.cliente}</p>
      <p><strong>Produto:</strong> ${pedido.produto}</p>
      <p><strong>Quantidade:</strong> ${pedido.quantidade}</p>
      <p><strong>Status:</strong> ${pedido.status}</p>
    `;
    pedidosSection.appendChild(div);
  });
}

// 🔹 LOGOUT
if (btnSair) {
  btnSair.addEventListener('click', () => {
    localStorage.removeItem('usuarioLogado');
    window.location.replace('login.html');
  });
}

// 🔹 CARREGA FUNCIONÁRIOS AO INICIAR
carregarFuncionariosFirebase(atualizarTabela);
