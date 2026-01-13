document.addEventListener('DOMContentLoaded', async function() {
    try {
const response = await fetch('http://localhost:3000/api/asistentes');        const asistentes = await response.json();
        
        const container = document.getElementById('asistentes-container');
        
        asistentes.forEach(asistente => {
            const card = document.createElement('div');
            card.className = 'card';
            
            card.innerHTML = `
                <div class="card-header">
                    Asistente ${asistente.codigo_asistente}
                    <button class="options-btn" aria-label="Opciones">•••</button>
                </div>
                <div class="card-body">
                    <div class="avatar">${asistente.primer_nombre.charAt(0)}</div>
                    <div class="info">
                        <strong>${asistente.primer_nombre} ${asistente.apellido_paterno} ${asistente.apellido_materno || ''}</strong>
                        <p>Teléfono: ${asistente.telefono}</p>
                        <p>Correo: ${asistente.correo_electronico}</p>
                        <p>Horario: ${formatTime(asistente.horario_inicio)} - ${formatTime(asistente.horario_fin)}</p>
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error al cargar asistentes:', error);
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

document.addEventListener('DOMContentLoaded', async function() {
      try {
        const response = await fetch('http://localhost:3000/api/asistentes');
        const asistentes = await response.json();
        const container = document.getElementById('asistentes-container');
        const template = document.querySelector('.card.template');
        
        // Función mejorada para extraer SOLO la hora de formatos ISO (1970-01-01T08:00:00) o HH:MM:SS
        const getHoraFormateada = (timeValue) => {
          if (!timeValue) return '--:--';
          
          // Si es un string con formato ISO (1970-01-01T08:00:00)
          if (typeof timeValue === 'string' && timeValue.includes('T')) {
            const timePart = timeValue.split('T')[1]; // Obtiene la parte después de la T
            const [hours, minutes] = timePart.split(':');
            return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
          }
          
          // Si es un objeto (viene de SQL Server)
          if (typeof timeValue === 'object' && timeValue.hours !== undefined) {
            return `${String(timeValue.hours).padStart(2, '0')}:${String(timeValue.minutes).padStart(2, '0')}`;
          }
          
          // Si es un string simple (HH:MM:SS o HH:MM)
          if (typeof timeValue === 'string') {
            const parts = timeValue.split(':');
            if (parts.length >= 2) {
              return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
            }
          }
          
          return '--:--';
        };

        asistentes.forEach(asistente => {
          const card = template.cloneNode(true);
          card.style.display = '';
          
          card.querySelector('.codigo').textContent = asistente.codigo_asistente;
          card.querySelector('.avatar').textContent = asistente.primer_nombre.charAt(0);
          card.querySelector('.nombre').textContent = `${asistente.primer_nombre} ${asistente.apellido_paterno} ${asistente.apellido_materno || ''}`;
          card.querySelector('.telefono').textContent = `Teléfono: ${asistente.telefono || 'No disponible'}`;
          card.querySelector('.correo').textContent = `Correo: ${asistente.correo_electronico || 'No disponible'}`;
          
          // Extraer y mostrar solo las horas
          const horaInicio = getHoraFormateada(asistente.horario_inicio);
          const horaFin = getHoraFormateada(asistente.horario_fin);
          card.querySelector('.horario').textContent = `${horaInicio} - ${horaFin}`;
          
          container.appendChild(card);
        });
      } catch (error) {
        console.error('Error al cargar asistentes:', error);
        container.innerHTML = '<p style="color:red">Error al cargar los datos</p>';
      }
    });