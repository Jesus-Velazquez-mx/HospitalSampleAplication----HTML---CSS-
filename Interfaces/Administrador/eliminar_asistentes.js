document.addEventListener('DOMContentLoaded', function() {
  const asistenteData = JSON.parse(sessionStorage.getItem('asistenteToDelete'));
  const form = document.getElementById('delete-asistente-form');
  
  if (asistenteData) {
    document.querySelector('.asistente-id').textContent = `Asistente ${asistenteData.codigo}`;
    document.querySelector('.card-header').textContent = `Asistente ${asistenteData.codigo}`;
    document.querySelector('.info').innerHTML = `
      <strong>${asistenteData.nombre}</strong>
      <p>${asistenteData.telefono}</p>
      <p>${asistenteData.correo}</p>
      <p>${asistenteData.horario}</p>
    `;
    document.querySelector('.avatar').textContent = asistenteData.nombre.charAt(0);
  }

  function validarFormulario() {
    const isFormValid = 
      document.getElementById('password').value.trim() !== '' && 
      document.getElementById('reason').value.trim() !== '' && 
      document.getElementById('terms').checked;
    
    document.getElementById('deleteAsistenteBtn').disabled = !isFormValid;
    return isFormValid;
  }

  // Event listeners para validación en tiempo real
  document.getElementById('password').addEventListener('input', validarFormulario);
  document.getElementById('reason').addEventListener('input', validarFormulario);
  document.getElementById('terms').addEventListener('change', validarFormulario);

  // Manejar envío del formulario
 form.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  if (!validarFormulario()) {
    alert('Por favor complete todos los campos requeridos');
    return;
  }
  
  if (!confirm('¿Está seguro de eliminar este asistente permanentemente?')) return;

  try {
    const response = await fetch(`http://localhost:3000/api/asistentes/${asistenteData.codigo}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: document.getElementById('password').value,
        reason: document.getElementById('reason').value
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al eliminar asistente');
    }
    
    const data = await response.json();
    alert(data.message || 'Asistente eliminado correctamente');
    window.location.href = 'ver_asistentes.html';
  } catch (error) {
    console.error('Error:', error);
    alert(`Error: ${error.message}`);
  }
});

  document.querySelector('.secondary').addEventListener('click', function() {
    window.history.back();
  });

  // Validación inicial
  validarFormulario();
});