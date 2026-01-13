document.addEventListener("DOMContentLoaded", () => {
    // Cargar datos de la cita
    const citaData = JSON.parse(sessionStorage.getItem('citaDetalle'));
    
    if (!citaData) {
        window.location.href = 'paciente_citas.html';
        return;
    }
    
    // Mostrar datos de la cita
    document.getElementById('cita-id').textContent = citaData.id;
    document.getElementById('cita-fecha').textContent = formatDate(citaData.fecha);
    document.getElementById('cita-hora').textContent = formatTime(citaData.hora);
    document.getElementById('cita-paciente').textContent = citaData.paciente;
    document.getElementById('cita-medico').textContent = citaData.medico;
    document.getElementById('cita-consultorio').textContent = citaData.consultorio;
    document.getElementById('cita-sucursal').textContent = citaData.sucursal;
    document.getElementById('cita-estado-text').textContent = citaData.estado;
    
    const estadoElement = document.getElementById('cita-estado');
    estadoElement.textContent = citaData.estado;
    estadoElement.className = `estado ${citaData.estado.toLowerCase()}`;
    
    // Mostrar botón de cancelar solo si no está cancelada
    if (citaData.estado.toLowerCase() !== 'cancelada') {
        document.getElementById('btn-cancelar').classList.remove('hidden');
        document.getElementById('btn-cancelar').addEventListener('click', () => {
            sessionStorage.setItem('citaCancelacion', JSON.stringify(citaData));
            window.location.href = 'cancelar_cita_paciente.html';
        });
    }
    
    // Botón volver
    document.getElementById('btn-volver').addEventListener('click', () => {
        window.history.back();
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