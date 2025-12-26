// Toggle mostrar/ocultar senha
const toggle = document.getElementById("togglePassword");
const password = document.getElementById("password");
let senhaVisivel = false;

toggle.addEventListener("click", () => {
  senhaVisivel = !senhaVisivel;
  password.type = senhaVisivel ? "text" : "password";
});

document.addEventListener("DOMContentLoaded", () => {
  // ======== Tema Natal Automático ========
  const inicioNatal = new Date(2025, 11, 23, 0, 0, 0); // dezembro = 11
  const fimNatal = new Date(2025, 11, 26, 23, 59, 59);
  const agora = new Date();

  if (agora >= inicioNatal && agora <= fimNatal) {
    document.body.classList.add('tema-natal');

    // Atualizar gradiente dos cards e botões
    const brandingCards = document.querySelectorAll('.bg-gradient-to-br');
    brandingCards.forEach(card => {
      card.style.backgroundImage = 'linear-gradient(135deg, #b91c1c, #dc2626, #b91c1c)';
    });

    const btnsGradient = document.querySelectorAll('.btn-gradient');
    btnsGradient.forEach(btn => {
      btn.style.backgroundImage = 'linear-gradient(135deg, #b91c1c, #dc2626, #b91c1c)';
    });

    // Mostrar modal de Natal no card mobile
    const modalNatal = document.getElementById('modal-natal');
    if (modalNatal) modalNatal.classList.remove('hidden');

    const btnFechar = document.getElementById('fechar-natal');
    if (btnFechar) {
      btnFechar.addEventListener('click', () => {
        modalNatal.classList.add('hidden');
      });
    }
  }
});
