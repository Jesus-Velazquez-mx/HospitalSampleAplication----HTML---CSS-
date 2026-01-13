document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Obtener el código del paciente del sessionStorage
        const userData = JSON.parse(sessionStorage.getItem('userData'));
        const codigoPaciente = userData?.codigo_persona;
        
        if (!codigoPaciente) {
            throw new Error('No se encontró información del paciente');
        }

        const response = await fetch(`http://localhost:3000/api/citas/${codigoPaciente}`);
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

        // Filtrar solo citas pasadas
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); // Para comparar solo fechas sin hora
        
        const citasPasadas = citas.filter(cita => {
            const fechaCita = new Date(cita.fecha_de_cita);
            return fechaCita < hoy;
        });

        if (citasPasadas.length === 0) {
            container.innerHTML = '<p class="no-citas">No tienes citas pasadas registradas</p>';
            return;
        }

        citasPasadas.forEach(cita => {
            const card = template.cloneNode(true);
            card.style.display = '';
            card.classList.remove('template');
            
            card.querySelector('.codigo-cita').textContent = cita.codigo_cita;
            
            // Configurar el estado con la clase adecuada
            const estadoElement = card.querySelector('.estado');
            estadoElement.textContent = cita.estado_de_cita;
            estadoElement.className = `estado estado-badge ${cita.estado_de_cita.toLowerCase()}`;
            
            card.querySelector('.fecha').textContent = formatDate(cita.fecha_de_cita);
            card.querySelector('.medico').textContent = cita.nombre_medico;
            
            // Configurar botón Ver
            const btnVer = card.querySelector('.btn-ver');
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
                window.location.href = 'ver_cita_pasada.html';
            });
            
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error:', error);
        const container = document.getElementById('citas-container');
        container.innerHTML = '<p class="error-message">Error al cargar el historial de citas. Por favor intente nuevamente.</p>';
    }
});

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