// =================== CONFIG ===================
const API_BASE = 'https://proyectowebbackend-production.up.railway.app/api';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// =================== AUTH UTILS ===================
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

function isAuthenticated() {
  return !!getAuthToken();
}

function isAdmin() {
  const user = getUserData();
  return user?.role === 'ADMIN';
}

function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
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

// =================== AUTH CHECK ===================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔍 Verificando permisos de administrador...');

  // Verificar autenticación
  if (!isAuthenticated()) {
    alert('Debes iniciar sesión para acceder a esta página');
    window.location.href = 'login.html';
    return;
  }

  // Verificar si es ADMIN
  if (!isAdmin()) {
    // Mostrar página de no autorizado
    mostrarNoAutorizado();
    return;
  }

  console.log('✅ Acceso autorizado, cargando usuarios...');

  // Cargar usuarios
  await cargarUsuarios();

  // Configurar formulario
  configurarFormulario();

  // Agregar botón de logout
  agregarBotonLogout();
});

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
  
  agregarBotonLogout();
}

// =================== CARGAR USUARIOS ===================
async function cargarUsuarios() {
  showLoader();

  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Error al cargar usuarios');
    }

    const users = await response.json();
    renderUsuarios(users);

  } catch (error) {
    console.error('Error cargando usuarios:', error);
    document.getElementById('users-list').innerHTML = `
      <p class="error-message">Error al cargar usuarios: ${error.message}</p>
    `;
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
      
      // Recargar lista de usuarios
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
  if (!userAdminLink) return;

  const userData = getUserData();
  if (!userData) return;

  // Crear menú desplegable
  const userMenu = document.createElement('div');
  userMenu.className = 'user-menu';
  userMenu.innerHTML = `
    <a href="#" class="user-menu-trigger">
      <img src="Imagenes/user.png" alt="Usuario" id="login">
      <span class="username-display">${userData.username}</span>
    </a>
    <div class="user-dropdown" style="display: none;">
      <a href="admin-users.html">👥 Gestionar Usuarios</a>
      <a href="pedidos.html">📦 Pedidos</a>
      <a href="#" id="logout-link">🚪 Cerrar Sesión</a>
    </div>
  `;

  userAdminLink.replaceWith(userMenu);

  // Toggle dropdown
  const trigger = userMenu.querySelector('.user-menu-trigger');
  const dropdown = userMenu.querySelector('.user-dropdown');
  
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  });

  // Cerrar dropdown al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!userMenu.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  // Logout
  document.getElementById('logout-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('¿Cerrar sesión?')) {
      clearAuthData();
      window.location.href = 'login.html';
    }
  });
}