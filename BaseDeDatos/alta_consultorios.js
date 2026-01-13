document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector('form');
    
    // Cargar sucursales disponibles
    async function cargarSucursales() {
        try {
            const response = await fetch('http://localhost:3000/api/sucursales');
            const sucursales = await response.json();
            
            const inputSucursal = form.querySelector('input[placeholder="Nombre de la sucursal"]');
            inputSucursal.innerHTML = '';
            
            // Convertir el input en un datalist o select
            const datalist = document.createElement('datalist');
            datalist.id = 'sucursales-list';
            
            sucursales.forEach(sucursal => {
                const option = document.createElement('option');
                option.value = sucursal.nombre;
                option.dataset.codigo = sucursal.codigo_sucursal;
                datalist.appendChild(option);
            });
            
            inputSucursal.insertAdjacentElement('afterend', datalist);
            inputSucursal.setAttribute('list', 'sucursales-list');
            
        } catch (error) {
            console.error('Error al cargar sucursales:', error);
        }
    }
    
    cargarSucursales();
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nombreSucursal = form.querySelector('input[placeholder="Nombre de la sucursal"]').value;
        const option = document.querySelector(`#sucursales-list option[value="${nombreSucursal}"]`);
        
        if (!option) {
            alert('Por favor seleccione una sucursal válida');
            return;
        }
        
        const data = {
            nombre: form.querySelector('input[placeholder="Nombre"]').value,
            sucursal: option.dataset.codigo
        };
        
        try {
            const response = await fetch('http://localhost:3000/api/alta/consultorio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert(`Consultorio registrado exitosamente con código: ${result.codigo}`);
                form.reset();
            } else {
                alert(result.error || 'Error al registrar el consultorio');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con el servidor');
        }
    });
});