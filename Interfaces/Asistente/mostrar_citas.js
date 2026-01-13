// Esta parte manda a detalles_de_la_cita
document.addEventListener('DOMContentLoaded', () => {
  const botonesOpciones = document.querySelectorAll('.options-btn');

  botonesOpciones.forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.href = 'detalles_de_la_cita.html';
    });
  });
});
// Aqui acaba lo de detalles_de_la_cita