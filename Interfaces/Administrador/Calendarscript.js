const calendarDays = document.getElementById("calendar-days");
const selectedDateInput = document.getElementById("selected-date-input");
const monthSelect = document.getElementById("month-select");
const yearSelect = document.getElementById("year-select");

const today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();
let selectedDateDiv = null;

// Llenar el selector de meses
const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
  "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
monthNames.forEach((name, index) => {
  const option = document.createElement("option");
  option.value = index;
  option.textContent = name;
  monthSelect.appendChild(option);
});

// Llenar el selector de años (actual hasta actual + 6) 
for (let year = today.getFullYear(); year <= today.getFullYear() + 6; year++) {
  const option = document.createElement("option");
  option.value = year;
  option.textContent = year;
  yearSelect.appendChild(option);
}

monthSelect.value = currentMonth;
yearSelect.value = currentYear;

function renderCalendar(month, year) {
  calendarDays.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    calendarDays.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement("div");
    dayDiv.textContent = day;

    dayDiv.addEventListener("click", () => {
      if (selectedDateDiv) {
        selectedDateDiv.classList.remove("selected");
      }
      dayDiv.classList.add("selected");
      selectedDateDiv = dayDiv;

      const formatted = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
      selectedDateInput.value = formatted;
    });

    calendarDays.appendChild(dayDiv);
  }
}

monthSelect.addEventListener("change", () => {
  currentMonth = parseInt(monthSelect.value);
  renderCalendar(currentMonth, currentYear);
});

yearSelect.addEventListener("change", () => {
  currentYear = parseInt(yearSelect.value);
  renderCalendar(currentMonth, currentYear);
});

renderCalendar(currentMonth, currentYear);
