document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Obtener el código del paciente del sessionStorage
        const userData = JSON.parse(sessionStorage.getItem('userData'));
        const codigoPaciente = userData?.codigo_persona;
        
        if (!codigoPaciente) {
            throw new Error('No se encontró información del paciente');
        }

        // Obtener el expediente del paciente
        const response = await fetch(`http://localhost:3000/api/expediente/${codigoPaciente}`);
        if (!response.ok) {
            throw new Error('Error al obtener el expediente');
        }
        
        const expediente = await response.json();
        const container = document.getElementById('expediente-container');
        const template = document.querySelector('.expediente-card.template');
        
        if (!template) {
            throw new Error('No se encontró la plantilla de expediente');
        }

        // Limpiar contenedor antes de agregar nuevos registros
        container.innerHTML = '';

        expediente.forEach(registro => {
            const card = template.cloneNode(true);
            card.style.display = '';
            card.classList.remove('template');
            
            card.querySelector('.codigo-historial').textContent = registro.codigo_historial;
            card.querySelector('.fecha-creacion').textContent = formatDate(registro.fecha_creacion);
            card.querySelector('.fecha-modificacion').textContent = formatDate(registro.fecha_modificacion || registro.fecha_creacion);
            card.querySelector('.fecha-actualizacion').textContent = formatDate(registro.fecha_modificacion || registro.fecha_creacion);
            
            // Configurar el botón de ver detalles
            const btnVer = card.querySelector('.btn-ver');
            btnVer.addEventListener('click', () => {
                sessionStorage.setItem('historialDetalle', JSON.stringify({
                    id: registro.codigo_historial,
                    fecha_creacion: registro.fecha_creacion,
                    fecha_modificacion: registro.fecha_modificacion,
                    medicamentos: registro.medicamentos_actuales,
                    enfermedades: registro.enfermedades_pasadas,
                    alergias: registro.alergias,
                    cirugias: registro.cirugias,
                    antecedentes: registro.antecedentes_medicos,
                    familiares: registro.antecedentes_familiares,
                    sociales: registro.antecedentes_sociales,
                    observaciones: registro.observaciones
                }));
                window.location.href = 'ver_historial.html';
            });
            
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error:', error);
        const container = document.getElementById('expediente-container');
        container.innerHTML = '<p class="error-message">Error al cargar el expediente. Por favor intente nuevamente.</p>';
    }
});

// Funciones de formato (las mismas que en otros archivos)
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