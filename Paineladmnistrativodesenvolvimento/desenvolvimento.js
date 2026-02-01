document.querySelectorAll('.sidebar nav ul li').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.sidebar nav ul li').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});
