// =================== CONFIG ===================
const API_BASE = 'https://proyectowebbackend-production.up.railway.app/api';
const API_PEDIDOS = `${API_BASE}/pedidos`;

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const fmt = n => Number(n).toFixed(2);

// =================== AUTH UTILS ===================
function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUserData() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isAuthenticated() {
  return !!getAuthToken();
}

function isAdmin() {
  const u = getUserData();
  return !!u && u.role === 'ADMIN';
}

function ensureAuthenticatedAdmin() {
  if (!isAuthenticated() || !isAdmin()) {
    alert('Debes iniciar sesión como administrador para ver los pedidos.');
    window.location.href = 'login.html';
  }
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

// =================== RENDER DE PEDIDOS ===================
function crearPedidoItem(pedido, isAtendido) {
  const li = document.createElement('li');
  li.className = 'pedido-item';

  let fechaStr = pedido.timestamp || '';
  try {
    const d = new Date(pedido.timestamp);
    if (!isNaN(d.getTime())) {
      fechaStr = d.toLocaleString('es-CO');
    }
  } catch {
    // dejamos el timestamp crudo
  }

  li.innerHTML = `
    <div class="pedido-header">
      <span class="pedido-id">#${pedido.id}</span>
      <span class="pedido-fecha">${fechaStr}</span>
      <span class="pedido-estado ${pedido.estado}">${pedido.estado}</span>
    </div>
    <div class="pedido-cliente">
      <strong>${pedido.nombre}</strong> - ${pedido.telefono || ''}<br>
      ${pedido.ciudad || ''} - ${pedido.direccion || ''}
      ${pedido.otros_datos ? `<br><em>${pedido.otros_datos}</em>` : ''}
    </div>
    <div class="pedido-productos">
      ${pedido.productos || ''}
    </div>
    <div class="pedido-footer">
      <span class="pedido-total">Total: $ ${fmt(pedido.valor_total || 0)}</span>
      ${!isAtendido ? `<button class="btn btn-primary btn-atender" data-id="${pedido.id}">Marcar como atendido</button>` : ''}
    </div>
  `;
  return li;
}

function renderPedidos(pedidos) {
  const listaProceso = document.getElementById('pedidos-proceso');
  const listaAtendidos = document.getElementById('pedidos-atendidos');

  if (!listaProceso || !listaAtendidos) return;

  listaProceso.innerHTML = '';
  listaAtendidos.innerHTML = '';

  if (!Array.isArray(pedidos) || pedidos.length === 0) {
    listaProceso.innerHTML = '<li class="empty">No hay pedidos en proceso</li>';
    listaAtendidos.innerHTML = '<li class="empty">No hay pedidos atendidos</li>';
    return;
  }

  const enProceso = pedidos.filter(p => (p.estado || '').toLowerCase() !== 'atendido');
  const atendidos = pedidos.filter(p => (p.estado || '').toLowerCase() === 'atendido');

  if (enProceso.length === 0) {
    listaProceso.innerHTML = '<li class="empty">No hay pedidos en proceso</li>';
  } else {
    enProceso.forEach(p => {
      listaProceso.appendChild(crearPedidoItem(p, false));
    });
  }

  if (atendidos.length === 0) {
    listaAtendidos.innerHTML = '<li class="empty">No hay pedidos atendidos</li>';
  } else {
    atendidos.forEach(p => {
      listaAtendidos.appendChild(crearPedidoItem(p, true));
    });
  }
}

// =================== API PEDIDOS ===================
async function cargarPedidos() {
  showLoader();
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Si en el futuro agregas filtros en el HTML:
    // <select id="filtro-estado">, <input id="filtro-cliente">
    const params = new URLSearchParams();
    const selEstado = document.getElementById('filtro-estado');
    const inpCliente = document.getElementById('filtro-cliente');

    if (selEstado && selEstado.value) {
      params.append('estado', selEstado.value);
    }
    if (inpCliente && inpCliente.value.trim()) {
      params.append('cliente', inpCliente.value.trim());
    }

    const url = params.toString() ? `${API_PEDIDOS}?${params.toString()}` : API_PEDIDOS;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (res.status === 401 || res.status === 403) {
      alert('Tu sesión ha expirado o no tienes permisos. Inicia sesión nuevamente.');
      window.location.href = 'login.html';
      return;
    }

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Error al cargar pedidos.\n${txt}`);
    }

    const pedidos = await res.json();
    renderPedidos(pedidos);
  } catch (err) {
    console.error('Error cargando pedidos:', err);
    alert('No se pudieron cargar los pedidos.\n' + err.message);
  } finally {
    hideLoader();
  }
}

async function marcarComoAtendido(pedidoId) {
  if (!confirm('¿Marcar este pedido como atendido?')) return;

  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const res = await fetch(`${API_PEDIDOS}/${pedidoId}/estado`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ estado: 'atendido' })
    });

    if (res.status === 401 || res.status === 403) {
      alert('Tu sesión ha expirado o no tienes permisos. Inicia sesión nuevamente.');
      window.location.href = 'login.html';
      return;
    }

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`No se pudo actualizar el pedido.\n${txt}`);
    }

    await cargarPedidos();
  } catch (err) {
    console.error('Error actualizando pedido:', err);
    alert('Error al actualizar el pedido.\n' + err.message);
  }
}

// =================== EVENTOS Y BOOTSTRAP ===================
document.addEventListener('DOMContentLoaded', () => {
  ensureAuthenticatedAdmin();

  const panel = document.getElementById('pedidos-panel');
  if (panel) {
    panel.addEventListener('click', (e) => {
      const btnAtender = e.target.closest('.btn-atender');
      if (btnAtender) {
        const id = Number(btnAtender.dataset.id);
        if (id) marcarComoAtendido(id);
      }
    });
  }

  const btnFiltros = document.getElementById('btn-aplicar-filtros');
  if (btnFiltros) {
    btnFiltros.addEventListener('click', (e) => {
      e.preventDefault();
      cargarPedidos();
    });
  }

  cargarPedidos();
});
