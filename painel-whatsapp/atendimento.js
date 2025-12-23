
//Interaçao com menu lateral
// atendimento.js

document.addEventListener("DOMContentLoaded", () => {
  const sidebarButtons = document.querySelectorAll("aside button");

  sidebarButtons.forEach(button => {
    button.addEventListener("mouseenter", () => {
      const nome = button.getAttribute("title");
      if (!nome) return;

      // Cria tooltip
      const tooltip = document.createElement("div");
      tooltip.className = `
        tooltip absolute left-16 bg-gray-900 text-white px-3 py-1 rounded shadow-lg
        text-sm whitespace-nowrap opacity-0 transform transition-all duration-300
      `;
      tooltip.textContent = nome;

      // Posiciona verticalmente
      const rect = button.getBoundingClientRect();
      tooltip.style.top = `${rect.top + window.scrollY + rect.height / 2 - 16}px`;

      // Adiciona ao body
      document.body.appendChild(tooltip);

      // Força o fade in
      requestAnimationFrame(() => {
        tooltip.classList.remove("opacity-0");
        tooltip.classList.add("opacity-100");
      });

      // Guarda referência no botão
      button._tooltip = tooltip;
    });

    button.addEventListener("mouseleave", () => {
      if (button._tooltip) {
        const tooltip = button._tooltip;

        // Fade out suave
        tooltip.classList.remove("opacity-100");
        tooltip.classList.add("opacity-0");

        // Remove depois da animação
        setTimeout(() => {
          tooltip.remove();
        }, 300);

        button._tooltip = null;
      }
    });
  });
});
//fim da funçao menu lateral

//funçao sair do crm
document.addEventListener("DOMContentLoaded", () => {
  const btnLogout = document.querySelector('button[title="Logout"]');
  const modal = document.getElementById("modalLogout");
  const modalContent = document.getElementById("modalContent");
  const btnConfirm = document.getElementById("confirmLogout");
  const btnCancel = document.getElementById("cancelLogout");

  // Abrir modal com animação
  btnLogout.addEventListener("click", () => {
    modal.classList.remove("hidden");
    setTimeout(() => {
      modalContent.classList.remove("scale-90", "opacity-0");
    }, 10);
  });

  // Confirmar logout
  btnConfirm.addEventListener("click", () => {
    window.location.href = "../painel/admin.html";
  });

  // Cancelar logout
  btnCancel.addEventListener("click", () => {
    modalContent.classList.add("scale-90", "opacity-0");
    setTimeout(() => {
      modal.classList.add("hidden");
    }, 200);
  });

  // Fechar modal clicando fora
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modalContent.classList.add("scale-90", "opacity-0");
      setTimeout(() => {
        modal.classList.add("hidden");
      }, 200);
    }
  });
});

//fim da funçao sair crm

//sistema de aviso
 document.addEventListener("DOMContentLoaded", function() {
    var modal = document.getElementById("modalDesenvolvimento");
    var btnFechar = document.getElementById("btnFecharDesenvolvimento");

    // Mostrar modal
    modal.style.display = "flex";

    // Fechar modal e redirecionar para admin.html
    btnFechar.addEventListener("click", function() {
    window.location.href = "../painel/admin.html";
    });
  });

  //fim sistema de aviso