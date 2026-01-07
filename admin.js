/**
 * ADMIN - Sistema de gestión de productos
 * ============================================
 * 
 * ⚠️ IMPORTANTE - ANTES DE USAR EN PRODUCCIÓN:
 * 1. Cambiar contraseña en ADMIN_PASSWORD
 * 2. Usar variables de entorno para tokens
 * 3. Implementar autenticación real (OAuth, etc)
 * 4. Usar HTTPS obligatorio
 * 5. Restringir acceso a IP específicas
 * 
 * Funcionalidades:
 * - Login con contraseña
 * - Gestión de productos (CRUD)
 * - Preview en tiempo real
 * - Publicar a GitHub (trigger auto-deploy en Render)
 */

// ============================================
// CONFIGURACIÓN
// ============================================
// Proteger acceso a `process` en navegadores donde no existe
const process = globalThis.process || { env: {} };

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2024'; // CAMBIAR EN RENDER
const GITHUB_API = 'https://api.github.com';
const REPO_OWNER = process.env.REPO_OWNER || 'JosePluz';
const REPO_NAME = process.env.REPO_NAME || 'amigurumi';

// Validación de entrada
const VALIDATION_RULES = {
  name: { required: true, minLength: 3, maxLength: 100 },
  desc: { maxLength: 500 },
  price: { required: true, min: 0, max: 99999 },
  width: { min: 1, max: 500 },
  height: { min: 1, max: 500 }
};

// ============================================
// LOGIN ADMIN
// ============================================

function showLoginModal() {
  const html = `
    <div class="modal modal--login" id="loginModal">
      <div class="modal__content">
        <h2>🔐 Acceso Admin</h2>
        <p>Ingresa la contraseña para administrar productos</p>
        <input type="password" id="loginPass" placeholder="Contraseña" autocomplete="current-password" />
        <div class="modal__actions">
          <button id="loginBtn">Entrar</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
  
  const loginBtn = document.getElementById('loginBtn');
  const loginPass = document.getElementById('loginPass');
  
  const attemptLogin = async () => {
    const pass = loginPass.value.trim();
    
    if (!pass) {
      showNotification('⚠️ Ingresa la contraseña', 'error');
      return;
    }
    
    // Validar contra servidor (SIEMPRE)
    try {
      const r = await fetch('/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass })
      });
      
      if (r.ok) {
        const data = await r.json();
        if (data.success) {
          window._adminPass = pass;
          document.getElementById('loginModal').remove();
          showAdminPanel();
          return;
        }
      }
      
      // Si falla en servidor, mostrar error
      showNotification('❌ Contraseña incorrecta', 'error');
      loginPass.value = '';
      loginPass.focus();
    } catch (err) {
      showNotification(`❌ Error de conexión: ${err.message}`, 'error');
    }
  };
  
  loginBtn.onclick = attemptLogin;
  loginPass.onkeypress = (e) => {
    if (e.key === 'Enter') attemptLogin();
  };
  
  loginPass.focus();
}


// ============================================
// UTILIDADES
// ============================================

/**
 * Mostrar notificación elegante
 */
function showNotification(message, type = 'info') {
  const notif = document.createElement('div');
  notif.className = `notification notification--${type}`;
  notif.textContent = message;
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${type === 'error' ? '#ff6b6b' : type === 'success' ? '#51cf66' : '#4dabf7'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 99999;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

/**
 * Validar entrada según reglas
 */
function validateInput(field, value) {
  const rules = VALIDATION_RULES[field];
  if (!rules) return { valid: true };
  
  if (rules.required && !value) {
    return { valid: false, error: `${field} es requerido` };
  }
  
  if (rules.minLength && value.length < rules.minLength) {
    return { valid: false, error: `${field} debe tener mínimo ${rules.minLength} caracteres` };
  }
  
  if (rules.maxLength && value.length > rules.maxLength) {
    return { valid: false, error: `${field} no puede exceder ${rules.maxLength} caracteres` };
  }
  
  if (rules.min !== undefined && parseFloat(value) < rules.min) {
    return { valid: false, error: `${field} debe ser >= ${rules.min}` };
  }
  
  if (rules.max !== undefined && parseFloat(value) > rules.max) {
    return { valid: false, error: `${field} debe ser <= ${rules.max}` };
  }
  
  return { valid: true };
}

/**
 * Escapar HTML para prevenir XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============ PANEL ADMIN ============
async function showAdminPanel() {
  // First load data from server to show fresh published products on every open
  await loadAdminData();
  
  const productCount = (window.productsData || []).length;
  
  const html = `
    <div class="admin" id="adminPanel">
      <div class="admin__header">
        <h2>🔐 Panel Admin</h2>
        <button class="admin__close" id="adminClose" title="Cerrar panel">×</button>
      </div>

      <div class="admin__body">
        <!-- FORMULARIO -->
        <div class="admin__section">
          <h3>➕ Nuevo/Editar Producto</h3>
          <form id="adminForm" class="admin-form" novalidate>
            <input type="hidden" id="editId" />
            
            <label>
              Nombre * <span class="char-count" data-field="prodName">0/100</span>
              <input 
                id="prodName" 
                type="text" 
                required 
                maxlength="100"
                placeholder="Ej: Osito Rosa Tierno"
              />
            </label>

            <label>
              Descripción <span class="char-count" data-field="prodDesc">0/500</span>
              <textarea 
                id="prodDesc" 
                rows="3"
                maxlength="500"
                placeholder="Descripción breve del producto..."
              ></textarea>
            </label>

            <label>
              Precio ($) *
              <input 
                id="prodPrice" 
                type="number" 
                step="0.01" 
                min="0" 
                max="99999"
                required
                placeholder="24.99"
              />
            </label>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <label>
                Ancho (cm)
                <input 
                  id="prodWidth" 
                  type="number" 
                  min="1" 
                  max="500"
                  placeholder="15"
                />
              </label>
              <label>
                Alto (cm)
                <input 
                  id="prodHeight" 
                  type="number" 
                  min="1" 
                  max="500"
                  placeholder="20"
                />
              </label>
            </div>

            <label>
              📸 Imágenes (JPG, PNG, WEBP) — Puedes seleccionar varias
              <input 
                id="prodImage" 
                type="file" 
                accept="image/jpeg,image/png,image/webp"
                multiple
              />
              <small>Tamaño máximo por imagen: 5MB</small>
            </label>

            <div class="admin-form__actions">
              <button type="button" id="formSave" class="btn btn-primary">💾 Guardar</button>
              <button type="button" id="formClear" class="btn btn-secondary">🔄 Limpiar</button>
            </div>
          </form>
        </div>

        <!-- LISTA DE PRODUCTOS -->
        <div class="admin__section">
          <h3>📦 Productos (${productCount})</h3>
          <ul id="adminProductList" class="admin-list"></ul>
          ${productCount === 0 ? '<p style="color: #999; text-align: center;">Sin productos aún</p>' : ''}
        </div>

        <!-- PUBLICAR -->
        <div class="admin__footer">
          <button id="publishBtn" class="btn-primary" style="width: 100%; margin-bottom: 0.5rem;">
            📤 Publicar en GitHub
          </button>
          <small>Los cambios se sincronizarán a Render automáticamente</small>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', html);
  
  // Eventos
  document.getElementById('adminClose').onclick = () => {
    if (confirm('¿Cerrar panel admin?')) {
      document.getElementById('adminPanel').remove();
    }
  };
  
  document.getElementById('formSave').onclick = (e) => {
    e.preventDefault();
    saveProduct();
  };
  document.getElementById('formClear').onclick = () => clearForm();
  document.getElementById('publishBtn').onclick = () => publishToGitHub();
  
  // Contador de caracteres
  document.getElementById('prodName').addEventListener('input', (e) => {
    updateCharCount(e, 100);
  });
  document.getElementById('prodDesc').addEventListener('input', (e) => {
    updateCharCount(e, 500);
  });
}

function updateCharCount(input, max) {
  const count = input.target.value.length;
  const countEl = input.target.parentElement.querySelector('.char-count');
  if (countEl) countEl.textContent = `${count}/${max}`;
}

// ============ GESTIÓN DE DATOS ============

async function loadAdminData() {
  const list = document.getElementById('adminProductList');
  // Load published products from server and local staged products from localStorage
  let serverProducts = [];
  try {
    const resp = await fetch('/api/products');
    if (resp.ok) {
      const d = await resp.json();
      serverProducts = d.data || [];
    }
  } catch (err) {
    console.warn('No se pudo obtener productos del servidor:', err.message);
  }

  const localProducts = JSON.parse(localStorage.getItem('adminProducts') || '[]');

  // Merge: prefer localProducts if same id exists (staged edits)
  const merged = localProducts.slice();
  for (const sp of serverProducts) {
    if (!merged.find(p => p.id == sp.id)) {
      merged.push(sp);
    }
  }

  window.productsData = merged;

  if (merged.length === 0) {
    list.innerHTML = '<li style="text-align: center; color: #999;">No hay productos. Agrega uno!</li>';
    return;
  }

  list.innerHTML = merged.map(p => `
    <li>
      <div>
        <strong>${escapeHtml(p.name)}</strong>
        <div style="font-size: 0.9rem; color: #666; margin-top: 0.25rem;">
          $${p.price.toFixed(2)} • ${p.size?.width || '?'}×${p.size?.height || '?'}cm
        </div>
        ${p.desc ? `<small style="color: #999;">${escapeHtml(p.desc.substring(0, 50))}${p.desc.length > 50 ? '...' : ''}</small>` : ''}
      </div>
      <div>
        <button class="btn btn-sm btn-edit" data-id="${p.id}">✏️</button>
        <button class="btn btn-sm btn-danger btn-delete" data-id="${p.id}">🗑️</button>
        <button class="btn btn-sm btn-danger btn-delete-published" data-id="${p.id}" title="Eliminar publicado">🗑️ Publicado</button>
      </div>
    </li>
  `).join('');

  // Delegación de eventos para editar/borrar
  list.onclick = (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    if (!id) return;
    if (btn.classList.contains('btn-edit')) {
      editProduct(parseInt(id));
    } else if (btn.classList.contains('btn-delete')) {
      deleteProduct(parseInt(id));
    } else if (btn.classList.contains('btn-delete-published')) {
      deletePublishedProduct(parseInt(id));
    }
  };
}

async function saveProduct() {
  const id = document.getElementById('editId').value;
  const name = document.getElementById('prodName').value.trim();
  const desc = document.getElementById('prodDesc').value.trim();
  const price = parseFloat(document.getElementById('prodPrice').value);
  const width = parseInt(document.getElementById('prodWidth').value) || 15;
  const height = parseInt(document.getElementById('prodHeight').value) || 20;
  const imageFiles = Array.from(document.getElementById('prodImage').files || []);
  
  // Validar
  const nameVal = validateInput('name', name);
  if (!nameVal.valid) {
    showNotification(`❌ ${nameVal.error}`, 'error');
    return;
  }
  
  const priceVal = validateInput('price', price);
  if (!priceVal.valid) {
    showNotification(`❌ ${priceVal.error}`, 'error');
    return;
  }
  
  // Validar y procesar imágenes (pueden ser múltiples)
  let imgs = [];
  let imgsData = []; // almacenará dataURLs para publicar

  if (imageFiles.length > 0) {
    // Validar cada archivo
    for (const f of imageFiles) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        showNotification('❌ Solo JPG, PNG o WEBP', 'error');
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        showNotification('❌ Cada imagen debe ser < 5MB', 'error');
        return;
      }
    }

    // Leer archivos como dataURL
    const readFile = (file) => new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });

    for (const f of imageFiles) {
      // Normalizar nombre
      const nameClean = f.name.replace(/\s+/g, '-');
      imgs.push(`img/${nameClean}`);
      const dataUrl = await readFile(f);
      imgsData.push({ name: `img/${nameClean}`, dataUrl });
    }
  } else if (id) {
    // Si editando y sin nuevas imágenes, mantener las antiguas
    const existingProduct = (window.productsData || []).find(p => p.id == id);
    if (existingProduct?.imgs && existingProduct.imgs.length > 0) {
      imgs = existingProduct.imgs.slice();
    }
  }

  if (imgs.length === 0) {
    showNotification('❌ Debes seleccionar al menos una imagen', 'error');
    return;
  }

  // Crear producto
  const product = {
    id: id ? parseInt(id) : Date.now(),
    name: escapeHtml(name),
    desc: escapeHtml(desc),
    price: Math.round(price * 100) / 100,
    size: { width: Math.max(1, width), height: Math.max(1, height) },
    imgs,
    imgsData // dataURLs para publicar a GitHub
  };
  
  // Guardar en localStorage
  let products = JSON.parse(localStorage.getItem('adminProducts') || '[]');
  const idx = products.findIndex(p => p.id === product.id);
  
  if (idx >= 0) {
    products[idx] = product;
    showNotification('✅ Producto actualizado', 'success');
  } else {
    products.push(product);
    showNotification('✅ Producto creado', 'success');
  }
  
  localStorage.setItem('adminProducts', JSON.stringify(products));
  window.productsData = products;
  
  // Actualizar UI
  loadAdminData();
  if (window.renderCatalog) window.renderCatalog();
  clearForm();
}

function editProduct(id) {
  try {
    console.log('editProduct called with id:', id);
    // Prefer local staged products, fallback to merged window.productsData (includes published)
    const local = JSON.parse(localStorage.getItem('adminProducts') || '[]');
    let product = local.find(p => p.id == id);
    if (!product) product = (window.productsData || []).find(p => p.id == id);
    if (!product) {
      console.warn('Producto no encontrado para editar:', id);
      showNotification('❌ Producto no encontrado', 'error');
      return;
    }

    document.getElementById('editId').value = product.id;
    document.getElementById('prodName').value = product.name || '';
    document.getElementById('prodDesc').value = product.desc || '';
    document.getElementById('prodPrice').value = product.price || '';
    document.getElementById('prodWidth').value = product.size?.width || 15;
    document.getElementById('prodHeight').value = product.size?.height || 20;

    // Actualizar contadores
    const nameCounter = document.querySelector('[data-field="prodName"]');
    const descCounter = document.querySelector('[data-field="prodDesc"]');
    if (nameCounter) nameCounter.textContent = `${(product.name || '').length}/100`;
    if (descCounter) descCounter.textContent = `${(product.desc || '').length}/500`;

    window.scrollTo(0, 0);
    document.getElementById('prodName').focus();
    showNotification('✏️ Editando producto', 'info');
  } catch (err) {
    console.error('editProduct error:', err);
    showNotification(`❌ Error al editar: ${err.message}`, 'error');
  }
}

function deleteProduct(id) {
  try {
    console.log('deleteProduct called with id:', id);
    const local = JSON.parse(localStorage.getItem('adminProducts') || '[]');
    let product = local.find(p => p.id == id);

    // If not in local staged, it may be a published product -> delegate to deletePublishedProduct
    if (!product) {
      console.warn('Producto no encontrado en local, intentando borrar publicado:', id);
      // Ask user to confirm deletion from published site
      if (!confirm('Este producto parece publicado. ¿Deseas eliminarlo también del sitio (GitHub)?')) return;
      return deletePublishedProduct(id);
    }

    if (!confirm(`¿Eliminar "${escapeHtml(product.name || 'producto')}" (local)?`)) return;

    const updated = local.filter(p => p.id != id);
    localStorage.setItem('adminProducts', JSON.stringify(updated));
    window.productsData = updated.concat(((window.productsData || []).filter(p => !local.find(lp => lp.id == p.id && lp.id != id))));

    loadAdminData();
    if (window.renderCatalog) window.renderCatalog();
    showNotification('🗑️ Producto eliminado (local)', 'success');
  } catch (err) {
    console.error('deleteProduct error:', err);
    showNotification(`❌ Error al eliminar: ${err.message}`, 'error');
  }
}

function clearForm() {
  document.getElementById('editId').value = '';
  document.getElementById('adminForm').reset();
  document.querySelector('[data-field="prodName"]').textContent = '0/100';
  document.querySelector('[data-field="prodDesc"]').textContent = '0/500';
  document.getElementById('prodName').focus();
}

// ============ PUBLICAR A GITHUB ============
async function publishToGitHub() {
  const btn = document.getElementById('publishBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Publicando...';

  try {
    const products = JSON.parse(localStorage.getItem('adminProducts') || '[]');
    if (products.length === 0) {
      showNotification('⚠️ No hay productos para publicar', 'info');
      throw new Error('Empty products');
    }

    // Send to server which will use GITHUB_TOKEN from env
    const resp = await fetch('/admin/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-pass': window._adminPass || '' },
      body: JSON.stringify({ products })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(txt || 'Publish failed');
    }

    showNotification('✅ ¡Publicado en GitHub! Render se actualizará en 1-2 minutos', 'success');
    // Only remove local copy on success
    localStorage.removeItem('adminProducts');
    setTimeout(() => location.reload(), 2000);
  } catch (err) {
    showNotification(`❌ Error: ${err.message}`, 'error');
    console.error('publishToGitHub error:', err);
  } finally {
    btn.disabled = false;
    btn.textContent = '📤 Publicar en GitHub';
  }
}

// Eliminar producto publicado (requiere autenticación admin)
async function deletePublishedProduct(id) {
  if (!confirm('¿Eliminar este producto publicado de GitHub y del sitio? Esta acción es irreversible.')) return;
  const btn = document.querySelector(`[data-id="${id}"]`);
  try {
    showNotification('⏳ Eliminando producto publicado...', 'info');
    const resp = await fetch('/admin/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-pass': window._adminPass || '' },
      body: JSON.stringify({ id })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(txt || 'Delete failed');
    }

    showNotification('✅ Producto publicado eliminado', 'success');

    // Remove from localStorage and UI
    let products = JSON.parse(localStorage.getItem('adminProducts') || '[]');
    const updated = products.filter(p => p.id != id);
    localStorage.setItem('adminProducts', JSON.stringify(updated));
    window.productsData = updated;
    loadAdminData();
    if (window.renderCatalog) window.renderCatalog();
  } catch (err) {
    console.error('deletePublishedProduct error:', err);
    showNotification(`❌ Error: ${err.message}`, 'error');
  }
}

// Exponer para pruebas/console
window.deletePublishedProduct = deletePublishedProduct;

// ============ INICIALIZAR ============
window.openAdminPanel = function() {
  console.log('✅ openAdminPanel function ready');
  showLoginModal();
};

// Exponer funciones para los botones inline
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;

// Debug: confirmar que las funciones están expuestas
console.log('✅ Admin.js v2.2 loaded successfully');
console.log('✅ Functions exposed:', { editProduct: typeof window.editProduct, deleteProduct: typeof window.deleteProduct, openAdminPanel: typeof window.openAdminPanel });
