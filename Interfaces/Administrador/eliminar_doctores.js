document.addEventListener('DOMContentLoaded', function() {
  const doctorData = JSON.parse(sessionStorage.getItem('doctorToDelete'));
  const form = document.getElementById('delete-doctor-form');
  
  if (doctorData) {
    document.querySelector('.doctor-id').textContent = `Doctor ${doctorData.codigo}`;
    document.querySelector('.card-header').textContent = `Doctor ${doctorData.codigo}`;
    document.querySelector('.info').innerHTML = `
      <strong>${doctorData.nombre}</strong>
      <p>${doctorData.telefono}</p>
      <p>${doctorData.correo}</p>
      <p>${doctorData.especialidad}</p>
      <p>${doctorData.horario}</p>
    `;
    document.querySelector('.avatar').textContent = doctorData.nombre.charAt(0);
  }

  function validarFormulario() {
    const isFormValid = 
      document.getElementById('password').value.trim() !== '' && 
      document.getElementById('reason').value.trim() !== '' && 
      document.getElementById('terms').checked;
    
    document.getElementById('deleteDoctorBtn').disabled = !isFormValid;
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
    
    if (!confirm('¿Está seguro de eliminar este doctor permanentemente?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/doctores/${doctorData.codigo}`, {
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
        throw new Error(errorData.error || 'Error al eliminar doctor');
      }
      
      const data = await response.json();
      alert(data.message || 'Doctor eliminado correctamente');
      window.location.href = 'ver_doctores.html';
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