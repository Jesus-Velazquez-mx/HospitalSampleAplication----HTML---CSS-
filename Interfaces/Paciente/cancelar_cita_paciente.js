document.addEventListener("DOMContentLoaded", () => {
    // Cargar datos de la cita
    const citaData = JSON.parse(sessionStorage.getItem('citaCancelacion'));
    
    if (!citaData) {
        window.location.href = 'paciente_citas.html';
        return;
    }
    
    // Mostrar datos de la cita
    document.getElementById('cita-id').textContent = citaData.id;
    document.getElementById('cita-fecha').textContent = formatDate(citaData.fecha) + ' ' + formatTime(citaData.hora);
    document.getElementById('cita-horario').textContent = formatTime(citaData.hora);
    document.getElementById('cita-medico').textContent = citaData.medico;
    document.getElementById('cita-consultorio').textContent = citaData.consultorio;
    document.getElementById('cita-sucursal').textContent = citaData.sucursal;
    
    const estadoElement = document.getElementById('cita-estado');
    estadoElement.textContent = citaData.estado;
    estadoElement.className = citaData.estado.toLowerCase();
    
    // Manejador del formulario de cancelación
    const formCancelacion = document.querySelector('.form-cancelacion');
    formCancelacion.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const razon = formCancelacion.querySelector('textarea').value;
        const password = formCancelacion.querySelector('input[type="password"]').value;
        
        try {
            const response = await fetch('http://localhost:3000/api/citas/cancelar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    citaId: citaData.id,
                    razon,
                    password
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Cita cancelada exitosamente');
                window.location.href = 'paciente_citas.html';
            } else {
                alert(data.error || 'Error al cancelar la cita');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con el servidor');
        }
    });
    
    // Función para formatear fecha (similar a la de cargarCitas.js)
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
});

var btnRegresar = document.getElementsByClassName('btn-regresar')[0];
btnRegresar.addEventListener('click', function() {
  window.location.href = 'paciente_citas.html';
});
