document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('medicos-consultorios-container');

  try {
    const response = await fetch('http://localhost:3000/api/medicos-consultorios');
    const data = await response.json();

    if (Object.keys(data).length === 0) {
      container.innerHTML = '<p>No hay asignaciones registradas.</p>';
      return;
    }

    for (const [sucursal, registros] of Object.entries(data)) {
      const sucursalDiv = document.createElement('div');
      sucursalDiv.className = 'sucursal';

      const title = document.createElement('h3');
      title.textContent = sucursal;
      sucursalDiv.appendChild(title);

      registros.forEach(reg => {
        const item = document.createElement('div');
        item.className = 'medico-consultorio';
        item.innerHTML = `
          <p><b>Consultorio:</b> ${reg.consultorio}</p>
          <p><b>Médico:</b> ${reg.medico}</p>
          <p><b>Horario:</b> ${reg.hora_inicio} - ${reg.hora_fin}</p>
        `;
        sucursalDiv.appendChild(item);
      });

      container.appendChild(sucursalDiv);
    }
  } catch (err) {
    console.error('Error al cargar médicos por consultorio:', err);
    container.innerHTML = '<p>Error al cargar los datos</p>';
  }
});
