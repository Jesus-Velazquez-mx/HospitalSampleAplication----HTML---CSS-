document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Obtener el código del paciente del sessionStorage
        const userData = JSON.parse(sessionStorage.getItem('userData'));
        const codigoPaciente = userData?.codigo_persona;
        
        if (!codigoPaciente) {
            throw new Error('No se encontró información del paciente');
        }

        // Obtener las recetas del paciente
        const response = await fetch(`http://localhost:3000/api/recetas/${codigoPaciente}`);
        if (!response.ok) {
            throw new Error('Error al obtener las recetas');
        }
        
        const recetas = await response.json();
        const container = document.getElementById('recetas-container');
        const template = document.querySelector('.expediente-card.template');
        
        if (!template) {
            throw new Error('No se encontró la plantilla de recetas');
        }

        // Limpiar contenedor antes de agregar nuevos registros
        container.innerHTML = '';

        if (recetas.length === 0) {
            container.innerHTML = '<p class="no-data-message">No hay recetas registradas</p>';
            return;
        }

        recetas.forEach(receta => {
            const card = template.cloneNode(true);
            card.style.display = '';
            card.classList.remove('template');
            
            card.querySelector('.codigo-receta').textContent = receta.codigo_receta;
            card.querySelector('.fecha-receta').textContent = formatDate(receta.fecha_receta);
            card.querySelector('.nombre-medico').textContent = receta.nombre_medico;
            card.querySelector('.fecha-emision').textContent = formatDate(receta.fecha_receta);
            card.querySelector('.consulta-relacionada').textContent = receta.consulta_relacionada || 'No especificada';
            
            // Configurar el botón de ver receta
            const btnVer = card.querySelector('.btn-ver');
            btnVer.addEventListener('click', () => {
                sessionStorage.setItem('recetaDetalle', JSON.stringify({
                    id: receta.codigo_receta,
                    fecha_emision: receta.fecha_receta,
                    medico: receta.nombre_medico,
                    especialidad: receta.especialidad,
                    detalles: receta.detalles,
                    medicamentos: receta.medicamentos || [],
                    consulta_relacionada: receta.consulta_relacionada
                }));
                window.location.href = 'ver_recetas.html';
            });
            
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error:', error);
        const container = document.getElementById('recetas-container');
        container.innerHTML = '<p class="error-message">Error al cargar las recetas. Por favor intente nuevamente.</p>';
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