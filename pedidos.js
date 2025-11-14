// =================== CONFIG ===================
const API_PEDIDOS = 'https://script.google.com/macros/s/AKfycby1PE8A1GbuEkiSefoqRujAGhnNy-SjLqNDi5rA1bUxBhGuI4YDFWX7ABEe9BrMJFZd/exec';

// =================== AUTH UTILS (duplicado por si login.js no carga) ===================
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

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

// =================== AUTH CHECK ===================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔍 Verificando autenticación...');
  console.log('Token:', getAuthToken());
  console.log('User data:', getUserData());

  // Verificar autenticación
  if (!isAuthenticated()) {
    console.log('❌ No autenticado, redirigiendo a login...');
    alert('Debes iniciar sesión para acceder a esta página');
    window.location.href = 'login.html';
    return;
  }

  // Verificar si es ADMIN
  if (!isAdmin()) {
    console.log('❌ No es admin, redirigiendo a inicio...');
    alert('No tienes permisos de administrador');
    window.location.href = 'index.html';
    return;
  }

  console.log('✅ Autenticación verificada, cargando pedidos...');

  // Cargar pedidos
  await cargarPedidos();

  // Agregar botón de cerrar sesión si no existe
  agregarBotonLogout();
});

// =================== LOADER ===================
function showLoader() {
  const img = document.getElementById('cargando');
  if (img) img.style.display = 'block';
}

function hideLoader() {
  const img = document.getElementById('cargando');
  if (img) img.style.display = 'none';
}

// =================== CARGAR PEDIDOS ===================
async function cargarPedidos() {
  showLoader();

  try {
    const response = await fetch(API_PEDIDOS, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Error al cargar pedidos');
    }

    const data = await response.json();
    
    if (!Array.isArray(data?.data)) {
      console.warn('Respuesta sin data[]:', data);
      throw new Error('Formato de respuesta inválido');
    }

    const pedidos = data.data.map((row, idx) => ({
      id: row.id || idx + 1,
      timestamp: row.timestamp || row.fecha || '',
      nombre: row.nombre || '',
      telefono: row.telefono || '',
      ciudad: row.ciudad || '',
      direccion: row.direccion || '',
      otros_datos: row.otros_datos || row.otros || '',
      productos: row.productos || '',
      valor_total: Number(row.valor_total || 0),
      estado: row.estado || 'proceso'
    }));

    renderPedidos(pedidos);

  } catch (error) {
    console.error('Error cargando pedidos:', error);
    alert('No se pudieron cargar los pedidos: ' + error.message);
  } finally {
    hideLoader();
  }
}

// =================== RENDER PEDIDOS ===================
function renderPedidos(pedidos) {
  const listaProceso = document.getElementById('pedidos-proceso');
  const listaAtendidos = document.getElementById('pedidos-atendidos');

  if (!listaProceso || !listaAtendidos) return;

  listaProceso.innerHTML = '';
  listaAtendidos.innerHTML = '';

  const enProceso = pedidos.filter(p => p.estado !== 'atendido');
  const atendidos = pedidos.filter(p => p.estado === 'atendido');

  if (enProceso.length === 0) {
    listaProceso.innerHTML = '<li class="empty">No hay pedidos en proceso</li>';
  } else {
    enProceso.forEach(pedido => {
      listaProceso.appendChild(crearPedidoItem(pedido, false));
    });
  }

  if (atendidos.length === 0) {
    listaAtendidos.innerHTML = '<li class="empty">No hay pedidos atendidos</li>';
  } else {
    atendidos.forEach(pedido => {
      listaAtendidos.appendChild(crearPedidoItem(pedido, true));
    });
  }
}

// =================== CREAR ITEM DE PEDIDO ===================
function crearPedidoItem(pedido, esAtendido) {
  const li = document.createElement('li');
  li.className = 'pedido-item';
  
  const fecha = new Date(pedido.timestamp).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short'
  });

  li.innerHTML = `
    <div class="pedido-header">
      <strong>Pedido #${pedido.id}</strong>
      <span class="fecha">${fecha}</span>
    </div>
    <div class="pedido-info">
      <p><strong>Cliente:</strong> ${pedido.nombre}</p>
      <p><strong>Teléfono:</strong> ${pedido.telefono}</p>
      <p><strong>Ciudad:</strong> ${pedido.ciudad}</p>
      <p><strong>Dirección:</strong> ${pedido.direccion}</p>
      ${pedido.otros_datos ? `<p><strong>Otros:</strong> ${pedido.otros_datos}</p>` : ''}
    </div>
    <div class="pedido-productos">
      <p><strong>Productos:</strong></p>
      <p class="productos-detalle">${pedido.productos}</p>
    </div>
    <div class="pedido-footer">
      <strong class="total">Total: $${pedido.valor_total.toFixed(2)}</strong>
      ${!esAtendido ? `
        <button class="btn-atender" data-id="${pedido.id}">
          Marcar como atendido
        </button>
      ` : `
        <span class="badge-atendido">✓ Atendido</span>
      `}
    </div>
  `;

  // Agregar evento al botón si no está atendido
  if (!esAtendido) {
    const btnAtender = li.querySelector('.btn-atender');
    btnAtender?.addEventListener('click', () => marcarComoAtendido(pedido.id));
  }

  return li;
}

// =================== MARCAR COMO ATENDIDO ===================
async function marcarComoAtendido(pedidoId) {
  if (!confirm('¿Marcar este pedido como atendido?')) return;

  try {
    // Aquí deberías hacer un POST/PUT a tu API para actualizar el estado
    // Por ahora, solo recargamos (Google Sheets requiere implementar el endpoint)
    
    alert('Funcionalidad pendiente: Necesitas implementar el endpoint de actualización en el backend de Google Sheets');
    
    // await fetch(`${API_PEDIDOS}?id=${pedidoId}`, {
    //   method: 'PUT',
    //   body: JSON.stringify({ estado: 'atendido' })
    // });
    
    // await cargarPedidos();
  } catch (error) {
    console.error('Error:', error);
    alert('Error al actualizar el pedido');
  }
}

// =================== BOTÓN LOGOUT ===================
function agregarBotonLogout() {
  const nav = document.querySelector('nav');
  if (!nav) return;

  // Verificar si ya existe
  if (document.getElementById('btn-logout')) return;

  const userData = window.authUtils?.getUserData();
  if (!userData) return;

  // Crear botón de logout
  const logoutBtn = document.createElement('a');
  logoutBtn.id = 'btn-logout';
  logoutBtn.href = '#';
  logoutBtn.innerHTML = `
    <span style="margin-right: 10px;">👤 ${userData.username}</span>
    <span style="color: #ff6b6b;">Cerrar sesión</span>
  `;
  logoutBtn.style.cssText = 'display: flex; align-items: center; gap: 5px;';
  
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('¿Cerrar sesión?')) {
      window.authUtils?.logout();
    }
  });

  // Reemplazar el enlace de login
  const loginLink = document.getElementById('enlace-login');
  if (loginLink) {
    loginLink.replaceWith(logoutBtn);
  } else {
    nav.appendChild(logoutBtn);
  }
}