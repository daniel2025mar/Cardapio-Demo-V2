document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');

  // Admin padrão
  const defaultAdmin = {
    nome: 'Administrador',
    cargo: 'Admin',
    email: 'admin@admin.com',
    permissoes: ['acesso_total'],
    senha: '1234'
  };

  loginForm.addEventListener('submit', e => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Login admin padrão
    if (username === 'admin' && password === defaultAdmin.senha) {
      localStorage.setItem('usuarioLogado', JSON.stringify(defaultAdmin));
      window.location.replace('admin.html'); // Redireciona para o painel
      return;
    }

    // Login de funcionários
    const funcionarios = JSON.parse(localStorage.getItem('funcionarios')) || [];
    const user = funcionarios.find(f => f.nome === username && f.senha === password);

    if (user) {
      localStorage.setItem('usuarioLogado', JSON.stringify(user));
      window.location.replace('admin.html'); // Redireciona para o painel
      return;
    }

    // Login inválido
    loginError.classList.remove('hidden');
  });
});
