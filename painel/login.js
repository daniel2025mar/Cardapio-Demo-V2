import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');

  // Configuração Firebase
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
      window.location.replace('admin.html');
      return;
    }

    // Login de funcionários via Firebase
    const funcionariosRef = ref(db, 'funcionarios');
    onValue(funcionariosRef, (snapshot) => {
      const data = snapshot.val();
      const funcionarios = Object.values(data || {});
      const user = funcionarios.find(f => f.nome === username && f.senha === password);

      if (user) {
        localStorage.setItem('usuarioLogado', JSON.stringify(user));
        window.location.replace('admin.html');
        return;
      }

      // Login inválido
      loginError.classList.remove('hidden');
    }, {
      onlyOnce: true // Faz a verificação apenas uma vez
    });
  });
});
