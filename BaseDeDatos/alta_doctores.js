document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('form-doctor');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }

        const data = {
            nombre: document.getElementById('nombre').value,
            apellidos: document.getElementById('apellidos').value,
            sexo: document.getElementById('sexo').value,
            documento: document.getElementById('documento').value,
            fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
            calle: document.getElementById('calle').value,
            colonia: document.getElementById('colonia').value,
            numero: document.getElementById('numero').value,
            cedula: document.getElementById('cedula').value,
            especialidad: document.getElementById('especialidad').value,
            hora_inicio: document.getElementById('hora_inicio').value,
            hora_fin: document.getElementById('hora_fin').value,
            correo: document.getElementById('correo').value,
            telefono: document.getElementById('telefono').value,
            password: password
        };

        try {
            const response = await fetch('http://localhost:3000/api/alta/doctor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert(`Médico registrado exitosamente con código: ${result.codigo}`);
                form.reset();
            } else {
                alert(result.error || result.message || 'Error al registrar el médico');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con el servidor');
        }
    });
});
