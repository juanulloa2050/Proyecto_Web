// =================== CONFIG ===================
const API_BASE = 'https://proyectowebbackend-production.up.railway.app/api';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// Mensaje de debug
console.log('🔗 API Base URL:', API_BASE);

// =================== AUTH UTILS ===================
function saveAuthData(token, username, role) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify({ username, role }));
}

function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUserData() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function isAuthenticated() {
  return !!getAuthToken();
}

function isAdmin() {
  const user = getUserData();
  return user?.role === 'ADMIN';
}

// =================== LOGIN LOGIC ===================
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.login-form');
  if (!form) return;

  // Verificar si ya está autenticado
  if (isAuthenticated()) {
    const user = getUserData();
    if (user?.role === 'ADMIN') {
      window.location.href = 'pedidos.html';
    } else {
      window.location.href = 'index.html';
    }
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('user').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!username || !password) {
      alert('Por favor completa todos los campos');
      return;
    }

    // Deshabilitar botón
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ingresando...';

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Guardar datos de autenticación
      saveAuthData(data.token, data.username, data.role);

      // Redirigir según el rol
      if (data.role === 'ADMIN') {
        alert(`Bienvenido Administrador ${data.username}!`);
        window.location.href = 'pedidos.html';
      } else {
        alert(`Bienvenido ${data.username}!`);
        window.location.href = 'index.html';
      }

    } catch (error) {
      console.error('Error de login:', error);
      alert(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Ingresar';
    }
  });
});

// =================== LOGOUT ===================
function logout() {
  clearAuthData();
  window.location.href = 'login.html';
}

// Exportar funciones para uso global
window.authUtils = {
  isAuthenticated,
  isAdmin,
  getUserData,
  getAuthToken,
  logout,
  saveAuthData
};