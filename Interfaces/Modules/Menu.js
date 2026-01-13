const menuBtn = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const logoutBtn = document.getElementById('logout-btn');

// Alternar menú lateral
menuBtn.addEventListener('click', (e) => {
  e.stopPropagation(); // Evita que el clic se propague
  sidebar.classList.toggle('open');
});

// Cerrar el menú si se hace clic fuera de él
document.addEventListener('click', function (event) {
  const isClickInsideSidebar = sidebar.contains(event.target);
  const isClickOnButton = menuBtn.contains(event.target);

  if (!isClickInsideSidebar && !isClickOnButton) {
    sidebar.classList.remove('open');
  }
});

// Redirigir al hacer clic en "Cerrar sesión"
logoutBtn.addEventListener('click', () => {
  window.location.href = '../InicioSesion/Inicio.html';
});
