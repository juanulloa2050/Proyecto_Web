// =================== CONFIG ===================
const API_BASE = 'https://proyectowebbackend-production.up.railway.app/api';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

console.log('🔗 API Base URL:', API_BASE);

// =================== AUTH UTILS (sessionStorage) ===================
function saveAuthData(token, username, role) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify({ username, role }));
}

function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function getUserData() {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearAuthData() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

function isAuthenticated() {
  return !!getAuthToken();
}

function isAdmin() {
  const user = getUserData();
  return user && user.role === 'ADMIN';
}

// =================== LOGIN ===================
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('user').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      alert('Por favor completa todos los campos');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ingresando...';

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      saveAuthData(data.token, data.username, data.role);
      console.log('✅ Login exitoso:', data.username, data.role);

      // Redirigir a inicio (o a admin si es admin)
      if (data.role === 'ADMIN') {
        window.location.href = 'admin-users.html';
      } else {
        window.location.href = 'index.html';
      }
    } catch (error) {
      console.error('Error en login:', error);
      alert(`❌ Error: ${error.message}`);
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

// Exponer utilidades para otros scripts
window.authUtils = {
  isAuthenticated,
  isAdmin,
  getUserData,
  getAuthToken,
  logout,
  saveAuthData
};
