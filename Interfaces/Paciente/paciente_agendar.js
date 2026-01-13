// paciente_agendar.js

function obtenerNombreDia(fechaStr) {
  if (!fechaStr) return '';
  const fecha = new Date(fechaStr);
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[fecha.getDay()];
}

function formatearFechaDMY(fechaStr) {
  if (!fechaStr) return '';
  const fecha = new Date(fechaStr);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

async function cargarDoctores(especialidad = null, sucursal = null) {
  const doctorSelect = document.getElementById('doctor');
  doctorSelect.innerHTML = '<option value="">Todos los doctores</option>';

  let url = 'http://localhost:3000/api/doctores2';
  const params = new URLSearchParams();
  if (especialidad) params.append('especialidad', especialidad);
  if (sucursal) params.append('sucursal', sucursal);
  if (params.toString()) url += '?' + params.toString();

  const res = await fetch(url);
  const data = await res.json();

  data.forEach(doc => {
    const opt = document.createElement('option');
    opt.value = doc.codigo_medico;

    const horaInicio = doc.hora_inicio?.split('T')?.[1]?.substring(0, 5) || '--:--';
    const horaFin = doc.hora_fin?.split('T')?.[1]?.substring(0, 5) || '--:--';
    const dia = obtenerNombreDia(doc.fecha);
    const fechaDMY = formatearFechaDMY(doc.fecha);

    opt.textContent = `${doc.nombre} (${dia} ${fechaDMY} ${horaInicio} - ${horaFin})`;
    doctorSelect.appendChild(opt);
  });
}

async function cargarEspecialidades(sucursal = null) {
  const especialidadSelect = document.getElementById('especialidad');
  const valorActual = especialidadSelect.value;
  especialidadSelect.innerHTML = '<option value="">Todas las especialidades</option>';

  let url = 'http://localhost:3000/api/especialidades';
  if (sucursal) url += `?sucursal=${encodeURIComponent(sucursal)}`;

  const res = await fetch(url);
  const data = await res.json();
  data.forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.especialidad;
    opt.textContent = e.especialidad;
    especialidadSelect.appendChild(opt);
  });

  if (valorActual && [...especialidadSelect.options].some(o => o.value === valorActual)) {
    especialidadSelect.value = valorActual;
  }
}

async function cargarZonas(especialidad = null) {
  const zonaSelect = document.getElementById('zona');
  const valorActual = zonaSelect.value;
  zonaSelect.innerHTML = '<option value="">Todas las zonas</option>';

  let url = 'http://localhost:3000/api/sucursales';
  if (especialidad) url += `?especialidad=${encodeURIComponent(especialidad)}`;

  const res = await fetch(url);
  const data = await res.json();
  data.forEach(z => {
    const opt = document.createElement('option');
    opt.value = z.codigo_sucursal;
    opt.textContent = z.nombre;
    zonaSelect.appendChild(opt);
  });

  if (valorActual && [...zonaSelect.options].some(o => o.value === valorActual)) {
    zonaSelect.value = valorActual;
  }
}

function mostrarOpciones(event) {
  document.getElementById('opcionesPago').classList.toggle('hidden');
}

function mostrarMetodo(metodo) {
  document.getElementById('tarjeta').classList.add('hidden');
  document.getElementById('transferencia').classList.add('hidden');
  document.getElementById(metodo).classList.remove('hidden');
}

function generarMontoAleatorio() {
  const monto = Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
  document.getElementById('montoTotal').value = `$${monto}.00`;
  document.getElementById('anticipo').value = `$${(monto / 2).toFixed(2)}`;
}

async function validarFormulario() {
  const fecha = document.getElementById('fecha').value;
  let hora = document.getElementById('hora').value.trim();
  const codigoMedico = document.getElementById('doctor').value;
  const metodoPagoSeleccionado = document.querySelector('input[name="metodoPago"]:checked');
  const monto = parseFloat(document.getElementById('montoTotal').value.replace('$', '')) || 0;
  const anticipo = parseFloat(document.getElementById('anticipo').value.replace('$', '')) || 0;
  const userData = JSON.parse(sessionStorage.getItem('userData'));
  const codigoPaciente = userData?.codigo_persona;

  if (!fecha || !hora || !codigoMedico || !codigoPaciente) {
    alert('Completa todos los campos obligatorios');
    return;
  }

  const horaParts = hora.split(':');
  if (horaParts.length === 2) {
    hora += ':00';
  } else if (horaParts.length === 1 || horaParts.length > 3) {
    alert('Formato de hora inválido. Usa HH:MM:SS');
    return;
  } else if (horaParts.length === 3) {
    if (
      horaParts.some(p => isNaN(parseInt(p))) ||
      horaParts[0].length !== 2 ||
      horaParts[1].length !== 2 ||
      horaParts[2].length !== 2
    ) {
      alert('La hora debe estar en formato HH:MM:SS');
      return;
    }
  }

  if (!metodoPagoSeleccionado) {
    alert('Selecciona un método de pago');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/citas/nueva', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigoPaciente, codigoMedico, fecha, hora, monto, anticipo })
    });

    const data = await res.json();
    if (data.success) {
      alert('Cita registrada exitosamente con código: ' + data.codigoCita);
      window.location.href = 'paciente_citas.html';
    } else {
      throw new Error(data.error || data.message || 'Error desconocido');
    }
  } catch (error) {
    console.error('Error al registrar cita:', error);
    alert('Error al registrar cita: ' + (error.message || 'desconocido'));
  }
}
document.addEventListener('DOMContentLoaded', () => {
  cargarEspecialidades();
  cargarZonas();
  cargarDoctores();

  document.getElementById('especialidad').addEventListener('change', async () => {
    const especialidad = document.getElementById('especialidad').value || null;
    const zona = document.getElementById('zona').value || null;
    await cargarZonas(especialidad);
    await cargarDoctores(especialidad, zona);
  });

  document.getElementById('zona').addEventListener('change', async () => {
    const zona = document.getElementById('zona').value || null;
    const especialidad = document.getElementById('especialidad').value || null;
    await cargarEspecialidades(zona);
    await cargarDoctores(especialidad, zona);
  });

  document.getElementById('doctor').addEventListener('change', () => {
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    if (fecha && hora) generarMontoAleatorio();
  });

  document.getElementById('fecha').addEventListener('change', () => {
    const doctor = document.getElementById('doctor').value;
    const hora = document.getElementById('hora').value;
    if (doctor && hora) generarMontoAleatorio();
  });

  document.getElementById('hora').addEventListener('change', () => {
    const doctor = document.getElementById('doctor').value;
    const fecha = document.getElementById('fecha').value;
    if (doctor && fecha) generarMontoAleatorio();
  });
});
