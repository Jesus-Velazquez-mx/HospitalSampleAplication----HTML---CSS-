document.addEventListener('DOMContentLoaded', function() {
  // Manejar clic en botones de opciones (•••)
  document.body.addEventListener('click', function(e) {
    if (e.target.classList.contains('options-btn') && 
        e.target.getAttribute('aria-label') === 'Opciones') {
      e.preventDefault();
      const card = e.target.closest('.card');
      if (!card) return;
      
      const asistenteData = {
        codigo: card.querySelector('.codigo').textContent,
        nombre: card.querySelector('.nombre').textContent,
        telefono: card.querySelector('.telefono').textContent,
        correo: card.querySelector('.correo').textContent,
        horario: card.querySelector('.horario').textContent
      };
      
      sessionStorage.setItem('selectedAsistente', JSON.stringify(asistenteData));
      window.location.href = `detalleAsistente.html?codigo=${asistenteData.codigo}`;
    }
  });
});