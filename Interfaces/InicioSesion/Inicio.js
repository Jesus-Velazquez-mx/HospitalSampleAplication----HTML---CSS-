document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("login-btn");
  const usernameInput = document.querySelector("input[type='text']");
  const passwordInput = document.querySelector("input[type='password']");

  loginBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      alert("Por favor ingrese usuario y contraseña");
      return;
    }

    try {
      // Llamar al backend para verificar credenciales
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      // En Inicio.js, modificar la parte del login exitoso
    if (response.ok) {
      // Guardar datos de usuario en sessionStorage
      sessionStorage.setItem('userData', JSON.stringify(data.user));
      // Guardar específicamente el código de persona (paciente)
      sessionStorage.setItem('codigoPaciente', data.user.codigo_persona);
      window.location.href = "./TipoUser.html";
    } else {
        alert(data.error || "Credenciales incorrectas");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("Error al conectar con el servidor");
    }
  });
});