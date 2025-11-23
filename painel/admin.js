// Seleciona elementos do header
const usuarioSpan = document.querySelector('header span');
const btnSair = document.querySelector('header button');

// Menu lateral e seções
const menuLabels = document.querySelectorAll('aside nav label');
const sections = document.querySelectorAll('main section');

// Função para mostrar seção
function showSection(id) {
  sections.forEach(sec => {
    sec.style.display = sec.id === id ? 'block' : 'none';
  });
}

// Inicializa mostrando dashboard
showSection('dashboard');

// Ao clicar em um menu, abre a seção correspondente
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

// Cadastro de funcionários
const form = document.querySelector('#funcionarios form');
const tabela = document.querySelector('#funcionarios tbody');

// Recupera funcionários do localStorage
let funcionarios = JSON.parse(localStorage.getItem('funcionarios')) || [];

// Garante que o admin esteja sempre presente
const adminUser = funcionarios.find(f => f.email === 'admin@admin.com');
if (!adminUser) {
  funcionarios.push({
    nome: 'Administrador',
    cargo: 'Admin',
    email: 'admin@admin.com',
    senha: 'admin123',
    permissoes: [
      'dashboard',
      'produtos',
      'pedidos',
      'clientes',
      'funcionarios',
      'acesso_total',
      'editar_produtos',
      'excluir_clientes'
    ]
  });
  localStorage.setItem('funcionarios', JSON.stringify(funcionarios));
}

// Atualiza tabela de funcionários
function atualizarTabela() {
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
      funcionarios.splice(index, 1);
      localStorage.setItem('funcionarios', JSON.stringify(funcionarios));
      atualizarTabela();
    });

    // Excluir funcionário
    row.querySelector('button.bg-red-500').addEventListener('click', () => {
      funcionarios.splice(index, 1);
      localStorage.setItem('funcionarios', JSON.stringify(funcionarios));
      atualizarTabela();
    });
  });
}

// Ao enviar formulário
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

  funcionarios.push({ nome, cargo, email, senha, permissoes });
  localStorage.setItem('funcionarios', JSON.stringify(funcionarios));

  form.reset();
  atualizarTabela();
});

// Inicializa tabela ao carregar
atualizarTabela();

// 🔹 Função de login para funcionários e admin dentro do painel
export function loginFuncionario(usuario, senha) {
  const user = funcionarios.find(f => f.nome === usuario && f.senha === senha)
            || (usuario === 'admin' && senha === '1234'
                ? { nome: 'Administrador', cargo: 'Admin', email: 'admin@admin.com', permissoes: ['acesso_total'] }
                : null);

  if (!user) return null;

  // Salva usuário logado
  localStorage.setItem('usuarioLogado', JSON.stringify(user));

  aplicarPermissoes(user);

  return user;
}

// 🔹 Função que aplica permissões ao carregar a página
export function aplicarPermissoes(user) {
  // Atualiza o nome do usuário no header
  if (usuarioSpan) usuarioSpan.textContent = user.nome;

  if (user.permissoes.includes('acesso_total')) {
    // 🔹 Admin desbloqueia tudo
    menuLabels.forEach(label => {
      label.style.display = 'block';
      label.classList.remove('cursor-not-allowed', 'opacity-50');
      label.removeAttribute('title');
    });
    sections.forEach(sec => {
      sec.style.display = 'block';
    });

    // Mostra todos os pedidos
    mostrarPedidos(); 
    return;
  }

  // Usuários comuns
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

  // Esconde todas as seções
  sections.forEach(sec => sec.style.display = 'none');

  // Mostra seções que o usuário pode acessar
  user.permissoes.forEach(p => {
    const sec = document.getElementById(p);
    if (sec) sec.style.display = 'block';
  });

  // Se o usuário tiver permissão de Pedidos, mostra todos os pedidos
  if (user.permissoes.includes('pedidos')) {
    mostrarPedidos();
  }
}

// 🔹 Função para mostrar todos os pedidos
function mostrarPedidos() {
  const pedidosSection = document.getElementById('pedidos');
  if (!pedidosSection) return;

  // Limpa seção
  pedidosSection.innerHTML = '';

  // Recupera pedidos do localStorage ou array de exemplo
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

// 🔹 Botão de logout
if (btnSair) {
  btnSair.addEventListener('click', () => {
    localStorage.removeItem('usuarioLogado');
    window.location.replace('login.html');
  });
}

// 🔹 Executa ao carregar a página para manter sessão
const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
if (usuarioLogado) {
  aplicarPermissoes(usuarioLogado);
}
