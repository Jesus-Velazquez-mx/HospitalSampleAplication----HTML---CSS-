document.addEventListener("DOMContentLoaded", () => {
    // Cargar datos de la nueva consulta si existe
    const nuevaConsulta = JSON.parse(sessionStorage.getItem('nuevaConsulta'));
    
    if (nuevaConsulta && nuevaConsulta.esNuevo) {
        const hoy = new Date();
        const fechaActual = hoy.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        document.getElementById('historial-fecha-creacion').textContent = fechaActual;
        document.getElementById('historial-fecha-modificacion').textContent = fechaActual;

        // Limpiar campos para nueva consulta
        document.getElementById('historial-medicamentos').textContent = '';
        document.getElementById('historial-enfermedades').textContent = '';
        document.getElementById('historial-alergias').textContent = '';
        document.getElementById('historial-cirugias').textContent = '';
        document.getElementById('historial-antecedentes').textContent = '';
        document.getElementById('historial-familiares').textContent = '';
        document.getElementById('historial-sociales').textContent = '';
        document.getElementById('historial-observaciones').textContent = '';
        
        // Mostrar botón de fin consulta
        document.getElementById('btn-fin-consulta').style.display = 'inline-block';
        
        // Manejar clic en botón Fin Consulta
        document.getElementById('btn-fin-consulta').addEventListener('click', async () => {
            try {
                const response = await fetch('http://localhost:3000/api/historial/guardar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        codigoPaciente: nuevaConsulta.codigoPaciente,
                        codigoConsulta: nuevaConsulta.codigoConsulta,
                        medicamentos: document.getElementById('historial-medicamentos').textContent,
                        enfermedades: document.getElementById('historial-enfermedades').textContent,
                        alergias: document.getElementById('historial-alergias').textContent,
                        cirugias: document.getElementById('historial-cirugias').textContent,
                        antecedentes: document.getElementById('historial-antecedentes').textContent,
                        familiares: document.getElementById('historial-familiares').textContent,
                        sociales: document.getElementById('historial-sociales').textContent,
                        observaciones: document.getElementById('historial-observaciones').textContent
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    alert('Historial médico guardado correctamente');
                    sessionStorage.removeItem('nuevaConsulta');
                    window.location.href = 'paciente_citas.html';
                } else {
                    alert('Error al guardar el historial: ' + (data.message || 'Error desconocido'));
                }
            } catch (error) {
                console.error('Error al guardar historial:', error);
                alert('Error al guardar el historial médico');
            }
        });
    } else {
        // Ocultar botón de fin consulta si no es una nueva consulta
        document.getElementById('btn-fin-consulta').style.display = 'none';
    }
    
    // Botón volver
    document.getElementById('btn-volver').addEventListener('click', () => {
        window.history.back();
    });
});