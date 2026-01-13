document.addEventListener("DOMContentLoaded", () => {
  // Verificar si el usuario está autenticado
  const userData = JSON.parse(sessionStorage.getItem('userData'));
  
  if (!userData) {
    window.location.href = "../Inicio.html";
    return;
  }

  // Mapeo de tipos de usuario a rutas
  const redirectionMap = {
    paciente: "../Paciente/paciente_citas.html",
    medico: "../Medico/paciente_citas.html",
    asistente: "../Asistente/paciente_citas.html",
    admin: "../Administrador/ver_medicos_consultorios.html"
  };

  // Redirigir automáticamente según el tipo de usuario
  const route = redirectionMap[userData.tipo];
  if (route) {
    window.location.href = route;
    return;
  }

  // Si no coincide ningún tipo, mostrar botones (solo para desarrollo)
  const roleButtons = document.querySelectorAll(".role-btn");
  
  roleButtons.forEach(button => {
    button.addEventListener("click", () => {
      const selectedRole = button.dataset.role;
      window.location.href = redirectionMap[selectedRole];
    });
  });
});