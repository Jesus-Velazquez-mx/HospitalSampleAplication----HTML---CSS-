document.addEventListener('DOMContentLoaded', function() {
  // Manejar clic en botones de opciones (•••)
  document.body.addEventListener('click', function(e) {
    if (e.target.classList.contains('options-btn') && 
        e.target.getAttribute('aria-label') === 'Opciones') {
      e.preventDefault();
      const card = e.target.closest('.card');
      if (!card) return;
      
      const doctorData = {
        codigo: card.querySelector('.codigo').textContent,
        nombre: card.querySelector('.nombre').textContent,
        telefono: card.querySelector('.telefono').textContent,
        correo: card.querySelector('.correo').textContent,
        especialidad: card.querySelector('.especialidad').textContent,
        horario: card.querySelector('.horario').textContent
      };
      
      sessionStorage.setItem('selectedDoctor', JSON.stringify(doctorData));
      window.location.href = `detallesDoctor.html?codigo=${doctorData.codigo}`;
    }
  });
});