document.addEventListener('DOMContentLoaded', async function() {
    try {
const response = await fetch('http://localhost:3000/api/doctores');        const doctor = await response.json();
        
        const container = document.getElementById('doctores-container');
        
        doctores.forEach(doctor => {
            const card = document.createElement('div');
            card.className = 'card';
            
            card.innerHTML = `
                <div class="card-header">
                    Doctor ${doctor.codigo_medico}
                    <button class="options-btn" aria-label="Opciones">•••</button>
                </div>
                <div class="card-body">
                    <div class="avatar">${doctor.primer_nombre.charAt(0)}</div>
                    <div class="info">
                        <strong>${doctor.primer_nombre} ${doctor.apellido_paterno} ${doctor.apellido_materno || ''}</strong>
                        <p>Teléfono: ${doctor.telefono}</p>
                        <p>Correo: ${doctor.correo_electronico}</p>
                        <p>Especialidad: ${doctor.especialidad}</p>
                        <p>Horario: ${formatTime(doctor.horario_inicio)} - ${formatTime(doctor.horario_fin)}</p>
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error al cargar doctores:', error);
        // Mostrar mensaje de error al usuario si es necesario
    }
});

function formatTime(timeString) {
    if (!timeString) return '--:--';
    
    // Primero verifica si ya está en formato HH:MM:SS
    if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    }
    
    // Si es un objeto de tiempo de SQL Server
    if (timeString.seconds !== undefined) {
        const pad = num => num.toString().padStart(2, '0');
        return `${pad(timeString.hours)}:${pad(timeString.minutes)}`;
    }
    
    // Si es un string en formato HH:MM
    if (timeString.match(/^\d{2}:\d{2}$/)) {
        return timeString;
    }
    
    // Si no reconocemos el formato
    console.warn('Formato de tiempo no reconocido:', timeString);
    return '--:--';
}
