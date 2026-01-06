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

const ADMIN_PASSWORD = (globalThis.process && globalThis.process.env && globalThis.process.env.ADMIN_PASSWORD) ? globalThis.process.env.ADMIN_PASSWORD : 'admin2024'; // CAMBIAR EN RENDER
const GITHUB_API = 'https://api.github.com';
const REPO_OWNER = (globalThis.process && globalThis.process.env && globalThis.process.env.REPO_OWNER) ? globalThis.process.env.REPO_OWNER : 'JosePluz';
const REPO_NAME = (globalThis.process && globalThis.process.env && globalThis.process.env.REPO_NAME) ? globalThis.process.env.REPO_NAME : 'amigurumis';

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
  
  const attemptLogin = () => {
    const pass = loginPass.value.trim();
    
    if (!pass) {
      showNotification('⚠️ Ingresa la contraseña', 'error');
      return;
    }
    
    if (pass === ADMIN_PASSWORD) {
      document.getElementById('loginModal').remove();
      showAdminPanel();
    } else {
      showNotification('❌ Contraseña incorrecta', 'error');
      loginPass.value = '';
      loginPass.focus();
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
function showAdminPanel() {
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
              📸 Imagen (JPG, PNG, WEBP)
              <input 
                id="prodImage" 
                type="file" 
                accept="image/jpeg,image/png,image/webp"
              />
              <small>Tamaño máximo: 5MB</small>
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
  
  // Cargar datos
  loadAdminData();
}

function updateCharCount(input, max) {
  const count = input.target.value.length;
  const countEl = input.target.parentElement.querySelector('.char-count');
  if (countEl) countEl.textContent = `${count}/${max}`;
}

// ============ GESTIÓN DE DATOS ============

function loadAdminData() {
  const products = window.productsData || [];
  const list = document.getElementById('adminProductList');
  
  if (products.length === 0) {
    list.innerHTML = '<li style="text-align: center; color: #999;">No hay productos. Agrega uno!</li>';
    return;
  }
  
  list.innerHTML = products.map(p => `
    <li>
      <div>
        <strong>${escapeHtml(p.name)}</strong>
        <div style="font-size: 0.9rem; color: #666; margin-top: 0.25rem;">
          $${p.price.toFixed(2)} • ${p.size?.width || '?'}×${p.size?.height || '?'}cm
        </div>
        ${p.desc ? `<small style="color: #999;">${escapeHtml(p.desc.substring(0, 50))}${p.desc.length > 50 ? '...' : ''}</small>` : ''}
      </div>
      <div>
        <button onclick="editProduct(${p.id})" class="btn btn-sm">✏️</button>
        <button onclick="deleteProduct(${p.id})" class="btn btn-sm btn-danger">🗑️</button>
      </div>
    </li>
  `).join('');
}

function saveProduct() {
  const id = document.getElementById('editId').value;
  const name = document.getElementById('prodName').value.trim();
  const desc = document.getElementById('prodDesc').value.trim();
  const price = parseFloat(document.getElementById('prodPrice').value);
  const width = parseInt(document.getElementById('prodWidth').value) || 15;
  const height = parseInt(document.getElementById('prodHeight').value) || 20;
  const imageFile = document.getElementById('prodImage').files[0];
  
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
  
  // Validar imagen
  let imagePath = null;
  if (imageFile) {
    // Validar tipo
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type)) {
      showNotification('❌ Solo JPG, PNG o WEBP', 'error');
      return;
    }
    // Validar tamaño (5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      showNotification('❌ Imagen debe ser < 5MB', 'error');
      return;
    }
    imagePath = `img/${imageFile.name.replace(/\s+/g, '-')}`;
  } else if (id) {
    // Si estamos editando y sin nueva imagen, mantener la antigua
    const existingProduct = (window.productsData || []).find(p => p.id == id);
    if (existingProduct?.imgs?.[0]) {
      imagePath = existingProduct.imgs[0];
    }
  }
  
  if (!imagePath) {
    showNotification('❌ Debes seleccionar una imagen', 'error');
    return;
  }
  
  // Crear producto
  const product = {
    id: id ? parseInt(id) : Date.now(),
    name: escapeHtml(name),
    desc: escapeHtml(desc),
    price: Math.round(price * 100) / 100,
    size: { width: Math.max(1, width), height: Math.max(1, height) },
    imgs: [imagePath]
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
  const products = JSON.parse(localStorage.getItem('adminProducts') || '[]');
  const product = products.find(p => p.id === id);
  if (!product) return;
  
  document.getElementById('editId').value = product.id;
  document.getElementById('prodName').value = product.name;
  document.getElementById('prodDesc').value = product.desc;
  document.getElementById('prodPrice').value = product.price;
  document.getElementById('prodWidth').value = product.size.width;
  document.getElementById('prodHeight').value = product.size.height;
  
  // Actualizar contadores
  document.querySelector('[data-field="prodName"]').textContent = `${product.name.length}/100`;
  document.querySelector('[data-field="prodDesc"]').textContent = `${product.desc.length}/500`;
  
  window.scrollTo(0, 0);
  document.getElementById('prodName').focus();
}

function deleteProduct(id) {
  const products = JSON.parse(localStorage.getItem('adminProducts') || '[]');
  const product = products.find(p => p.id === id);
  
  if (!confirm(`¿Eliminar "${escapeHtml(product?.name || 'producto')}"?`)) return;
  
  const updated = products.filter(p => p.id !== id);
  localStorage.setItem('adminProducts', JSON.stringify(updated));
  window.productsData = updated;
  
  loadAdminData();
  if (window.renderCatalog) window.renderCatalog();
  showNotification('🗑️ Producto eliminado', 'success');
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
  const token = prompt(
    '🔐 Token GitHub (con acceso a "repo")\n\n' +
    'Cómo obtenerlo:\n' +
    '1. github.com/settings/tokens\n' +
    '2. "Generate new token (classic)"\n' +
    '3. Selecciona "repo" scope\n' +
    '4. Copy & paste aquí\n\n' +
    '⚠️ Úsalo una sola vez, no lo guardes'
  );
  
  if (!token || !token.trim()) {
    showNotification('⚠️ Token cancelado', 'info');
    return;
  }
  
  const btn = document.getElementById('publishBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Publicando...';
  
  try {
    const products = JSON.parse(localStorage.getItem('adminProducts') || '[]');
    
    if (products.length === 0) {
      showNotification('⚠️ No hay productos para publicar', 'info');
      throw new Error('Empty products');
    }
    
    // Generar contenido del archivo
    const content = `/**
 * Catálogo de Productos - Amigurumis
 * Generado: ${new Date().toLocaleString()}
 * Total productos: ${products.length}
 */

export const products = ${JSON.stringify(products, null, 2)};
`;
    
    // Obtener SHA del archivo actual
    const getResp = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/products.js`,
      { 
        headers: { 'Authorization': `token ${token}` }
      }
    );
    
    if (!getResp.ok) {
      throw new Error(`Acceso al repo: ${getResp.status}. Verifica el token y repo.`);
    }
    
    const fileData = await getResp.json();
    const sha = fileData.sha;
    
    // Hacer commit
    const updateResp = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/products.js`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `📦 Admin Update: ${products.length} productos • ${new Date().toLocaleString()}`,
          content: btoa(unescape(encodeURIComponent(content))),
          sha,
          committer: {
            name: 'Amigurumis Admin',
            email: 'admin@amigurumis.local'
          }
        })
      }
    );
    
    if (!updateResp.ok) {
      throw new Error(`Error en commit: ${updateResp.status}`);
    }
    
    showNotification('✅ ¡Publicado en GitHub! Render se actualizará en 1-2 minutos', 'success');
    localStorage.removeItem('adminProducts');
    
    setTimeout(() => {
      location.reload();
    }, 2000);
    
  } catch (err) {
    showNotification(`❌ Error: ${err.message}`, 'error');
    console.error('publishToGitHub error:', err);
  } finally {
    btn.disabled = false;
    btn.textContent = '📤 Publicar en GitHub';
  }
}

// ============ INICIALIZAR ============
window.openAdminPanel = function() {
  showLoginModal();
};
