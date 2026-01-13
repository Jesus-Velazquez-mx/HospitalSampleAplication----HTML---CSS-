document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.querySelector("form");
  const registerBtn = document.querySelector(".register-btn");
  const loginLink = document.querySelector(".login-link a");

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Obtener valores del formulario
    const nombre = document.querySelector("input[placeholder='Nombre']").value.trim();
    const apellidos = document.querySelector("input[placeholder='Apellidos']").value.trim();
    const sexo = document.querySelector("input[placeholder='Sexo']").value.trim();
    const correo = document.querySelector("input[type='email']").value.trim();
    const telefono = document.querySelector("input[type='tel']").value.trim();
    const password = document.querySelector("input[placeholder='Contraseña']").value.trim();
    const confirmPassword = document.querySelector("input[placeholder='Confirmar contraseña']").value.trim();
    
    // Validaciones básicas
    if (!nombre || !apellidos || !correo || !telefono || !password || !confirmPassword) {
      alert("Por favor complete todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    try {
      // Desactivar el botón durante el registro
      registerBtn.disabled = true;
      registerBtn.textContent = "Registrando...";

      // Llamar al backend para registrar
      const response = await fetch('http://localhost:3000/api/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre,
          apellidos,
          correo,
          telefono,
          password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registro exitoso. Ahora puede iniciar sesión");
        window.location.href = "../InicioSesion/inicio.html";
      } else {
        alert(data.error || "Error en el registro");
      }
    } catch (error) {
      console.error("Error al registrar:", error);
      alert("Error al conectar con el servidor");
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = "Registrarse";
    }
  });

  // Enlace para ir al login
  loginLink.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "../InicioSesion/inicio.html";
  });
});