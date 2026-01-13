// Variables Globales
const calendarEl = document.getElementById("calendar");
const monthYearEl = document.getElementById("monthYear");
const calendarGrid = document.getElementById("calendarGrid");
const inputFecha = document.getElementById("fecha");

// Datos de Ejemplo
let availableDates = ["2023-11-20", "2023-11-21", "2023-11-25"];
let busyDates = ["2023-11-18", "2023-11-22"];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = "";

// Calendario
function toggleCalendar() {
  const calendar = document.getElementById("calendar");
  const backdrop = document.getElementById("calendarBackdrop");
  calendar.classList.toggle("hidden");
  backdrop.style.display = calendar.classList.contains("hidden") ? "none" : "block";
  renderCalendar();
}

function clearDate() {
  selectedDate = "";
  inputFecha.value = "";
  toggleCalendar();
}

function selectDate() {
  if (selectedDate) {
    inputFecha.value = selectedDate.split("-").reverse().join("/");
  }
  toggleCalendar();
}

function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  } else if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
}

function renderCalendar() {
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  monthYearEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  calendarGrid.innerHTML = '';

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    calendarGrid.innerHTML += "<div></div>";
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    let cls = availableDates.includes(dateStr) ? "available" : 
             busyDates.includes(dateStr) ? "busy" : "";
    
    calendarGrid.innerHTML += `<div class="${cls}" onclick="${!busyDates.includes(dateStr) ? `selectDay('${dateStr}')` : ''}">${day}</div>`;
  }

  // En la función renderCalendar(), modifica la línea donde se crean los días:
calendarGrid.innerHTML += `<div class="${cls}${dateStr === selectedDate ? ' selected' : ''}" onclick="${!busyDates.includes(dateStr) ? `selectDay('${dateStr}')` : ''}">${day}</div>`;
}

function selectDay(dateStr) {
  if (!busyDates.includes(dateStr)) {
    selectedDate = dateStr;
    renderCalendar();
  }
}

// Métodos de Pago
function togglePaymentOptions(event) {
  event.stopPropagation();
  document.getElementById('paymentOptions').classList.toggle('show');
}

function selectPayment(method) {
  document.querySelectorAll('.payment-option').forEach(option => {
    option.style.backgroundColor = option.id === method ? '#f4f9fa' : 'white';
  });
}

// Validación
function validarFormulario() {
  const metodoPago = document.querySelector('input[name="metodoPago"]:checked');
  if (!metodoPago) {
    alert("Por favor seleccione un método de pago");
    return false;
  }
  alert("Formulario enviado correctamente");
  return true;
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.payment-methods')) {
      document.getElementById('paymentOptions').classList.remove('show');
    }
  });
});


// Métodos de Pago
function mostrarOpciones(event) {
  event.preventDefault();
  event.stopPropagation();
  const opciones = document.getElementById('opcionesPago');
  opciones.classList.toggle('hidden');
}

function mostrarMetodo(seleccionado) {
  document.querySelectorAll('[id^="tarjeta"], [id^="transferencia"]').forEach(elemento => {
    elemento.classList.add('hidden');
  });
  
  if (seleccionado === 'tarjeta') {
    document.getElementById('tarjeta').classList.remove('hidden');
  } else if (seleccionado === 'transferencia') {
    document.getElementById('transferencia').classList.remove('hidden');
  }
}

// Cerrar menú al hacer clic fuera
document.addEventListener('click', (e) => {
  if (!e.target.closest('.payment-methods')) {
    document.getElementById('opcionesPago').classList.add('hidden');
  }
});