// =================== CONFIG ===================
const API_BASE = 'https://proyectowebbackend-production.up.railway.app/api';

// =================== REGISTRO LOGIC ===================
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.login-form');
  if (!form) return;

  // Verificar si ya está autenticado
  if (window.authUtils?.isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('user').value.trim();
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Validaciones
    if (!username || !password || !passwordConfirm) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (username.length < 3) {
      alert('El usuario debe tener al menos 3 caracteres');
      return;
    }

    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== passwordConfirm) {
      alert('Las contraseñas no coinciden');
      return;
    }

    // Deshabilitar botón
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registrando...';

    try {
      // Nota: Los usuarios normales se registran sin token (público)
      // Si necesitas que solo ADMIN pueda crear usuarios, deberás cambiar esto
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          role: 'USER' // Por defecto, los nuevos usuarios son USER
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error en el servidor' }));
        throw new Error(error.error || error.message || 'Error al registrar usuario');
      }

      const data = await response.json();
      
      alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
      window.location.href = 'login.html';

    } catch (error) {
      console.error('Error de registro:', error);
      
      // Mensajes más específicos
      if (error.message.includes('403')) {
        alert('No tienes permisos para crear usuarios. Solo los administradores pueden registrar nuevos usuarios.');
      } else if (error.message.includes('409') || error.message.includes('existe')) {
        alert('Este usuario ya existe. Por favor elige otro nombre de usuario.');
      } else {
        alert(error.message || 'Error al registrar. Intenta nuevamente.');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Ingresar';
    }
  });
});