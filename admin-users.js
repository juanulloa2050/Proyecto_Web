// =================== CONFIG ===================
const API_BASE = 'https://proyectowebbackend-production.up.railway.app/api';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// =================== AUTH UTILS ===================
function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function getUserData() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

function isAuthenticated() {
  return !!getAuthToken();
}

function isAdmin() {
  const user = getUserData();
  return user?.role === 'ADMIN';
}

function clearAuthData() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

// =================== LOADER ===================
function showLoader() {
  const img = document.getElementById('cargando');
  if (img) img.style.display = 'block';
}

function hideLoader() {
  const img = document.getElementById('cargando');
  if (img) img.style.display = 'none';
}

// =================== CARGAR USUARIOS ===================
async function cargarUsuarios() {
  showLoader();
  try {
    const token = getAuthToken();
    if (!token) throw new Error('No hay token.');

    const response = await fetch(`${API_BASE}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('No autorizado');
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Error al cargar usuarios:\n${errText}`);
    }

    const users = await response.json();
    renderUsuarios(users);
  } catch (error) {
    console.error('Error cargando usuarios:', error);
    alert('No se pudieron cargar los usuarios.\n' + error.message);
    mostrarNoAutorizado();
  } finally {
    hideLoader();
  }
}

// =================== RENDER USUARIOS ===================
function renderUsuarios(users) {
  const container = document.getElementById('users-list');
  if (!container) return;

  if (!Array.isArray(users) || users.length === 0) {
    container.innerHTML = '<p class="empty">No hay usuarios registrados</p>';
    return;
  }

  container.innerHTML = '';

  users.forEach(user => {
    const userCard = document.createElement('div');
    userCard.className = 'user-card';
    
    const roleClass = user.role === 'ADMIN' ? 'role-admin' : 'role-user';
    const roleIcon = user.role === 'ADMIN' ? '👑' : '👤';

    userCard.innerHTML = `
      <div class="user-info">
        <span class="user-icon">${roleIcon}</span>
        <div class="user-details">
          <strong class="username">${user.username}</strong>
          <span class="user-role ${roleClass}">${user.role}</span>
        </div>
      </div>
      <div class="user-meta">
        <small>ID: ${user.id}</small>
      </div>
    `;

    container.appendChild(userCard);
  });
}

// =================== CONFIGURAR FORMULARIO ===================
function configurarFormulario() {
  const form = document.getElementById('create-user-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value;
    const role = document.getElementById('new-role').value;

    if (username.length < 3) {
      alert('El usuario debe tener al menos 3 caracteres');
      return;
    }

    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creando...';

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, role })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error en el servidor' }));
        throw new Error(error.error || error.message || 'Error al crear usuario');
      }

      const newUser = await response.json();
      
      alert(`✅ Usuario "${newUser.username}" creado exitosamente`);
      form.reset();
      await cargarUsuarios();
    } catch (error) {
      console.error('Error creando usuario:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Crear Usuario';
    }
  });
}

// =================== BOTÓN LOGOUT ===================
function agregarBotonLogout() {
  const userAdminLink = document.getElementById('enlace-user-admin');
  if (userAdminLink) {
    const userData = getUserData();
    if (userData) {
      const infoSpan = document.createElement('span');
      infoSpan.className = 'user-header-info';
      infoSpan.textContent = userData.username;
      userAdminLink.appendChild(infoSpan);
    }
  }

  const nav = document.querySelector('header nav');
  if (!nav) return;

  const logoutBtn = document.createElement('a');
  logoutBtn.href = '#';
  logoutBtn.id = 'logout-link';
  logoutBtn.textContent = 'Cerrar sesión';

  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('¿Cerrar sesión?')) {
      clearAuthData();
      window.location.href = 'login.html';
    }
  });

  nav.appendChild(logoutBtn);
}

// =================== MOSTRAR NO AUTORIZADO ===================
function mostrarNoAutorizado() {
  const panel = document.getElementById('users-panel');
  if (!panel) return;

  panel.innerHTML = `
    <div class="no-autorizado">
      <h2>🚫 Acceso Denegado</h2>
      <p>No tienes permisos de administrador para acceder a esta página.</p>
      <p>Solo los administradores pueden gestionar usuarios.</p>
      <br>
      <a href="index.html" class="btn-volver">← Volver al Inicio</a>
    </div>
  `;
}

// =================== BOOTSTRAP ===================
document.addEventListener('DOMContentLoaded', async () => {
  // 1) Si NO hay sesión => ir al login
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  // 2) Si hay sesión pero NO es admin => mostrar acceso denegado
  if (!isAdmin()) {
    agregarBotonLogout();
    mostrarNoAutorizado();
    return;
  }

  // 3) Es admin => cargar normalmente
  console.log('✅ Acceso autorizado, cargando usuarios...');

  await cargarUsuarios();
  configurarFormulario();
  agregarBotonLogout();
});
