document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector('form');
    
    // Función para validar formato de hora
    const validarHora = (hora) => {
        const regex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
        return regex.test(hora);
    };

    // Función para validar teléfono
    const validarTelefono = (telefono) => {
        return /^\d{10}$/.test(telefono);
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Obtener todos los valores del formulario
        const formData = {
            nombre: form.querySelector('input[placeholder="Nombre de la sucursal"]').value.trim(),
            zona: form.querySelector('input[placeholder="Nombre de la zona"]')?.value.trim(),
            calle: form.querySelector('input[placeholder="Calle"]').value.trim(),
            colonia: form.querySelector('input[placeholder="Colonia"]').value.trim(),
            numero: form.querySelector('input[placeholder="Numero ex."]').value.trim(),
            telefono: form.querySelector('input[type="tel"]').value.trim(),
            email: form.querySelector('input[type="email"]').value.trim(),
            hora_inicio: form.querySelector('input[placeholder="HH:MM:SS"]').value.trim(),
            hora_fin: form.querySelectorAll('input[placeholder="HH:MM:SS"]')[1].value.trim()
        };

        // Validaciones
        if (!formData.nombre || !formData.calle || !formData.colonia || 
            !formData.numero || !formData.telefono || !formData.email || 
            !formData.hora_inicio || !formData.hora_fin) {
            alert('Todos los campos son obligatorios');
            return;
        }

        if (!validarHora(formData.hora_inicio) || !validarHora(formData.hora_fin)) {
            alert('Formato de hora inválido. Use HH:MM:SS (24 horas)');
            return;
        }

        if (!validarTelefono(formData.telefono)) {
            alert('El teléfono debe tener 10 dígitos numéricos');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/alta/sucursal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error al registrar la sucursal');
            }
            
            alert(`Sucursal registrada exitosamente con código: ${result.codigo}`);
            form.reset();
            
        } catch (error) {
            console.error('Error en el registro:', error);
            alert(error.message || 'Error al conectar con el servidor');
        }
    });
});