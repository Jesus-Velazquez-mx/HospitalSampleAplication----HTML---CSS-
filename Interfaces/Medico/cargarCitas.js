document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Obtener el código del paciente del sessionStorage
        const userData = JSON.parse(sessionStorage.getItem('userData'));
        const codigoMedico = userData?.codigo_persona;
        
        if (!codigoMedico) {
            throw new Error('No se encontró información del paciente');
        }

        const response = await fetch(`http://localhost:3000/api/citas/medico/${codigoMedico}`);
        if (!response.ok) {
            throw new Error('Error al obtener las citas');
        }
        
        const citas = await response.json();
        const container = document.getElementById('citas-container');
        const template = document.querySelector('.cita-card.template');
        
        if (!template) {
            throw new Error('No se encontró la plantilla de cita');
        }

        // Limpiar contenedor antes de agregar nuevas citas
        container.innerHTML = '';

        citas.forEach(cita => {
            if (cita.estado_de_cita.toLowerCase() === 'completada') {
            return; // no mostrar citas completadas
  }
            const card = template.cloneNode(true);
            card.style.display = '';
            card.classList.remove('template');
            
            card.querySelector('.codigo-cita').textContent = cita.codigo_cita;
            
            // Configurar el estado con la clase adecuada
            const estadoElement = card.querySelector('.estado');
            estadoElement.textContent = cita.estado_de_cita;
            estadoElement.className = `estado estado-badge ${cita.estado_de_cita.toLowerCase()}`;
            
            card.querySelector('.fecha').textContent = formatDate(cita.fecha_de_cita);
            card.querySelector('.hora').textContent = formatTime(cita.hora_de_cita);
            card.querySelector('.paciente').textContent = cita.nombre_paciente;
            card.querySelector('.medico').textContent = cita.nombre_medico;
            card.querySelector('.consultorio').textContent = cita.nombre_consultorio;
            card.querySelector('.sucursal').textContent = cita.nombre_sucursal;
            
            card.querySelector('.btn-editar').addEventListener('click', () => {
                console.log('Editar cita:', cita.codigo_cita);
            });
            
            card.querySelector('.btn-cancelar').addEventListener('click', () => {
                console.log('Cancelar cita:', cita.codigo_cita);
            });


            const btnVer = card.querySelector('.btn-editar');
            btnVer.addEventListener('click', () => {
                sessionStorage.setItem('citaDetalle', JSON.stringify({
                    id: cita.codigo_cita,
                    fecha: cita.fecha_de_cita,
                    hora: cita.hora_de_cita,
                    paciente: cita.nombre_paciente,
                    medico: cita.nombre_medico,
                    consultorio: cita.nombre_consultorio,
                    sucursal: cita.nombre_sucursal,
                    estado: cita.estado_de_cita
                }));
                window.location.href = 'ver_cita.html';
            });
            // Configurar el botón de cancelar
            const btnCancelar = card.querySelector('.btn-cancelar');
            if (cita.estado_de_cita.toLowerCase() === 'cancelada') {
                btnCancelar.style.display = 'none';
            } else {
                btnCancelar.addEventListener('click', () => {
                    sessionStorage.setItem('citaCancelacion', JSON.stringify({
                        id: cita.codigo_cita,
                        fecha: cita.fecha_de_cita,
                        hora: cita.hora_de_cita,
                        medico: cita.nombre_medico,
                        consultorio: cita.nombre_consultorio,
                        sucursal: cita.nombre_sucursal,
                        estado: cita.estado_de_cita
                    }));
                    window.location.href = 'cancelar_cita_paciente.html';
                });
            }
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error:', error);
        const container = document.getElementById('citas-container');
        container.innerHTML = '<p class="error-message">Error al cargar las citas. Por favor intente nuevamente.</p>';
    }
});


// Las funciones formatDate y formatTime permanecen igual

function formatDate(dateString) {
    if (!dateString) return '--/--/----';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '--/--/----';
    
    return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatTime(timeValue) {
    if (!timeValue) return '--:--';
    
    if (typeof timeValue === 'string' && timeValue.includes('T')) {
        const timePart = timeValue.split('T')[1];
        const [hours, minutes] = timePart.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
    
    if (typeof timeValue === 'object' && timeValue.hours !== undefined) {
        return `${String(timeValue.hours).padStart(2, '0')}:${String(timeValue.minutes).padStart(2, '0')}`;
    }
    
    if (typeof timeValue === 'string') {
        const parts = timeValue.split(':');
        if (parts.length >= 2) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        }
    }
    
    return '--:--';
}

// Fuera del forEach, al final del script
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('btn-consultar')) {
    const citaCard = e.target.closest('.cita-card');
    const codigoCita = citaCard.querySelector('.codigo-cita').textContent;

    try {
      const userData = JSON.parse(sessionStorage.getItem('userData'));
      if (!userData || !userData.codigo_persona) {
        throw new Error('No se encontró información del médico');
      }

      e.target.disabled = true;
      e.target.textContent = 'Iniciando...';

      const nombrePaciente = citaCard.querySelector('.paciente').textContent;

      const response = await fetch('http://localhost:3000/api/consultas/nueva', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigoCita: codigoCita,
          codigoMedico: userData.codigo_persona,
          nombrePaciente: nombrePaciente
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Error al crear la consulta');
      }

      sessionStorage.setItem('nuevaConsulta', JSON.stringify({
        codigoConsulta: data.codigoConsulta,
        codigoPaciente: data.codigoPaciente,
        codigoCita: codigoCita,
        nombrePaciente: data.nombrePaciente,
        esNuevo: true
      }));

      window.location.href = 'ver_historial.html';
    } catch (error) {
      console.error('Error completo:', error);
      alert(`Error al iniciar consulta: ${error.message}`);
      e.target.disabled = false;
      e.target.textContent = 'Consultar';
    }
  }
});
