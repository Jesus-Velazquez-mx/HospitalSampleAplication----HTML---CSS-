document.addEventListener("DOMContentLoaded", function () {
  const cardMenus = document.querySelectorAll(".card-button");

  cardMenus.forEach(menu => {
    menu.addEventListener("click", () => {
      window.location.href = "detalles_cita.html";
    });
  });
});