// Código JavaScript para la interfaz de médico


// Función para mostrar el modal de confirmación al cancelar una cita
// Cancelar cita
document.addEventListener("DOMContentLoaded", () => {
  const btnMenu = document.getElementById("btnEliminar");
  const modal = document.getElementById("modalCancelar");
  const btnCancelar = document.getElementById("btnCancelar");
  const btnAceptar = document.getElementById("btnAceptar");

  // Mostrar el modal al hacer clic en los 3 puntos
  btnMenu.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  // Cerrar el modal con "Cancelar"
  btnCancelar.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Redirigir al HTML de cancelación con "Aceptar"
  btnAceptar.addEventListener("click", () => {
    window.location.href = "cancelar_cita.html"; // Asegúrate que el archivo existe y está en la misma ruta
  });

  // Cerrar modal haciendo clic fuera
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
});
