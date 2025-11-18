// =================== CONFIG ===================
// API para productos (Google Apps Script / Google Sheets)
const API_PRODUCTOS = 'https://script.google.com/macros/s/AKfycby1PE8A1GbuEkiSefoqRujAGhnNy-SjLqNDi5rA1bUxBhGuI4YDFWX7ABEe9BrMJFZd/exec';

// API de pedidos en tu backend Spring
const API_PEDIDOS = 'https://proyectowebbackend-production.up.railway.app/api/pedidos';

const IMG_BASE = 'Imagenes/';
const KEY = 'carrito_de_la_huerta';   // carrito en localStorage
const fmt = n => Number(n).toFixed(2);

const MIN_SPINNER_MS = 700;
const FETCH_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 1200;
const MIN_SPINNER_MS = 700;
const FETCH_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 1200;

// =================== ESTADO ===================
let productos = [];

// =================== LOADER ===================
function showLoader() {
  const img = document.getElementById('cargando');
  if (img) img.style.display = 'block';
}


function hideLoader() {
  const img = document.getElementById('cargando');
  if (img) img.style.display = 'none';
}

// =================== UTILIDADES ===================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// --- IMG HELPER (arregla rutas de imágenes) ---
function imgSrc(path) {
  if (!path) return IMG_BASE + 'placeholder.png';

  // URL absoluta
  if (/^https?:\/\//i.test(path)) return path;

  // Si ya trae carpeta (Imagenes/..., imagenes/... o cualquier /)
  if (path.includes('/')) return path;

  // Solo nombre de archivo -> le ponemos la carpeta
  return IMG_BASE + path;
}

function onImgError(ev) {
  ev.target.onerror = null;
  ev.target.src = IMG_BASE + 'placeholder.png';
}

// =================== CARGA DE PRODUCTOS ===================
// =================== CARGA DE PRODUCTOS ===================
async function loadProductos() {
  const start = performance.now();
  showLoader();

  const tryOnce = async () => {
    const res = await fetchWithTimeout(API_PRODUCTOS, { method: 'GET', cache: 'no-store' });
    if (!res.ok) {
      const body = await res.text().catch(() => '(sin cuerpo)');
      throw new Error(`[HTTP ${res.status}] No se pudo cargar productos.\n${body}`);
    }
    let json;
    try {
      json = await res.json();
    } catch {
    try {
      json = await res.json();
    } catch {
      const body = await res.text().catch(() => '(sin cuerpo)');
      throw new Error(`Respuesta no-JSON de la API.\nCuerpo:\n${body}`);
    }
    if (!Array.isArray(json?.data)) {
      console.warn('JSON recibido SIN data[]:', json);
      throw new Error('La API no contiene "data" como arreglo. Revisa doGet/hoja.');
    }
    return json.data;
  };

  let rows;
  try {
    rows = await tryOnce();
  } catch (e1) {
    console.warn('Primer intento falló, reintentando…', e1);
    await sleep(RETRY_DELAY_MS);
    try {
      rows = await tryOnce();
    } catch (e2) {
      console.error('Segundo intento falló:', e2);
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, MIN_SPINNER_MS - elapsed);
      await sleep(remaining);
      hideLoader();
      alert(`No se pudieron cargar los productos.\n${e2.message}`);
      productos = [];
      return;
      return;
    }
  }

  productos = rows.map((r, idx) => {
    const id = Number(r.IdProducto ?? r.id ?? (idx + 1));
    const nombre = String(r.Nombre ?? r.nombre ?? `Producto ${id}`);
    const descripcion = String(r['Descripción'] ?? r.Descripción ?? r.descripcion ?? '');
    const precio = Number(
      String(r.Precio ?? r.precio ?? 0)
        .replace(/[^\d.,-]/g, '')
        .replace(/\.(?=\d{3}\b)/g, '')
        .replace(',', '.')
    ) || 0;
    const imagen = String(r.Imagen ?? r.imagen ?? '').trim();
    const categoria = String(r.Categoria ?? r.categoria ?? '').trim();
    return { id, nombre, descripcion, precio, imagen, categoria };
  }).filter(p => p.nombre && Number.isFinite(p.precio));

  const elapsed = performance.now() - start;
  const remaining = Math.max(0, MIN_SPINNER_MS - elapsed);
  await sleep(remaining);
  hideLoader();
}

// =================== RENDER CATÁLOGO ===================
// =================== RENDER CATÁLOGO ===================
function renderProductosIfNeeded() {
  const main = document.getElementById('main-productos');
  if (!main) return;
  const main = document.getElementById('main-productos');
  if (!main) return;

  [...main.children].forEach(ch => {
    if (ch.id !== 'cargando') ch.remove();
  });

  const h2 = document.createElement('h2');
  h2.textContent = 'Productos';
  main.appendChild(h2);
  main.appendChild(h2);

  if (!Array.isArray(productos) || productos.length === 0) {
    const empty = document.createElement('p');
    empty.style.cssText = 'padding:1rem;color:#666';
    empty.textContent = 'No hay productos disponibles en este momento.';
    main.appendChild(empty);
    const empty = document.createElement('p');
    empty.style.cssText = 'padding:1rem;color:#666';
    empty.textContent = 'No hay productos disponibles en este momento.';
    main.appendChild(empty);
    return;
  }

  const categorias = {};
  productos.forEach(p => {
    const cat = p.categoria || 'Otros';
    if (!categorias[cat]) categorias[cat] = [];
    categorias[cat].push(p);
    const cat = p.categoria || 'Otros';
    if (!categorias[cat]) categorias[cat] = [];
    categorias[cat].push(p);
  });

  Object.entries(categorias).forEach(([cat, items]) => {
    const sec = document.createElement('section');
    sec.className = 'productos-categoria';

    const h3 = document.createElement('h3');
    h3.textContent = cat;
    sec.appendChild(h3);


  Object.entries(categorias).forEach(([cat, items]) => {
    const sec = document.createElement('section');
    sec.className = 'productos-categoria';

    const h3 = document.createElement('h3');
    h3.textContent = cat;
    sec.appendChild(h3);

    const grid = document.createElement('div');
    grid.className = 'productos-grid';
    grid.className = 'productos-grid';

    items.forEach(p => {
    items.forEach(p => {
      const art = document.createElement('article');
      art.className = 'producto-card';
      art.className = 'producto-card';
      art.innerHTML = `
        <img src="${imgSrc(p.imagen)}" alt="${p.nombre}">
        <div>
          <h3>${p.nombre}</h3>
          <p>${p.descripcion || 'Sin descripción'}</p>
          <div class="precio-y-boton">
          <div class="precio-y-boton">
            <h4>$ ${fmt(p.precio)}</h4>
            <input class="qty" type="number" min="1" value="1" />
            <button class="btn-add" data-id="${p.id}">Agregar</button>
          </div>
        </div>
      `;
      const img = art.querySelector('img');
      img.addEventListener('error', onImgError);
      grid.appendChild(art);
    });

    sec.appendChild(grid);
    main.appendChild(sec);

    sec.appendChild(grid);
    main.appendChild(sec);
  });
}

// =================== CARRITO ===================
function getCart() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem(KEY, JSON.stringify(cart));
}

function emptyCart() {
  saveCart({});
}

function addToCart(id, qty) {
  const cart = getCart();
  cart[id] = (cart[id] || 0) + qty;
  saveCart(cart);
  alert('Producto agregado al carrito.');
}

function initProductosPage() {
  const main = document.getElementById('main-productos');
  if (!main) return;
  const main = document.getElementById('main-productos');
  if (!main) return;

  main.addEventListener('click', (e) => {
  main.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-add');
    if (!btn) return;

    const id = Number(btn.dataset.id);
    const article = btn.closest('article');
    const qtyInput = article?.querySelector('.qty');
    let qty = parseInt(qtyInput?.value ?? '1', 10);
    if (!Number.isFinite(qty) || qty < 1) qty = 1;

    addToCart(id, qty);
  });
}

function renderCarrito() {
  const lista = document.getElementById('carrito-lista');
  const totalSpan = document.getElementById('total');
  if (!lista || !totalSpan) return;
    const article = btn.closest('article');
    const qtyInput = article?.querySelector('.qty');
    let qty = parseInt(qtyInput?.value ?? '1', 10);
    if (!Number.isFinite(qty) || qty < 1) qty = 1;

    addToCart(id, qty);
  });
}

function renderCarrito() {
  const lista = document.getElementById('carrito-lista');
  const totalSpan = document.getElementById('total');
  if (!lista || !totalSpan) return;

  lista.innerHTML = '';
  const cart = getCart();
  const entries = Object.entries(cart);
  let total = 0;
  lista.innerHTML = '';
  const cart = getCart();
  const entries = Object.entries(cart);
  let total = 0;

  if (!entries.length) {
    lista.innerHTML = '<li class="empty">Tu carrito está vacío.</li>';
    totalSpan.textContent = fmt(0);
    return;
  }
  if (!entries.length) {
    lista.innerHTML = '<li class="empty">Tu carrito está vacío.</li>';
    totalSpan.textContent = fmt(0);
    return;
  }

  entries.forEach(([idStr, cant]) => {
    const p = productos.find(pp => pp.id === Number(idStr));
    if (!p) return;
    const subtotal = p.precio * cant;
    total += subtotal;
  entries.forEach(([idStr, cant]) => {
    const p = productos.find(pp => pp.id === Number(idStr));
    if (!p) return;
    const subtotal = p.precio * cant;
    total += subtotal;

    const li = document.createElement('li');
    li.className = 'carrito-item';
    li.innerHTML = `
      <div class="thumb">
        <img src="${imgSrc(p.imagen)}" alt="${p.nombre}">
      </div>
      <div class="info">
        <strong>${p.nombre.replace(/_/g, ' ')}</strong>
        <small>$ ${fmt(p.precio)} c/u</small>
      </div>
      <div class="controls">
        <button class="btn-qty" data-action="menos" data-id="${p.id}">-</button>
        <span class="cant">${cant}</span>
        <button class="btn-qty" data-action="mas" data-id="${p.id}">+</button>
        <button class="btn-remove" data-action="del" data-id="${p.id}">X</button>
      </div>
      <div class="subtotal">$ ${fmt(subtotal)}</div>
    `;
    li.querySelector('img').addEventListener('error', onImgError);
    lista.appendChild(li);
  });
    const li = document.createElement('li');
    li.className = 'carrito-item';
    li.innerHTML = `
      <div class="thumb">
        <img src="${imgSrc(p.imagen)}" alt="${p.nombre}">
      </div>
      <div class="info">
        <strong>${p.nombre.replace(/_/g, ' ')}</strong>
        <small>$ ${fmt(p.precio)} c/u</small>
      </div>
      <div class="controls">
        <button class="btn-qty" data-action="menos" data-id="${p.id}">-</button>
        <span class="cant">${cant}</span>
        <button class="btn-qty" data-action="mas" data-id="${p.id}">+</button>
        <button class="btn-remove" data-action="del" data-id="${p.id}">X</button>
      </div>
      <div class="subtotal">$ ${fmt(subtotal)}</div>
    `;
    li.querySelector('img').addEventListener('error', onImgError);
    lista.appendChild(li);
  });

  totalSpan.textContent = fmt(total);
}

function handleQtyClick(btn) {
  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);
  const cart = getCart();
  let current = cart[id] || 0;

  if (action === 'mas') current++;
  if (action === 'menos') current--;

  if (current <= 0) {
    delete cart[id];
  } else {
    cart[id] = current;
  }
  saveCart(cart);
  renderCarrito();
}

function handleRemoveClick(btn) {
  const id = Number(btn.dataset.id);
  const cart = getCart();
  delete cart[id];
  saveCart(cart);
  renderCarrito();
}

function initCarritoPage() {
  const panel = document.getElementById('carrito-panel');
  if (!panel) return;

  const btnVaciar = document.getElementById('vaciar');
  const btnContinuar = document.getElementById('continuar');

  panel.addEventListener('click', (e) => {
    const btnQty = e.target.closest('.btn-qty');
    if (btnQty) {
      handleQtyClick(btnQty);
      return;
    }
    const btnRemove = e.target.closest('.btn-remove');
    if (btnRemove) {
      handleRemoveClick(btnRemove);
      return;
    }
  });

  if (btnVaciar) {
    btnVaciar.addEventListener('click', () => {
      if (!confirm('¿Vaciar carrito?')) return;
      emptyCart();
      renderCarrito();
    });
  }

  if (btnContinuar) {
    btnContinuar.addEventListener('click', () => {
      const cart = getCart();
      if (!Object.keys(cart).length) {
        alert('Tu carrito está vacío.');
        return;
      }
      window.location.href = 'detalleCompra.html';
    });
  }

  renderCarrito();
  renderCarrito();
}

// =================== DETALLE + ENVÍO DE PEDIDO ===================
function buildHomeUrl() {
  try {
    const u = new URL(window.location.href);
    const parts = u.pathname.split('/');
    parts.pop();
    const maybe = parts.join('/') + '/index.html';
    return `${u.origin}${maybe}`;
  } catch {
    return '/index.html';
  }
}

function buildOrderPayload() {
  const cart = getCart();
  const entries = Object.entries(cart);

  const items = entries.map(([idStr, cant]) => {
    const p = productos.find(pp => pp.id === Number(idStr));
    return {
      id: Number(idStr),
      nombre: p?.nombre ?? `id:${idStr}`,
      cantidad: Number(cant),
      precioUnit: p?.precio ?? 0,
      subtotal: (p ? p.precio * cant : 0)
    };
  });

  const total = items.reduce((acc, it) => acc + it.subtotal, 0);

  const nombre    = document.querySelector('input[name="name"]')?.value?.trim() || '';
  const telefono  = document.querySelector('input[name="telephone"]')?.value?.trim() || '';
  const ciudad    = document.querySelector('select[name="ciudad"]')?.value?.trim() || '';
  const direccion = document.querySelector('input[name="direccion"]')?.value?.trim() || '';
  const otros     = document.querySelector('input[name="otros"]')?.value?.trim() || '';

  const productosStr = items
    .map(it => `${it.nombre} (x${it.cantidad}) - ${fmt(it.precioUnit)} c/u`)
    .join('; ');

  return {
    timestamp: new Date().toISOString(),
    nombre,
    telefono,
    ciudad,
    direccion,
    otros_datos: otros,
    productos: productosStr,
    valor_total: Number(total.toFixed(2))
  };
}

async function enviarPedido() {
  const form = document.querySelector('#main-detalle form');
  if (form && !form.reportValidity()) {
    return;
  }

  const payload = buildOrderPayload();
  const body = JSON.stringify(payload);

  const fetchPromise = (async () => {
    try {
      await fetch(API_PEDIDOS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body,
        cache: 'no-store',
        keepalive: true
      });
    } catch (err) {
      console.warn('Aviso: error enviando el pedido al backend.', err);
    }
  })();

  const timeoutPromise = new Promise(r => setTimeout(r, 1200));
  await Promise.race([fetchPromise, timeoutPromise]);

  emptyCart();
}

function renderResumenDetalleCompra() {
  const main = document.getElementById('main-detalle');
  if (!main) return;

  const cart = getCart();
  const entries = Object.entries(cart);
  if (!entries.length) {
    alert('Tu carrito está vacío. Primero agrega productos.');
    window.location.href = 'productos.html';
    return;
  }

  const resumen = document.createElement('section');
  resumen.id = 'resumen-compra';
  resumen.innerHTML = '<h3>Resumen del pedido</h3>';

  const ul = document.createElement('ul');
  ul.className = 'resumen-lista';

  let total = 0;
  entries.forEach(([idStr, cant]) => {
    const p = productos.find(pp => pp.id === Number(idStr));
    if (!p) return;
    const subtotal = p.precio * cant;
    total += subtotal;

    const li = document.createElement('li');
    li.innerHTML = `
      <span>${p.nombre} (x${cant})</span>
      <span>$ ${fmt(subtotal)}</span>
    `;
    ul.appendChild(li);
  });

  resumen.appendChild(ul);

  const pTotal = document.createElement('p');
  pTotal.className = 'total';
  pTotal.innerHTML = `Total: <strong>$ ${fmt(total)}</strong>`;
  resumen.appendChild(pTotal);

  const form = main.querySelector('form');
  main.insertBefore(resumen, form || null);
}

function initDetalleCompraPage() {
  const main = document.getElementById('main-detalle');
  if (!main) return;

  renderResumenDetalleCompra();

  const $pagar = document.getElementById('pagar');
  if (!$pagar) return;

  if ($pagar.getAttribute('type') !== 'button') {
    $pagar.setAttribute('type', 'button');
  }

  const pTotal = document.createElement('p');
  pTotal.className = 'total';
  pTotal.innerHTML = `Total: <strong>$ ${fmt(total)}</strong>`;
  resumen.appendChild(pTotal);

  const form = main.querySelector('form');
  main.insertBefore(resumen, form || null);

  const btnPagar = document.getElementById('pagar');
  if (btnPagar) {
    btnPagar.addEventListener('click', async (e) => {
      e.preventDefault();
      $pagar.click();
    });
  }

  $pagar.addEventListener('click', async (e) => {
    e.preventDefault();
    if ($pagar.dataset.loading === '1') return;

    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    $pagar.dataset.loading = '1';
    const original = $pagar.textContent;
    $pagar.disabled = true;
    $pagar.textContent = 'Enviando…';

    const homeUrl = buildHomeUrl();

    try {
      await enviarPedidoNoBloqueante();
      alert('¡Gracias! Tu pedido ha sido registrado. Te contactaremos pronto.');
    } catch (err) {
      console.error('Error enviando pedido:', err);
      alert('No se pudo enviar el pedido. Intenta nuevamente.\n' + err.message);
    } finally {
      $pagar.disabled = false;
      $pagar.textContent = original || 'Pagar';
      delete $pagar.dataset.loading;
      setTimeout(() => { window.location.replace(homeUrl); }, 150);
    }
  });
}

// =================== ÍCONO DE USUARIO (ADMIN / SESSION STORAGE) ===================
function setupUserIcon() {
  const userLink = document.getElementById('enlace-user-admin');
  if (!userLink) return;

  const token = sessionStorage.getItem('auth_token');
  const userData = sessionStorage.getItem('user_data');

  if (!token || !userData) {
    userLink.href = 'login.html';
    return;
  }

  try {
    const user = JSON.parse(userData);

    // Mostrar nombre
    const username = document.createElement('span');
    username.style.cssText = 'color: white; margin-left: 5px; font-size: 0.9rem;';
    username.textContent = user.username;
    userLink.appendChild(username);

    userLink.href = 'admin-users.html';

    userLink.addEventListener('click', (e) => {
      if (user.role !== 'ADMIN') {
        e.preventDefault();
        alert('🚫 No eres administrador\n\nSolo los administradores pueden acceder a la gestión de usuarios.');
      }
    });

  } catch (error) {
    console.error('Error parseando user_data:', error);
    userLink.href = 'login.html';
  }
}

// =================== BOOTSTRAP ===================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadProductos();
    renderProductosIfNeeded();
    initProductosPage();
    initCarritoPage();
    initDetalleCompraPage();
    setupUserIcon();
  } catch (e) {
    hideLoader();
    console.error('Error crítico:', e);
  }
});
