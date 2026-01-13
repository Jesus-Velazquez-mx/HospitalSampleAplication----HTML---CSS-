document.addEventListener('DOMContentLoaded', async function () {
  const container = document.getElementById('pacientes-container');
  const template = document.querySelector('.card.template');

  try {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    const codigoMedico = userData?.codigo_persona;

    if (!codigoMedico) {
      throw new Error('No se encontró código del médico');
    }

    const response = await fetch(`http://localhost:3000/api/pacientes/medico/${codigoMedico}`);
    const pacientes = await response.json();

    pacientes.forEach(p => {
      const card = template.cloneNode(true);
      card.style.display = '';
      card.classList.remove('template');

      card.querySelector('.codigo').textContent = p.codigo_paciente;
      card.querySelector('.avatar').textContent = p.nombre.charAt(0);
      card.querySelector('.nombre').textContent = p.nombre;
      card.querySelector('.telefono').textContent = `Teléfono: ${p.telefono}`;
      card.querySelector('.correo').textContent = `Correo: ${p.correo_electronico}`;

      container.appendChild(card);
    });
  } catch (err) {
    console.error('Error al cargar pacientes:', err);
    container.innerHTML = '<p style="color:red">Error al cargar los pacientes</p>';
  }
});
