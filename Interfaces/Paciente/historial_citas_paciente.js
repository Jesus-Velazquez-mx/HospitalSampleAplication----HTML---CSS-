
document.addEventListener("DOMContentLoaded", function () {
  const cardMenus = document.querySelectorAll(".card-menu");

  cardMenus.forEach(menu => {
    menu.addEventListener("click", () => {
      window.location.href = "detalles_cita_historial.html";
    });
  });
});




document.querySelector('.menu-button').addEventListener('click', () => {
    alert('Menú general próximamente disponible.');
});


