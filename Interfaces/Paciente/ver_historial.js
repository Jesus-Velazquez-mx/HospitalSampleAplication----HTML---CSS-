document.addEventListener("DOMContentLoaded", () => {
    // Cargar datos del historial
    const historialData = JSON.parse(sessionStorage.getItem('historialDetalle'));
    
    if (!historialData) {
        window.location.href = 'expediente_paciente.html';
        return;
    }
    
    // Mostrar datos del historial
    document.getElementById('historial-id').textContent = historialData.id;
    document.getElementById('historial-fecha-creacion').textContent = formatDate(historialData.fecha_creacion);
    document.getElementById('historial-fecha-modificacion').textContent = formatDate(historialData.fecha_modificacion);
    
    // Mostrar los detalles del historial
    document.getElementById('historial-medicamentos').textContent = historialData.medicamentos || 'No especificado';
    document.getElementById('historial-enfermedades').textContent = historialData.enfermedades || 'No especificado';
    document.getElementById('historial-alergias').textContent = historialData.alergias || 'No especificado';
    document.getElementById('historial-cirugias').textContent = historialData.cirugias || 'No especificado';
    document.getElementById('historial-antecedentes').textContent = historialData.antecedentes || 'No especificado';
    document.getElementById('historial-familiares').textContent = historialData.familiares || 'No especificado';
    document.getElementById('historial-sociales').textContent = historialData.sociales || 'No especificado';
    document.getElementById('historial-observaciones').textContent = historialData.observaciones || 'No especificado';
    
    // Botón volver
    document.getElementById('btn-volver').addEventListener('click', () => {
        window.history.back();
    });
    
    // Función de formato de fecha
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
});